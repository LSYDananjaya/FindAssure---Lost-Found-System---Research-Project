from __future__ import annotations

import argparse
import asyncio
from dataclasses import dataclass, asdict
import json
import logging
import mimetypes
import os
from pathlib import Path
import shutil
import sys
import tempfile
from typing import Any, Optional
from urllib.parse import urlparse
from urllib.request import Request, urlopen

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import text

logger = logging.getLogger("replay_reindex")


@dataclass
class ReplayRecord:
    found_item_id: str
    python_item_id: str
    analysis_mode: str
    image_urls: list[str]
    event_id: Optional[str] = None
    created_at: Optional[str] = None


class _NoopStorage:
    def store_multiview_result(self, *args, **kwargs) -> dict[str, Any]:
        return {"stored": False, "cache_key": None}


class _SavedUpload:
    def __init__(self, filename: str, path: str):
        self.filename = filename
        self.file = open(path, "rb")

    def close(self) -> None:
        self.file.close()


def _parse_json_value(value: Any) -> Any:
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return value
    return value


def _normalize_mode(raw_mode: Any, image_count: int) -> str:
    text_value = str(raw_mode or "").strip().lower()
    if text_value in {"pp1", "pp2"}:
        return text_value
    return "pp2" if image_count > 1 else "pp1"


def _load_records_from_founder_feedback(limit: Optional[int] = None, analysis_mode: Optional[str] = None) -> list[ReplayRecord]:
    from app.core.db import engine

    query = text(
        """
        SELECT found_item_id, python_item_id, analysis_mode, image_urls_json, event_id, created_at
        FROM founder_prefill_feedback
        ORDER BY created_at DESC, id DESC
        """
    )

    deduped: dict[str, ReplayRecord] = {}
    with engine.connect() as connection:
        rows = connection.execute(query)
        for row in rows:
            mapping = row._mapping
            found_item_id = str(mapping.get("found_item_id") or "").strip()
            python_item_id = str(mapping.get("python_item_id") or "").strip()
            if not found_item_id or not python_item_id:
                continue

            raw_urls = _parse_json_value(mapping.get("image_urls_json"))
            image_urls = [str(url).strip() for url in (raw_urls or []) if str(url).strip()]
            if not image_urls:
                continue

            mode = _normalize_mode(mapping.get("analysis_mode"), len(image_urls))
            if analysis_mode and mode != analysis_mode:
                continue

            dedupe_key = found_item_id
            if dedupe_key in deduped:
                continue

            deduped[dedupe_key] = ReplayRecord(
                found_item_id=found_item_id,
                python_item_id=python_item_id,
                analysis_mode=mode,
                image_urls=image_urls[:3],
                event_id=str(mapping.get("event_id") or "").strip() or None,
                created_at=str(mapping.get("created_at") or "").strip() or None,
            )
            if limit is not None and len(deduped) >= limit:
                break

    return list(deduped.values())


def _timestamp() -> str:
    from datetime import datetime

    return datetime.now().strftime("%Y%m%d-%H%M%S")


def _ensure_heif_registered() -> None:
    try:
        import pillow_heif

        pillow_heif.register_heif_opener()
    except Exception:
        logger.debug("HEIF opener not available", exc_info=True)


def _backup_and_reset_paths(index_path: Path, mapping_path: Path, backup_dir: Path) -> None:
    backup_dir.mkdir(parents=True, exist_ok=True)
    for path in (index_path, mapping_path):
        if path.exists():
            backup_target = backup_dir / path.name
            shutil.copy2(path, backup_target)
            logger.info("Backed up %s -> %s", path, backup_target)
            path.unlink()
            logger.info("Removed %s for fresh rebuild", path)


def _download_to_tempfile(url: str) -> str:
    parsed = urlparse(url)
    suffix = Path(parsed.path).suffix or mimetypes.guess_extension(mimetypes.guess_type(url)[0] or "") or ".jpg"
    request = Request(url, headers={"User-Agent": "FindAssure-Reindex/1.0"})
    with urlopen(request, timeout=60) as response:
        data = response.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as handle:
        handle.write(data)
        return handle.name


def _convert_heic_if_needed(path: str) -> str:
    suffix = Path(path).suffix.lower()
    if suffix not in {".heic", ".heif", ".heix", ".hevc"}:
        return path

    try:
        import pillow_heif
        from PIL import Image

        heif = pillow_heif.open_heif(path, convert_hdr_to_8bit=True)
        image = heif.to_pillow()
        target = str(Path(path).with_suffix(".jpg"))
        image.save(target, "JPEG", quality=92)
        os.remove(path)
        return target
    except Exception as exc:
        raise RuntimeError(f"Failed to convert HEIC/HEIF file {path}: {exc}") from exc


def _cleanup_paths(paths: list[str]) -> None:
    for path in paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception:
            logger.debug("Failed to delete temp file %s", path, exc_info=True)


