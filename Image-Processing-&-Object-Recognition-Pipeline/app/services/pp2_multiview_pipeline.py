import uuid
import cv2
import numpy as np
import io
import time
import logging
import re
from collections import Counter
from PIL import Image
from typing import Any, Dict, List, Optional, Tuple
from fastapi import UploadFile

from app.schemas.pp2_schemas import (
    PP2Response,
    PP2PerViewResult,
    PP2PerViewDetection,
    PP2PerViewExtraction,
    PP2PerViewEmbedding
)

# Services
from app.services.yolo_service import YoloService
from app.services.florence_service import FlorenceService
from app.services.dino_embedder import DINOEmbedder
from app.services.pp2_fusion_service import MultiViewFusionService
from app.services.pp2_multiview_verifier import MultiViewVerifier
from app.services.storage_service import StorageService
from app.services.faiss_service import FaissService
from app.config.settings import settings
from app.domain.category_specs import canonicalize_label

logger = logging.getLogger(__name__)


class MultiViewPipeline:
    PP2_TOP_K_DETECTIONS = 5
    LITE_EXTRACTION_CONFIDENCE = 0.4
    HINT_KEYWORDS: Dict[str, List[str]] = {
        "Helmet": ["helmet", "visor", "face shield", "chin strap", "headgear"],
        "Wallet": ["wallet", "card", "cash", "clasp"],
        "Smart Phone": ["phone", "screen", "camera", "smartphone"],
        "Earbuds - Earbuds case": ["earbuds", "earphone", "charging case"],
    }
    HINT_PRIORITY: List[str] = [
        "Helmet",
        "Wallet",
        "Smart Phone",
        "Earbuds - Earbuds case",
    ]

    def __init__(
        self, 
        yolo: YoloService, 
        florence: FlorenceService, 
        dino: DINOEmbedder, 
        verifier: MultiViewVerifier, 
        fusion: MultiViewFusionService, 
        faiss: FaissService
    ):
        self.yolo = yolo
        self.florence = florence
        self.dino = dino
        self.verifier = verifier
        self.fusion = fusion
        self.faiss = faiss
        self.perf_profile = str(settings.PERF_PROFILE).lower()

    @staticmethod
    def _normalize_string_list(value: Any) -> List[str]:
        """Coerce mixed list payloads into clean string lists."""
        if not isinstance(value, list):
            return []

        out: List[str] = []
        for item in value:
            if item is None:
                continue
            text = item if isinstance(item, str) else str(item)
            text = text.strip()
            if text:
                out.append(text)
        return out

    def _normalize_extraction_payload(self, extraction_data: Any) -> Dict[str, Any]:
        """
        Normalize extractor output into the PP2 extraction contract.
        Ensures grounded_features is always a dict and OCR uses ocr_text first.
        """
        data = extraction_data if isinstance(extraction_data, dict) else {}

        caption_raw = data.get("caption", "")
        caption = caption_raw if isinstance(caption_raw, str) else str(caption_raw or "")

        if "ocr_text" in data:
            ocr_raw = data.get("ocr_text", "")
        else:
            ocr_raw = data.get("ocr", "")

        if isinstance(ocr_raw, list):
            ocr_text = " ".join(self._normalize_string_list(ocr_raw))
        elif ocr_raw is None:
            ocr_text = ""
        else:
            ocr_text = ocr_raw if isinstance(ocr_raw, str) else str(ocr_raw)

        grounded_raw = data.get("grounded_features", {})
        if isinstance(grounded_raw, dict):
            grounded_features: Dict[str, Any] = dict(grounded_raw)
        elif isinstance(grounded_raw, list):
            normalized_features = self._normalize_string_list(grounded_raw)
            grounded_features = {"features": normalized_features} if normalized_features else {}
        else:
            grounded_features = {}

        defects = self._normalize_string_list(data.get("grounded_defects"))
        if defects:
            existing = grounded_features.get("defects")
            if isinstance(existing, list):
                grounded_features["defects"] = self._normalize_string_list(existing) + defects
            elif "defects" not in grounded_features:
                grounded_features["defects"] = defects

        attachments = self._normalize_string_list(data.get("grounded_attachments"))
        if attachments:
            existing = grounded_features.get("attachments")
            if isinstance(existing, list):
                grounded_features["attachments"] = self._normalize_string_list(existing) + attachments
            elif "attachments" not in grounded_features:
                grounded_features["attachments"] = attachments

        color_vqa = data.get("color_vqa")
        if isinstance(color_vqa, str):
            color_vqa = color_vqa.strip()
            if color_vqa and "color" not in grounded_features:
                grounded_features["color"] = color_vqa

        key_count = data.get("key_count")
        if isinstance(key_count, int) and not isinstance(key_count, bool) and "key_count" not in grounded_features:
            grounded_features["key_count"] = key_count

        return {
            "caption": caption,
            "ocr_text": ocr_text,
            "grounded_features": grounded_features,
        }

    def _load_image(self, file: UploadFile) -> Image.Image:
        """Loads UploadFile bytes into a PIL Image."""
        content = file.file.read()
        file.file.seek(0)
        return Image.open(io.BytesIO(content)).convert("RGB")

    def _compute_quality(self, image: Image.Image) -> float:
        """
        Computes a scalar quality score based on Laplacian variance (sharpness).
        Returns value used for ranking views.
        """
        try:
            cv_img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)
            variance = cv2.Laplacian(cv_img, cv2.CV_64F).var()
            # Normalize reasonably for display (log scale or just raw)
            # Simple heuristic: > 100 is usually okay.
            return float(variance)
        except Exception:
            return 0.0

    @staticmethod
    def _label_conf_pairs(detections: List[Any]) -> List[Tuple[str, float]]:
        return [(str(det.label), float(det.confidence)) for det in detections]

    @staticmethod
    def _normalize_hint_text(text: Any) -> str:
        if text is None:
            return ""
        if isinstance(text, str):
            raw = text
        else:
            raw = str(text)
        normalized = raw.lower().strip()
        normalized = re.sub(r"\s+", " ", normalized)
        return normalized

    @staticmethod
    def _text_has_keyword(text: str, keyword: str) -> bool:
        if not text or not keyword:
            return False
        kw = str(keyword).strip().lower()
        if not kw:
            return False
        pattern = r"\b" + re.escape(kw).replace(r"\ ", r"\s+") + r"\b"
        return re.search(pattern, text) is not None

    def infer_canonical_hint(self, caption: str, ocr_text: str) -> Optional[str]:
        caption_text = self._normalize_hint_text(caption)
        ocr_text_norm = self._normalize_hint_text(ocr_text)

        # Strong explicit OCR signal for helmets.
        if self._text_has_keyword(ocr_text_norm, "helmet"):
            return "Helmet"

        scores: Dict[str, int] = {}
        for label, keywords in self.HINT_KEYWORDS.items():
            score = 0
            for keyword in keywords:
                if self._text_has_keyword(caption_text, keyword):
                    score += 1
                if self._text_has_keyword(ocr_text_norm, keyword):
                    score += 2
            scores[label] = score

        best_score = max(scores.values()) if scores else 0
        if best_score <= 0:
            return None

        priority = {label: idx for idx, label in enumerate(self.HINT_PRIORITY)}
        winners = [label for label, score in scores.items() if score == best_score]
        winners.sort(key=lambda label: (priority.get(label, len(priority)), label))
        return winners[0]

    def _choose_consensus_label(self, per_view_detections: List[List[Any]]) -> Tuple[Optional[str], str]:
        """
        Choose a cross-view consensus label.
        Priority:
          1) strict majority among per-view top-1 labels
          2) fallback ranking over top-K labels:
             (view_coverage_count, summed_best_confidence, best_single_confidence, label asc)
        """
        top1_labels = [str(dets[0].label) for dets in per_view_detections if dets]
        if top1_labels:
            counts = Counter(top1_labels)
            winner, count = counts.most_common(1)[0]
            if count > (len(top1_labels) / 2.0):
                return winner, "strict_majority"

        label_stats: Dict[str, Dict[str, float]] = {}
        for detections in per_view_detections:
            if not detections:
                continue
            per_view_best: Dict[str, float] = {}
            for det in detections:
                label = str(det.label)
                conf = float(det.confidence)
                existing = per_view_best.get(label)
                if existing is None or conf > existing:
                    per_view_best[label] = conf

            for label, best_conf in per_view_best.items():
                stats = label_stats.setdefault(
                    label,
                    {"coverage": 0.0, "sum_conf": 0.0, "best_conf": 0.0},
                )
                stats["coverage"] += 1.0
                stats["sum_conf"] += best_conf
                stats["best_conf"] = max(float(stats["best_conf"]), best_conf)

        if not label_stats:
            return None, "no_consensus"

        ranked = sorted(
            label_stats.items(),
            key=lambda item: (
                -item[1]["coverage"],
                -item[1]["sum_conf"],
                -item[1]["best_conf"],
                item[0],
            ),
        )
        return ranked[0][0], "coverage_conf_fallback"

    def _choose_consensus_label_with_hints(
        self,
        per_view_detections: List[List[Any]],
        canonical_hints: List[Optional[str]],
    ) -> Tuple[Optional[str], str, Dict[str, int]]:
        hint_votes = Counter([hint for hint in canonical_hints if hint])
        if hint_votes:
            top_vote_count = max(hint_votes.values())
            if top_vote_count >= 2:
                priority = {label: idx for idx, label in enumerate(self.HINT_PRIORITY)}
                winners = [label for label, count in hint_votes.items() if count == top_vote_count]
                winners.sort(key=lambda label: (priority.get(label, len(priority)), label))
                return winners[0], "hint_majority", {label: int(count) for label, count in hint_votes.items()}

        fallback_label, fallback_strategy = self._choose_consensus_label(per_view_detections)
        return fallback_label, fallback_strategy, {label: int(count) for label, count in hint_votes.items()}

    def _select_detection_for_view(
        self,
        detections: List[Any],
        consensus_label: Optional[str],
    ) -> Tuple[Optional[Any], bool]:
        """
        Select final detection for a view.
        Returns (selected_detection, label_outlier).
        """
        if not detections:
            return None, bool(consensus_label)
        if not consensus_label:
            return detections[0], False

        consensus_canonical = canonicalize_label(str(consensus_label)) or str(consensus_label)
        matching = []
        for det in detections:
            det_label = str(det.label)
            det_canonical = canonicalize_label(det_label) or det_label
            if det_canonical == consensus_canonical:
                matching.append(det)
        if matching:
            best = max(matching, key=lambda det: float(getattr(det, "confidence", 0.0)))
            return best, False
        return detections[0], True

    async def analyze(self, files: List[UploadFile], storage: StorageService) -> PP2Response:
        request_start = time.perf_counter()
        profile = self.perf_profile
        item_id = str(uuid.uuid4())
        per_view_results = []
        vectors = []
        crops = []
        per_view_ms: List[float] = []
        label_outliers: Dict[int, bool] = {}
        view_meta_by_index: Dict[int, Dict[str, Any]] = {}
        view_inputs: List[Dict[str, Any]] = []
        crop_by_index: Dict[int, Image.Image] = {}
        canonical_label_by_index: Dict[int, str] = {}
        canonical_hint_by_index: Dict[int, Optional[str]] = {}
        lite_ms_by_index: Dict[int, float] = {}
        florence_lite_total_ms = 0.0

        # 1. Detection + lite extraction pass
        for i, file in enumerate(files):
            view_start = time.perf_counter()
            pil_img = self._load_image(file)
            filename = file.filename or f"view_{i}.jpg"
            detections = self.yolo.detect_objects(
                pil_img,
                max_detections=self.PP2_TOP_K_DETECTIONS,
            )
            logger.debug(
                "PP2_VIEW_TOPK view=%d labels=%s",
                i,
                self._label_conf_pairs(detections),
            )

            provisional_det = detections[0] if detections else None
            if provisional_det:
                provisional_bbox = provisional_det.bbox
                w, h = pil_img.size
                x1, y1, x2, y2 = provisional_bbox
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)
                if x2 > x1 and y2 > y1:
                    provisional_crop = pil_img.crop((x1, y1, x2, y2))
                else:
                    provisional_crop = pil_img
                provisional_label = str(provisional_det.label)
            else:
                provisional_crop = pil_img
                provisional_label = "unknown"

            lite_start = time.perf_counter()
            try:
                lite_extraction_raw = self.florence.analyze_crop(
                    provisional_crop,
                    canonical_label=provisional_label if provisional_label != "unknown" else None,
                    profile=profile,
                    mode="lite",
                )
            except Exception:
                logger.exception("PP2_LITE_EXTRACTION_FAILED view=%d", i)
                lite_extraction_raw = {}
            lite_duration_ms = (time.perf_counter() - lite_start) * 1000.0
            lite_extraction = self._normalize_extraction_payload(lite_extraction_raw)
            raw_lite = lite_extraction_raw.get("raw", {}) if isinstance(lite_extraction_raw, dict) else {}
            timings = raw_lite.get("timings", {}) if isinstance(raw_lite, dict) else {}
            lite_ms = timings.get("lite_ms") if isinstance(timings, dict) else None
            if not isinstance(lite_ms, (int, float)):
                lite_ms = lite_duration_ms
            lite_ms_float = float(lite_ms)
            florence_lite_total_ms += lite_ms_float

            canonical_hint = self.infer_canonical_hint(
                caption=lite_extraction.get("caption", ""),
                ocr_text=lite_extraction.get("ocr_text", ""),
            )
            canonical_hint_by_index[i] = canonical_hint
            lite_ms_by_index[i] = lite_ms_float
            logger.debug(
                "PP2_VIEW_LITE view=%d provisional_label=%s canonical_hint=%s florence_lite_ms=%.2f",
                i,
                provisional_label,
                canonical_hint,
                lite_ms_float,
            )

            view_inputs.append(
                {
                    "view_index": i,
                    "filename": filename,
                    "image": pil_img,
                    "detections": detections,
                    "view_start": view_start,
                    "lite_extraction": lite_extraction,
                    "canonical_hint": canonical_hint,
                    "florence_lite_ms": lite_ms_float,
                }
            )

        # 2. Cross-view consensus (hint-first, then YOLO fallback)
        per_view_detections = [entry["detections"] for entry in view_inputs]
        hint_list = [entry.get("canonical_hint") for entry in view_inputs]
        top1_votes = [str(dets[0].label) for dets in per_view_detections if dets]
        consensus_label, consensus_strategy, hint_votes = self._choose_consensus_label_with_hints(
            per_view_detections,
            hint_list,
        )
        logger.debug(
            "PP2_LABEL_CONSENSUS top1_votes=%s hint_votes=%s chosen_label=%s strategy=%s",
            top1_votes,
            hint_votes,
            consensus_label,
            consensus_strategy,
        )

        # 3. Process each view using consensus-aligned selection
        for entry in view_inputs:
            i = int(entry["view_index"])
            filename = str(entry["filename"])
            pil_img = entry["image"]
            detections = entry["detections"]

            selected_det, label_outlier = self._select_detection_for_view(detections, consensus_label)
            label_outliers[i] = label_outlier

            if selected_det:
                bbox = selected_det.bbox
                w, h = pil_img.size
                x1, y1, x2, y2 = bbox
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)

                if x2 > x1 and y2 > y1:
                    crop = pil_img.crop((x1, y1, x2, y2))
                else:
                    crop = pil_img

                cls_name = str(selected_det.label)
                det_conf = float(selected_det.confidence)
            else:
                # Fallback: Whole Image
                bbox = (0.0, 0.0, float(pil_img.width), float(pil_img.height))
                crop = pil_img
                cls_name = "unknown"
                det_conf = 0.0

            canonical_label = consensus_label or cls_name
            canonical_differs = canonical_label != cls_name
            logger.debug(
                "PP2_VIEW_SELECTION view=%d selected_label=%s canonical_label=%s canonical_differs=%s selected_conf=%.4f outlier=%s",
                i,
                cls_name,
                canonical_label,
                canonical_differs,
                det_conf,
                label_outlier,
            )
            view_meta_by_index[i] = {
                "final_label": cls_name,
                "selected_label": cls_name,
                "canonical_label": canonical_label,
                "label_outlier": label_outlier,
                "canonical_hint": canonical_hint_by_index.get(i),
                "florence_lite_ms": lite_ms_by_index.get(i),
            }
            
            crop_by_index[i] = crop
            canonical_label_by_index[i] = canonical_label

            # C. Embedding (DINO) - Stage 1 fast path
            # Used for verification
            vector = self.dino.embed_128(crop) # Returns list[float]
            
            # Collect for verification
            vectors.append(vector)
            crops.append(crop)

            # E. Quality
            quality = self._compute_quality(crop)
            
            # E. Build Stage-1 Result Object (placeholder extraction, real extraction deferred)
            lite_extraction = entry.get("lite_extraction", {})
            per_view_results.append(PP2PerViewResult(
                view_index=i,
                filename=filename,
                detection=PP2PerViewDetection(
                    bbox=(float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])),
                    cls_name=cls_name,
                    confidence=det_conf
                ),
                extraction=PP2PerViewExtraction(
                    caption=str(lite_extraction.get("caption", "")),
                    ocr_text=str(lite_extraction.get("ocr_text", "")),
                    grounded_features=lite_extraction.get("grounded_features", {}),
                    extraction_confidence=self.LITE_EXTRACTION_CONFIDENCE,
                ),
                embedding=PP2PerViewEmbedding(
                    dim=len(vector),
                    vector_preview=vector[:8],
                    vector_id=f"{item_id}_view_{i}"
                ),
                quality_score=quality
            ))
            per_view_ms.append((time.perf_counter() - float(entry["view_start"])) * 1000.0)

        outlier_views = sorted([idx for idx, is_outlier in label_outliers.items() if is_outlier])
        logger.debug(
            "PP2_CONSENSUS_OUTLIERS any_fallback=%s outlier_views=%s",
            bool(outlier_views),
            outlier_views,
        )
        eligible_indices = sorted([idx for idx, is_outlier in label_outliers.items() if not is_outlier])
        logger.debug("PP2_ELIGIBLE_VIEWS eligible_indices=%s", eligible_indices)
             
        # 4. Verification
        # Convert vectors to numpy for verifier
        verify_start = time.perf_counter()
        vectors_np = [np.array(v, dtype=np.float32) for v in vectors]
        verification = self.verifier.verify(
            per_view_results,
            vectors_np,
            crops,
            self.faiss,
            eligible_indices=eligible_indices,
        )
        verify_ms = (time.perf_counter() - verify_start) * 1000.0
        
        # 5. Fusion & Storage
        fused = None
        stored = False
        cache_key = None
        storage_ms = 0.0
        florence_ms = 0.0
        florence_skipped = True
        
        if verification.passed:
            storage_start = time.perf_counter()
            florence_start = time.perf_counter()
            selected_indices = eligible_indices if eligible_indices else [0, 1, 2]
            per_view_by_index: Dict[int, PP2PerViewResult] = {res.view_index: res for res in per_view_results}

            for idx in selected_indices:
                extraction_data = self.florence.analyze_crop(
                    crop_by_index[idx],
                    canonical_label=canonical_label_by_index[idx],
                    profile=profile,
                    mode="full",
                )
                normalized = self._normalize_extraction_payload(extraction_data)
                per_view_by_index[idx].extraction = PP2PerViewExtraction(
                    caption=normalized["caption"],
                    ocr_text=normalized["ocr_text"],
                    grounded_features=normalized["grounded_features"],
                    extraction_confidence=1.0,
                )
            florence_ms = (time.perf_counter() - florence_start) * 1000.0
            florence_skipped = False
            logger.debug(
                "PP2_FLORENCE_DEFERRED executed_views=%s florence_ms=%.2f",
                selected_indices,
                florence_ms,
            )

            fused = self.fusion.fuse(
                per_view_results,
                vectors_np,
                item_id=item_id,
                view_meta_by_index=view_meta_by_index,
            )

            try:
                selected_vectors = [vectors_np[i] for i in selected_indices]
                fused_vector_np = self.fusion.compute_fused_vector(selected_vectors)
                faiss_id = self.faiss.add(
                    fused_vector_np,
                    metadata={
                        "item_id": item_id,
                        "fused_embedding_id": fused.fused_embedding_id,
                        "embedding_id": fused.fused_embedding_id,
                        "view_index": None,
                        "best_view_index": fused.best_view_index,
                        "category": fused.category,
                    },
                )
            except Exception:
                logger.exception(
                    "PP2_FUSED_VECTOR_INDEXING_FAILED item_id=%s embedding_id=%s",
                    item_id,
                    fused.fused_embedding_id,
                )
            else:
                # Prepare data for synchronous storage call
                per_view_dicts = [res.model_dump() for res in per_view_results]
                fused_dict = fused.model_dump()

                result = storage.store_multiview_result(
                    item_id=item_id,
                    per_view_results=per_view_dicts,
                    fused_profile=fused_dict,
                    fused_vector=fused_vector_np.tolist(),
                    faiss_id=faiss_id,
                )

                stored = result.get("stored", False)
                cache_key = result.get("cache_key")
            storage_ms = (time.perf_counter() - storage_start) * 1000.0
        else:
            logger.debug("PP2_FLORENCE_SKIPPED verification_passed=false")

        total_ms = (time.perf_counter() - request_start) * 1000.0
        logger.info(
            "PP2_TIMING total_ms=%.2f per_view_avg_ms=%.2f verify_ms=%.2f florence_lite_total_ms=%.2f florence_lite_avg_ms=%.2f florence_ms=%.2f florence_skipped=%s storage_ms=%.2f profile=%s",
            total_ms,
            (sum(per_view_ms) / len(per_view_ms)) if per_view_ms else 0.0,
            verify_ms,
            florence_lite_total_ms,
            (florence_lite_total_ms / len(view_inputs)) if view_inputs else 0.0,
            florence_ms,
            florence_skipped,
            storage_ms,
            profile,
        )
        if total_ms > 18000:
            logger.warning("PP2_SLOW_REQUEST total_ms=%.2f profile=%s", total_ms, profile)
            
        return PP2Response(
            item_id=item_id,
            per_view=per_view_results,
            verification=verification,
            fused=fused,
            stored=stored,
            cache_key=cache_key
        )
