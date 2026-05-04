"""Image-based retrieval routes backed by DINO vectors and FAISS.

Module overview:
- The query image is cropped in several ways so background-heavy photos still
  get a useful object vector.
- FAISS performs fast visual recall, then reranking combines vector score with
  category, color, OCR, and brand evidence.
- This route is retrieval only; it does not create found-item records.
"""

from __future__ import annotations

from io import BytesIO
from typing import Any, Optional

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
import numpy as np
from PIL import Image

from app.domain.bbox_utils import clip_bbox
from app.domain.category_specs import canonicalize_label
from app.schemas.search_schemas import IndexVectorRequest, IndexVectorResponse, SearchByImageResponse, SearchMatch
from app.services.image_preprocessing import extract_pixel_dominant_color
from app.services.image_search_reranker import (
    SearchQueryContext,
    build_color_histogram,
    build_item_metadata,
    collect_search_tokens,
    extract_brand_tokens,
    parse_vector,
    rerank_score,
    resolve_candidate_category,
    vector_similarity,
)

router = APIRouter()

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


def _is_fused_hit(entry: dict[str, Any]) -> bool:
    payload = entry.get("metadata") if isinstance(entry.get("metadata"), dict) else entry
    return bool(payload.get("fused_embedding_id")) or ("view_index" in payload and payload.get("view_index") is None)


def _pick_canonical_hit(hits: list[dict[str, Any]]) -> tuple[dict[str, Any], str]:
    """Prefer the fused PP2 vector when duplicate view vectors point to one item."""

    fused_hits = [hit for hit in hits if _is_fused_hit(hit)]
    if fused_hits:
        return min(fused_hits, key=lambda hit: int(hit["faiss_id"])), "canonical_full_vs_fused"
    return min(hits, key=lambda hit: int(hit["faiss_id"])), "canonical_full_vs_fallback"


def _best_detection_category(detection: Any) -> Optional[str]:
    raw = getattr(detection, "cls_name", None)
    if raw is None:
        raw = getattr(detection, "label", None)
    if raw is None:
        return None
    return canonicalize_label(str(raw).strip()) or str(raw).strip() or None


def _prepare_search_crops(
    pipeline: Any,
    image: Image.Image,
) -> tuple[list[tuple[str, Image.Image]], list[Any], Optional[str]]:
    """Build query crops for robust search.

    Design note: using YOLO crop, center crop, and full image protects search from
    noisy backgrounds and from cases where detection is missing or imperfect.
    """

    crops: list[tuple[str, Image.Image]] = []
    detections = pipeline.yolo.detect_objects(image)
    inferred_category = None

    if detections:
        best = max(detections, key=lambda det: float(getattr(det, "confidence", 0.0)))
        inferred_category = _best_detection_category(best)
        x1, y1, x2, y2 = getattr(best, "bbox", (0, 0, image.size[0], image.size[1]))
        w, h = image.size
        x1, y1, x2, y2 = clip_bbox((x1, y1, x2, y2), w, h)
        if x2 > x1 and y2 > y1:
            crops.append(("yolo", image.crop((x1, y1, x2, y2))))

    w, h = image.size
    cx, cy = w / 2, h / 2
    cw, ch = w * 0.7, h * 0.7
    cc_x1 = max(0, int(cx - cw / 2))
    cc_y1 = max(0, int(cy - ch / 2))
    cc_x2 = min(w, int(cx + cw / 2))
    cc_y2 = min(h, int(cy + ch / 2))
    if cc_x2 > cc_x1 and cc_y2 > cc_y1:
        crops.append(("center", image.crop((cc_x1, cc_y1, cc_x2, cc_y2))))

    crops.append(("full", image))
    return crops, detections, inferred_category