def _select_accepted_pp1_detection(result: dict[str, Any] | list[dict[str, Any]]) -> Optional[dict[str, Any]]:
    detections = result if isinstance(result, list) else [result]
    for item in detections:
        if item and item.get("status") in {"accepted", "accepted_degraded"}:
            return item
    return None


def _initialize_replay_services(index_path: Path, mapping_path: Path) -> dict[str, Any]:
    from app.services.faiss_service import FaissService
    from app.services.yolo_service import YoloService
    from app.services.florence_service import FlorenceService
    from app.services.dino_embedder import DINOEmbedder
    from app.services.reasoner_factory import create_reasoner_from_settings
    from app.services.unified_pipeline import UnifiedPipeline
    from app.services.pp2_geometric_verifier import GeometricVerifier
    from app.services.pp2_multiview_verifier import MultiViewVerifier
    from app.services.pp2_fusion_service import MultiViewFusionService
    from app.services.pp2_multiview_pipeline import MultiViewPipeline

    faiss = FaissService(dim=128, index_path=str(index_path), mapping_path=str(mapping_path))
    faiss.load_or_create()

    yolo = YoloService()
    try:
        yolo.warmup()
    except Exception:
        logger.warning("YOLO warmup failed; continuing with loaded model", exc_info=True)

    florence = FlorenceService()
    dino = DINOEmbedder()
    gemini = create_reasoner_from_settings()
    unified = UnifiedPipeline(yolo=yolo, florence=florence, gemini=gemini, dino=dino)
    verifier = MultiViewVerifier(geometric_service=GeometricVerifier())
    fusion = MultiViewFusionService()
    multiview = MultiViewPipeline(
        yolo=yolo,
        florence=florence,
        dino=dino,
        verifier=verifier,
        fusion=fusion,
        faiss=faiss,
        gemini=gemini,
    )
    return {
        "faiss": faiss,
        "unified": unified,
        "multiview": multiview,
    }


def _crop_pp1_image(image_path: str, bbox: Any):
    from PIL import Image
    from app.domain.bbox_utils import clip_bbox

    image = Image.open(image_path).convert("RGB")
    if not isinstance(bbox, (list, tuple)) or len(bbox) != 4:
        return image
    w, h = image.size
    x1, y1, x2, y2 = clip_bbox((bbox[0], bbox[1], bbox[2], bbox[3]), w, h)
    if x2 <= x1 or y2 <= y1:
        return image
    return image.crop((x1, y1, x2, y2))


def _build_pp1_metadata(existing_python_item_id: str, detection: dict[str, Any], image_path: str) -> dict[str, Any]:
    from app.domain.color_utils import normalize_color
    from app.services.image_search_reranker import (
        build_color_histogram,
        collect_search_tokens,
        extract_brand_tokens,
    )

    embeddings = detection.get("embeddings") or {}
    vector_768 = embeddings.get("vector_dinov2") or []
    ocr_text = str(detection.get("ocr_text") or detection.get("ocr_text_display") or "").strip()
    category = str(detection.get("label") or "").strip()
    raw_color = str(detection.get("color") or "").strip()
    normalized_color = normalize_color(raw_color) or None
    crop = _crop_pp1_image(image_path, detection.get("bbox"))
    histogram = build_color_histogram(crop)
    brand_tokens = extract_brand_tokens([ocr_text, detection.get("final_description"), detection.get("detailed_description")])

    metadata: dict[str, Any] = {
        "item_id": existing_python_item_id,
        "embedding_id": f"{existing_python_item_id}_pp1",
        "view_index": 0,
        "category": category,
        "label": category,
        "color": raw_color or None,
        "normalized_color": normalized_color,
        "ocr_tokens": collect_search_tokens(ocr_text),
        "brand": brand_tokens[0] if brand_tokens else None,
        "brand_tokens": brand_tokens,
        "source": "pp1_replay",
    }
    if histogram is not None:
        metadata["color_histogram"] = [float(v) for v in histogram.tolist()]
    if isinstance(vector_768, list) and vector_768:
        metadata["rerank_vector_768"] = [float(v) for v in vector_768]
    return metadata


def _replay_pp1_record(record: ReplayRecord, services: dict[str, Any]) -> dict[str, Any]:
    temp_paths: list[str] = []
    try:
        temp_path = _convert_heic_if_needed(_download_to_tempfile(record.image_urls[0]))
        temp_paths.append(temp_path)
        result = services["unified"].process_pp1(temp_path)
        detection = _select_accepted_pp1_detection(result)
        if detection is None:
            return {"status": "failed", "reason": "no_accepted_pp1_detection"}

        vector_128 = (detection.get("embeddings") or {}).get("vector_128d") or []
        if len(vector_128) != 128:
            return {"status": "failed", "reason": "invalid_pp1_vector_128d"}

        metadata = _build_pp1_metadata(record.python_item_id, detection, temp_path)
        faiss_id = services["faiss"].add(vector_128, metadata)
        return {"status": "indexed", "faiss_id": int(faiss_id), "analysis_mode": "pp1"}
    finally:
        _cleanup_paths(temp_paths)


async def _replay_pp2_record_async(record: ReplayRecord, services: dict[str, Any]) -> dict[str, Any]:
    temp_paths: list[str] = []
    uploads: list[_SavedUpload] = []
    try:
        for url in record.image_urls[:3]:
            temp_path = _convert_heic_if_needed(_download_to_tempfile(url))
            temp_paths.append(temp_path)
            uploads.append(_SavedUpload(Path(temp_path).name, temp_path))

        faiss_service = services["faiss"]
        before_total = int(faiss_service.index.ntotal) if faiss_service.index is not None else 0
        result = await services["multiview"].analyze(
            uploads,
            storage=_NoopStorage(),
            request_id=f"reindex-{record.found_item_id}",
        )
        if not getattr(result, "verification", None) or not bool(result.verification.passed):
            return {"status": "failed", "reason": "pp2_verification_failed"}

        after_total = int(faiss_service.index.ntotal) if faiss_service.index is not None else before_total
        if after_total <= before_total:
            return {"status": "failed", "reason": "pp2_no_new_faiss_vector"}

        faiss_id = after_total - 1
        existing = faiss_service.mapping.get(int(faiss_id), {})
        existing["item_id"] = record.python_item_id
        existing["fused_embedding_id"] = f"{record.python_item_id}_fused"
        existing["embedding_id"] = f"{record.python_item_id}_fused"
        existing["source"] = "pp2_replay"
        faiss_service.mapping[int(faiss_id)] = existing
        return {"status": "indexed", "faiss_id": int(faiss_id), "analysis_mode": "pp2"}
    finally:
        for upload in uploads:
            upload.close()
        _cleanup_paths(temp_paths)


def _replay_pp2_record(record: ReplayRecord, services: dict[str, Any]) -> dict[str, Any]:
    return asyncio.run(_replay_pp2_record_async(record, services))


def _default_data_path(raw_value: str) -> Path:
    candidate = Path(raw_value)
    if candidate.is_absolute():
        return candidate
    return (PROJECT_ROOT / raw_value).resolve()


def _configure_logging(verbose: bool) -> None:
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Replay founder-uploaded images to rebuild the FAISS image index.")
    parser.add_argument("--limit", type=int, default=None, help="Replay only the most recent N records.")
    parser.add_argument("--analysis-mode", choices=["pp1", "pp2"], default=None, help="Replay only one analysis mode.")
    parser.add_argument("--dry-run", action="store_true", help="List candidate replay records without rebuilding the index.")
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging.")
    parser.add_argument("--index-path", default="data/faiss.index", help="Target FAISS index path.")
    parser.add_argument("--mapping-path", default="data/faiss_mapping.json", help="Target FAISS mapping path.")
    parser.add_argument("--backup-dir", default=None, help="Backup directory for old index files.")
    parser.add_argument("--report-path", default=None, help="Optional JSON output path for the replay report.")
    args = parser.parse_args()

    _configure_logging(args.verbose)
    _ensure_heif_registered()

    records = _load_records_from_founder_feedback(limit=args.limit, analysis_mode=args.analysis_mode)
    if args.dry_run:
        preview = [asdict(record) for record in records[: min(len(records), 10)]]
        payload = {"count": len(records), "preview": preview}
        print(json.dumps(payload, indent=2))
        return 0

    index_path = _default_data_path(args.index_path)
    mapping_path = _default_data_path(args.mapping_path)
    backup_dir = _default_data_path(args.backup_dir) if args.backup_dir else index_path.parent / "reindex-backups" / _timestamp()
    index_path.parent.mkdir(parents=True, exist_ok=True)
    mapping_path.parent.mkdir(parents=True, exist_ok=True)

    _backup_and_reset_paths(index_path, mapping_path, backup_dir)
    services = _initialize_replay_services(index_path=index_path, mapping_path=mapping_path)

    summary: dict[str, Any] = {
        "total_records": len(records),
        "indexed": 0,
        "failed": 0,
        "backup_dir": str(backup_dir),
        "index_path": str(index_path),
        "mapping_path": str(mapping_path),
        "records": [],
    }

    for record in records:
        logger.info(
            "Replaying found_item_id=%s analysis_mode=%s python_item_id=%s image_count=%d",
            record.found_item_id,
            record.analysis_mode,
            record.python_item_id,
            len(record.image_urls),
        )
        try:
            if record.analysis_mode == "pp1":
                result = _replay_pp1_record(record, services)
            else:
                result = _replay_pp2_record(record, services)
        except Exception as exc:
            logger.exception("Replay failed for found_item_id=%s", record.found_item_id)
            result = {"status": "failed", "reason": str(exc)}

        row = {
            "found_item_id": record.found_item_id,
            "python_item_id": record.python_item_id,
            "analysis_mode": record.analysis_mode,
            **result,
        }
        summary["records"].append(row)
        if result.get("status") == "indexed":
            summary["indexed"] += 1
        else:
            summary["failed"] += 1

    services["faiss"].save()
    if args.report_path:
        report_path = _default_data_path(args.report_path)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