def _extract_query_context(
    pipeline: Any,
    primary_crop: Image.Image,
    primary_view: str,
    inferred_category: Optional[str],
) -> SearchQueryContext:
    """Extract non-vector evidence used to rerank FAISS recall candidates."""

    ocr_text = ""
    query_color = extract_pixel_dominant_color(primary_crop)

    florence = getattr(pipeline, "florence", None)
    if florence is not None and hasattr(florence, "ocr_structured"):
        try:
            ocr_payload = florence.ocr_structured(primary_crop, profile="fast")
            ocr_text = str(ocr_payload.get("ocr_text", "") or "").strip()
        except Exception:
            ocr_text = ""

    query_vec_768 = None
    if hasattr(pipeline.dino, "embed_768"):
        try:
            query_vec_768 = np.asarray(pipeline.dino.embed_768(primary_crop), dtype=np.float32)
        except Exception:
            query_vec_768 = None

    query_vec_128 = np.asarray(pipeline.dino.embed_128(primary_crop), dtype=np.float32)
    return SearchQueryContext(
        category=inferred_category,
        normalized_color=query_color,
        ocr_tokens=collect_search_tokens(ocr_text),
        brand_tokens=extract_brand_tokens(ocr_text),
        color_histogram=build_color_histogram(primary_crop),
        rerank_vector_768=query_vec_768,
        base_vector_128=query_vec_128,
        primary_view=primary_view,
    )


def _effective_category_filter(explicit_category: Optional[str], inferred_category: Optional[str]) -> Optional[str]:
    if explicit_category:
        canonical = canonicalize_label(explicit_category)
        return canonical or explicit_category
    return inferred_category


@router.post("/index_vector", response_model=IndexVectorResponse)
async def index_vector(request: Request, payload: IndexVectorRequest):
    """Store an already computed 128d vector in FAISS with item metadata."""

    pipeline = getattr(request.app.state, "multiview_pipeline", None)
    if pipeline is None or getattr(pipeline, "faiss", None) is None:
        raise HTTPException(status_code=500, detail="FAISS pipeline is not initialized.")

    vector = np.array(payload.vector_128d, dtype=np.float32)
    metadata = payload.metadata or {}

    try:
        faiss_id = pipeline.faiss.add(vector, metadata)
        pipeline.faiss.save()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to index vector: {exc}")

    return IndexVectorResponse(faiss_id=int(faiss_id))


@router.post("/by-image", response_model=SearchByImageResponse)
async def search_by_image(
    request: Request,
    file: UploadFile = File(...),
    top_k: int = Form(1),
    min_score: float = Form(0.75),
    category: str = Form(None),
    candidate_k: int | None = Form(None),
    strict_color: bool = Form(False),
    return_debug_scores: bool = Form(False),
):
    pipeline = getattr(request.app.state, "multiview_pipeline", None)
    if pipeline is None or getattr(pipeline, "faiss", None) is None:
        raise HTTPException(status_code=500, detail="FAISS pipeline is not initialized.")

    if top_k < 1 or top_k > 50:
        raise HTTPException(status_code=400, detail="top_k must be between 1 and 50.")
    if min_score < 0 or min_score > 1:
        raise HTTPException(status_code=400, detail="min_score must be between 0 and 1.")
    if candidate_k is not None and (candidate_k < 10 or candidate_k > 200):
        raise HTTPException(status_code=400, detail="candidate_k must be between 10 and 200.")

    try:
        content = await file.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.")
        image = Image.open(BytesIO(content)).convert("RGB")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image input: {exc}")

    try:
        crops, _detections, inferred_category = _prepare_search_crops(pipeline, image)
        primary_view, primary_crop = crops[0]
        query_context = _extract_query_context(pipeline, primary_crop, primary_view, inferred_category)
        # FAISS gives high-recall visual candidates. The later reranker is where
        # category, color, OCR, and brand evidence decide which candidates are
        # strong enough to show to the owner.
        category_filter = _effective_category_filter(category.strip() if category else None, query_context.category)

        all_results: list[dict[str, Any]] = []
        recall_k = int(candidate_k or min(100, max(top_k * 20, 60)))
        for query_view, crop_img in crops:
            vec_128 = pipeline.dino.embed_128(crop_img)
            results = pipeline.faiss.search(vec_128, top_k=recall_k)
            for entry in results:
                entry["query_view"] = query_view
            all_results.extend(results)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Search pipeline failed: {exc}")

    best_by_faiss_id: dict[int, dict[str, Any]] = {}
    for entry in all_results:
        fid = int(entry.get("faiss_id", -1))
        score = float(entry.get("score", 0.0))
        if fid not in best_by_faiss_id or score > float(best_by_faiss_id[fid].get("score", 0.0)):
            best_by_faiss_id[fid] = entry
    deduped_results = list(best_by_faiss_id.values())

    ann_floor = max(0.45, float(min_score) - 0.15)
    per_item_hits: dict[str, list[dict[str, Any]]] = {}
    for entry in deduped_results:
        score = float(entry.get("score", 0.0))
        if score < ann_floor:
            continue

        raw_item_id = entry.get("item_id")
        if raw_item_id is None:
            continue
        item_id = str(raw_item_id).strip()
        if not item_id:
            continue

        faiss_id = int(entry.get("faiss_id"))
        metadata = {k: v for k, v in entry.items() if k not in {"score", "faiss_id", "item_id"}}
        per_item_hits.setdefault(item_id, []).append(
            {
                "score": score,
                "faiss_id": faiss_id,
                "metadata": metadata,
            }
        )

    matches: list[SearchMatch] = []
    for item_id, hits in per_item_hits.items():
        best_hit = max(hits, key=lambda hit: float(hit["score"]))
        canonical_hit, canonical_source = _pick_canonical_hit(hits)
        canonical_metadata = build_item_metadata(hits, dict(canonical_hit["metadata"]))

        candidate_category = resolve_candidate_category(canonical_metadata)
        if category_filter and candidate_category and candidate_category.lower() != category_filter.lower():
            continue

        base_vector_score: Optional[float] = None
        score_source = canonical_source

        rerank_candidate_vec = parse_vector(
            canonical_metadata.get("rerank_vector_768"),
            expected_dim=(int(query_context.rerank_vector_768.size) if query_context.rerank_vector_768 is not None else None),
        )
        if query_context.rerank_vector_768 is not None and rerank_candidate_vec is not None:
            base_vector_score = vector_similarity(query_context.rerank_vector_768, rerank_candidate_vec)
            score_source = "rerank_768_precision"

        if base_vector_score is None:
            try:
                canonical_vec = pipeline.faiss.get_vector(int(canonical_hit["faiss_id"]))
                if query_context.base_vector_128 is None:
                    continue
                base_vector_score = float(pipeline.faiss.compute_similarity(query_context.base_vector_128, canonical_vec))
                score_source = "rerank_128_precision"
            except Exception as exc:
                raise HTTPException(status_code=500, detail=f"Canonical scoring failed: {exc}")

        accepted, reranked_value, debug = rerank_score(
            query=query_context,
            candidate_metadata=canonical_metadata,
            base_vector_score=float(base_vector_score),
            strict_color=bool(strict_color),
        )
        if not accepted or reranked_value < min_score:
            continue

        canonical_metadata["canonical_from_faiss_id"] = int(canonical_hit["faiss_id"])
        canonical_metadata["canonical_query_view"] = query_context.primary_view
        if return_debug_scores:
            canonical_metadata["rerank_debug"] = debug

        vector_hits = [
            {
                "score": float(hit["score"]),
                "faiss_id": int(hit["faiss_id"]),
                "metadata": dict(hit["metadata"]),
            }
            for hit in sorted(hits, key=lambda hit: float(hit["score"]), reverse=True)
        ]

        matches.append(
            SearchMatch(
                score=float(reranked_value),
                canonical_score=float(base_vector_score),
                best_hit_score=float(best_hit["score"]),
                score_source=score_source,
                faiss_id=int(canonical_hit["faiss_id"]),
                item_id=item_id,
                metadata=canonical_metadata,
                vector_hits=vector_hits,
                vector_hits_count=len(vector_hits),
            )
        )

    matches.sort(key=lambda item: (float(item.score), float(item.canonical_score), float(item.best_hit_score)), reverse=True)
    matches = matches[:top_k]

    return SearchByImageResponse(
        top_k=top_k,
        min_score=min_score,
        category_filter=category_filter,
        matches=matches,
    )
