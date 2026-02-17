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
    PP2PerViewEmbedding,
    PP2VerificationResult,
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
    MIN_VIEWS = 2
    MAX_VIEWS = 3
    PP2_TOP_K_DETECTIONS = 5
    LITE_EXTRACTION_CONFIDENCE = 0.7
    LITE_FAILED_EXTRACTION_CONFIDENCE = 0.0
    CENTER_CROP_RATIO = 0.70
    HINT_KEYWORDS: Dict[str, List[str]] = {
        "Helmet": ["helmet", "visor", "chin strap", "motorcycle helmet", "bike helmet", "headgear"],
        "Smart Phone": ["smartphone", "mobile phone", "cell phone", "iphone", "android phone", "phone"],
        "Laptop": ["laptop", "notebook", "macbook", "ultrabook"],
        "Earbuds - Earbuds case": ["earbud", "earbuds", "airpods", "earphone case", "charging case", "tws case"],
        "Wallet": ["wallet", "billfold", "card holder"],
        "Handbag": ["bag", "handbag", "purse", "tote", "sling bag"],
        "Backpack": ["backpack", "rucksack", "knapsack", "school bag"],
        "Key": ["key", "keys", "keychain", "key ring"],
        "Student ID": ["student id", "id card", "school id", "campus card"],
        "Laptop/Mobile chargers & cables": [
            "charger",
            "charging cable",
            "usb cable",
            "type-c cable",
            "lightning cable",
            "power adapter",
        ],
    }
    UMBRELLA_KEYWORDS: List[str] = ["umbrella", "parasol"]
    HINT_PRIORITY: List[str] = [
        "Helmet",
        "Smart Phone",
        "Laptop",
        "Earbuds - Earbuds case",
        "Wallet",
        "Handbag",
        "Backpack",
        "Key",
        "Student ID",
        "Laptop/Mobile chargers & cables",
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
        configured = float(getattr(settings, "FLORENCE_LITE_SUCCESS_CONFIDENCE", self.LITE_EXTRACTION_CONFIDENCE))
        self.lite_success_confidence = max(self.LITE_EXTRACTION_CONFIDENCE, configured)

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

        raw_data = data.get("raw", {})
        if isinstance(raw_data, dict):
            raw: Dict[str, Any] = dict(raw_data)
        else:
            raw = {}

        return {
            "caption": caption,
            "ocr_text": ocr_text,
            "grounded_features": grounded_features,
            "raw": raw,
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
    def _center_crop(image: Image.Image, ratio: float = 0.70) -> Image.Image:
        if not isinstance(image, Image.Image):
            return image
        w, h = image.size
        if w <= 0 or h <= 0:
            return image
        safe_ratio = max(0.1, min(1.0, float(ratio)))
        crop_w = max(1, int(round(w * safe_ratio)))
        crop_h = max(1, int(round(h * safe_ratio)))

        left = max(0, (w - crop_w) // 2)
        top = max(0, (h - crop_h) // 2)
        right = min(w, left + crop_w)
        bottom = min(h, top + crop_h)

        if right <= left or bottom <= top:
            return image
        return image.crop((left, top, right, bottom))

    @staticmethod
    def _lite_reason(caption_text: Any, ocr_text: Any) -> str:
        has_caption = bool(str(caption_text or "").strip())
        has_ocr = bool(str(ocr_text or "").strip())
        if has_caption and has_ocr:
            return "ok_nonempty"
        if not has_caption and not has_ocr:
            return "ok_empty_both"
        if not has_caption:
            return "ok_empty_caption"
        return "ok_empty_ocr"

    def _is_lite_nonempty(self, extraction_data: Dict[str, Any]) -> bool:
        caption_text = str(extraction_data.get("caption", "")).strip()
        ocr_text = str(extraction_data.get("ocr_text", "")).strip()
        return bool(caption_text) or bool(ocr_text)

    @staticmethod
    def _padded_bbox_crop(
        image: Image.Image,
        bbox: Optional[Tuple[int, int, int, int]],
        pad_ratio: float,
    ) -> Image.Image:
        if not isinstance(image, Image.Image):
            return image
        if not bbox or len(bbox) != 4:
            return image
        w, h = image.size
        if w <= 0 or h <= 0:
            return image

        x1, y1, x2, y2 = bbox
        x1 = max(0, min(w, int(x1)))
        y1 = max(0, min(h, int(y1)))
        x2 = max(0, min(w, int(x2)))
        y2 = max(0, min(h, int(y2)))
        if x2 <= x1 or y2 <= y1:
            return image

        box_w = x2 - x1
        box_h = y2 - y1
        safe_pad = max(0.0, float(pad_ratio))
        pad_x = int(round(box_w * safe_pad))
        pad_y = int(round(box_h * safe_pad))

        px1 = max(0, x1 - pad_x)
        py1 = max(0, y1 - pad_y)
        px2 = min(w, x2 + pad_x)
        py2 = min(h, y2 + pad_y)
        if px2 <= px1 or py2 <= py1:
            return image
        return image.crop((px1, py1, px2, py2))

    @staticmethod
    def _is_tiny_bbox(
        bbox: Optional[Tuple[int, int, int, int]],
        image_size: Tuple[int, int],
        threshold_ratio: float,
    ) -> bool:
        if not bbox or len(bbox) != 4:
            return True
        w, h = image_size
        if w <= 0 or h <= 0:
            return True

        x1, y1, x2, y2 = [int(v) for v in bbox]
        box_w = max(0, x2 - x1)
        box_h = max(0, y2 - y1)
        if box_w <= 0 or box_h <= 0:
            return True

        box_area = float(box_w * box_h)
        img_area = float(w * h)
        if img_area <= 0.0:
            return True
        ratio = box_area / img_area
        safe_threshold = max(0.0, float(threshold_ratio))
        return ratio < safe_threshold

    def _call_lite_once(
        self,
        image: Image.Image,
        canonical_label: Optional[str],
        profile: str,
        request_id: str,
        item_id: str,
        view_index: int,
    ) -> Dict[str, Any]:
        call_start = time.perf_counter()
        try:
            lite_raw = self.florence.analyze_crop(
                image,
                canonical_label=canonical_label,
                profile=profile,
                mode="lite",
            )
        except Exception as exc:
            logger.exception(
                "PP2_LITE_EXTRACTION_FAILED request_id=%s item_id=%s view=%d",
                request_id,
                item_id,
                view_index,
            )
            lite_raw = {
                "caption": "",
                "ocr_text": "",
                "grounded_features": {},
                "raw": {
                    "error": {"type": "error", "message": str(exc)},
                    "lite": {
                        "status": "error",
                        "reason": "exception",
                    },
                    "timings": {},
                },
            }

        measured_ms = (time.perf_counter() - call_start) * 1000.0
        normalized = self._normalize_extraction_payload(lite_raw)
        raw_data = normalized.get("raw", {})
        if not isinstance(raw_data, dict):
            raw_data = {}

        timings = raw_data.get("timings", {})
        if not isinstance(timings, dict):
            timings = {}
        lite_ms_raw = timings.get("lite_ms")
        if not isinstance(lite_ms_raw, (int, float)):
            lite_ms_raw = measured_ms
        lite_ms = float(lite_ms_raw)
        timings["lite_ms"] = round(lite_ms, 2)
        raw_data["timings"] = timings

        lite_meta = raw_data.get("lite", {})
        if not isinstance(lite_meta, dict):
            lite_meta = {}
        caption_text = str(normalized.get("caption", ""))
        ocr_text = str(normalized.get("ocr_text", ""))
        lite_nonempty = self._is_lite_nonempty(normalized)
        lite_meta["status"] = str(lite_meta.get("status", "success"))
        lite_meta["reason"] = str(lite_meta.get("reason", self._lite_reason(caption_text, ocr_text)))
        lite_meta["caption_len"] = int(len(caption_text.strip()))
        lite_meta["ocr_len"] = int(len(ocr_text.strip()))
        lite_meta["lite_nonempty"] = bool(lite_nonempty)
        lite_meta["timeout_ms_used"] = int(
            lite_meta.get(
                "timeout_ms_used",
                int(getattr(settings, "FLORENCE_LITE_TIMEOUT_MS", 15000)),
            )
        )
        raw_data["lite"] = lite_meta
        normalized["raw"] = raw_data
        return normalized

    def _run_lite_with_retry_and_fallback(
        self,
        image: Image.Image,
        provisional_crop: Image.Image,
        provisional_bbox: Optional[Tuple[int, int, int, int]],
        canonical_label: Optional[str],
        profile: str,
        request_id: str,
        item_id: str,
        view_index: int,
        input_source: str,
    ) -> Dict[str, Any]:
        retry_count = max(0, int(getattr(settings, "FLORENCE_LITE_RETRY_COUNT", 0)))
        pad_ratio = float(getattr(settings, "FLORENCE_LITE_PAD_RATIO", 0.20))
        require_nonempty = bool(getattr(settings, "FLORENCE_LITE_REQUIRE_NONEMPTY", True))
        tiny_bbox_ratio = float(getattr(settings, "FLORENCE_LITE_TINY_BBOX_AREA_RATIO", 0.05))

        attempt_plan: List[Tuple[str, Image.Image]] = [("initial_crop", provisional_crop)]

        has_valid_bbox = bool(provisional_bbox and len(provisional_bbox) == 4)
        tiny_bbox = (
            input_source == "yolo_top1_crop"
            and has_valid_bbox
            and self._is_tiny_bbox(provisional_bbox, image.size, tiny_bbox_ratio)
        )
        fallback_planned = bool(
            input_source == "yolo_top1_crop"
            and (tiny_bbox or not has_valid_bbox)
        )

        for _ in range(retry_count):
            if input_source == "yolo_top1_crop" and provisional_bbox is not None:
                padded = self._padded_bbox_crop(image, provisional_bbox, pad_ratio=pad_ratio)
                attempt_plan.append(("padded_crop", padded))
            else:
                attempt_plan.append(("retry_same_input", provisional_crop))
        if fallback_planned:
            attempt_plan.append(("full_image", image))

        selected: Optional[Dict[str, Any]] = None
        selected_attempt_no = 1
        selected_source = "initial_crop"
        attempts: List[Dict[str, Any]] = []
        total_ms = 0.0
        last_normalized: Optional[Dict[str, Any]] = None

        for attempt_no, (source, attempt_img) in enumerate(attempt_plan, start=1):
            normalized = self._call_lite_once(
                attempt_img,
                canonical_label=canonical_label,
                profile=profile,
                request_id=request_id,
                item_id=item_id,
                view_index=view_index,
            )
            last_normalized = normalized

            raw_data = normalized.get("raw", {})
            if not isinstance(raw_data, dict):
                raw_data = {}
            timings = raw_data.get("timings", {})
            if not isinstance(timings, dict):
                timings = {}
            lite_meta = raw_data.get("lite", {})
            if not isinstance(lite_meta, dict):
                lite_meta = {}

            lite_ms = float(timings.get("lite_ms", 0.0) or 0.0)
            total_ms += lite_ms
            lite_nonempty = bool(lite_meta.get("lite_nonempty", self._is_lite_nonempty(normalized)))
            attempt_status = str(lite_meta.get("status", "success"))
            attempt_reason = str(lite_meta.get("reason", self._lite_reason(normalized.get("caption", ""), normalized.get("ocr_text", ""))))

            attempts.append(
                {
                    "attempt_no": attempt_no,
                    "source": source,
                    "status": attempt_status,
                    "reason": attempt_reason,
                    "lite_nonempty": lite_nonempty,
                    "lite_ms": round(lite_ms, 2),
                }
            )

            logger.debug(
                "PP2_VIEW_LITE_ATTEMPT request_id=%s item_id=%s view=%d attempt=%d source=%s status=%s reason=%s lite_nonempty=%s lite_ms=%.2f",
                request_id,
                item_id,
                view_index,
                attempt_no,
                source,
                attempt_status,
                attempt_reason,
                lite_nonempty,
                lite_ms,
            )

            if (not require_nonempty) or lite_nonempty:
                selected = normalized
                selected_attempt_no = attempt_no
                selected_source = source
                break

        if selected is None:
            selected = last_normalized or {
                "caption": "",
                "ocr_text": "",
                "grounded_features": {},
                "raw": {},
            }
            raw_data = selected.get("raw", {})
            if not isinstance(raw_data, dict):
                raw_data = {}
            lite_meta = raw_data.get("lite", {})
            if not isinstance(lite_meta, dict):
                lite_meta = {}
            failure_reason = "empty_after_attempts"
            for attempt in reversed(attempts):
                attempt_reason = str(attempt.get("reason", ""))
                if attempt_reason in {"timeout_hard_kill", "exception"}:
                    failure_reason = attempt_reason
                    break

            if (
                failure_reason == "empty_after_attempts"
                and input_source == "yolo_top1_crop"
                and has_valid_bbox
                and not tiny_bbox
                and not fallback_planned
            ):
                failure_reason = "fallback_skipped_non_tiny_valid_bbox"

            lite_meta["status"] = "florence_lite_failed"
            lite_meta["reason"] = failure_reason
            lite_meta["lite_nonempty"] = False
            lite_meta["caption_len"] = int(len(str(selected.get("caption", "")).strip()))
            lite_meta["ocr_len"] = int(len(str(selected.get("ocr_text", "")).strip()))
            raw_data["lite"] = lite_meta
            selected["raw"] = raw_data
            if attempts:
                selected_attempt_no = int(attempts[-1].get("attempt_no", len(attempts)))
                selected_source = str(attempts[-1].get("source", "full_image"))

        raw_data = selected.get("raw", {})
        if not isinstance(raw_data, dict):
            raw_data = {}
        timings = raw_data.get("timings", {})
        if not isinstance(timings, dict):
            timings = {}
        timings["lite_total_ms"] = round(total_ms, 2)
        raw_data["timings"] = timings
        lite_meta = raw_data.get("lite", {})
        if not isinstance(lite_meta, dict):
            lite_meta = {}
        lite_meta["attempts"] = attempts
        lite_meta["attempt_count"] = len(attempts)
        lite_meta["selected_attempt"] = selected_attempt_no
        lite_meta["selected_source"] = selected_source
        lite_meta["lite_nonempty"] = bool(lite_meta.get("lite_nonempty", self._is_lite_nonempty(selected)))
        lite_meta["timeout_ms_used"] = int(
            lite_meta.get(
                "timeout_ms_used",
                int(getattr(settings, "FLORENCE_LITE_TIMEOUT_MS", 15000)),
            )
        )
        raw_data["lite"] = lite_meta
        selected["raw"] = raw_data
        return selected

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
    def _collect_text_fragments(value: Any) -> List[str]:
        fragments: List[str] = []
        if value is None:
            return fragments
        if isinstance(value, str):
            text = value.strip()
            if text:
                fragments.append(text)
            return fragments
        if isinstance(value, dict):
            for k, v in value.items():
                fragments.extend(MultiViewPipeline._collect_text_fragments(k))
                fragments.extend(MultiViewPipeline._collect_text_fragments(v))
            return fragments
        if isinstance(value, (list, tuple, set)):
            for item in value:
                fragments.extend(MultiViewPipeline._collect_text_fragments(item))
            return fragments
        text = str(value).strip()
        if text:
            fragments.append(text)
        return fragments

    def _extract_feature_tokens(self, grounded_features: Dict[str, Any]) -> str:
        fragments = self._collect_text_fragments(grounded_features if isinstance(grounded_features, dict) else {})
        return self._normalize_hint_text(" ".join(fragments))

    def _normalize_label(self, text: Any) -> Optional[str]:
        normalized = self._normalize_hint_text(text)
        if not normalized:
            return None

        if any(self._text_has_keyword(normalized, kw) for kw in self.UMBRELLA_KEYWORDS):
            return None

        canonical = canonicalize_label(normalized)
        alias_hit: Optional[str] = None
        for label, aliases in self.HINT_KEYWORDS.items():
            for alias in aliases:
                if self._text_has_keyword(normalized, alias):
                    alias_hit = label
                    break
            if alias_hit:
                break

        if canonical == "Handbag" and alias_hit == "Backpack":
            return "Backpack"
        if canonical:
            return canonical
        return alias_hit

    @staticmethod
    def _text_has_keyword(text: str, keyword: str) -> bool:
        if not text or not keyword:
            return False
        kw = str(keyword).strip().lower()
        if not kw:
            return False
        pattern = r"\b" + re.escape(kw).replace(r"\ ", r"\s+") + r"\b"
        return re.search(pattern, text) is not None

    def _infer_canonical_hint_with_signals(
        self,
        caption: str,
        ocr_text: str,
        grounded_features: Dict[str, Any],
    ) -> Tuple[Optional[str], Dict[str, bool]]:
        caption_text = self._normalize_hint_text(caption)
        ocr_text_norm = self._normalize_hint_text(ocr_text)
        feature_text = self._extract_feature_tokens(grounded_features)

        helmet_caption = any(self._text_has_keyword(caption_text, kw) for kw in self.HINT_KEYWORDS["Helmet"])
        helmet_ocr = any(self._text_has_keyword(ocr_text_norm, kw) for kw in self.HINT_KEYWORDS["Helmet"])
        helmet_feature = any(self._text_has_keyword(feature_text, kw) for kw in self.HINT_KEYWORDS["Helmet"])
        if helmet_caption or helmet_ocr or helmet_feature:
            return "Helmet", {
                "caption_hit": helmet_caption,
                "ocr_hit": helmet_ocr,
                "feature_hit": helmet_feature,
            }

        weights = {"caption": 1, "ocr": 3, "feature": 2}
        scores: Dict[str, int] = {}
        caption_any = False
        ocr_any = False
        feature_any = False
        for label, keywords in self.HINT_KEYWORDS.items():
            score = 0
            for keyword in keywords:
                if self._text_has_keyword(caption_text, keyword):
                    score += weights["caption"]
                    caption_any = True
                if self._text_has_keyword(ocr_text_norm, keyword):
                    score += weights["ocr"]
                    ocr_any = True
                if self._text_has_keyword(feature_text, keyword):
                    score += weights["feature"]
                    feature_any = True
            scores[label] = score

        best_score = max(scores.values()) if scores else 0
        if best_score <= 0:
            return None, {
                "caption_hit": False,
                "ocr_hit": False,
                "feature_hit": False,
            }

        priority = {label: idx for idx, label in enumerate(self.HINT_PRIORITY)}
        winners = [label for label, score in scores.items() if score == best_score]
        winners.sort(key=lambda label: (priority.get(label, len(priority)), label))
        return winners[0], {
            "caption_hit": caption_any,
            "ocr_hit": ocr_any,
            "feature_hit": feature_any,
        }

    def infer_canonical_hint(
        self,
        caption: str,
        ocr_text: str,
        grounded_features: Dict[str, Any],
    ) -> Optional[str]:
        hint, _ = self._infer_canonical_hint_with_signals(caption, ocr_text, grounded_features)
        return hint

    def _choose_consensus_label(self, per_view_detections: List[List[Any]]) -> Tuple[Optional[str], str]:
        """
        Choose a cross-view consensus label.
        Priority:
          1) strict majority among per-view top-1 labels
          2) fallback ranking over top-K labels:
             (view_coverage_count, summed_best_confidence, best_single_confidence, label asc)
        """
        top1_labels: List[str] = []
        for dets in per_view_detections:
            if not dets:
                continue
            canonical_top1 = self._normalize_label(str(dets[0].label))
            if canonical_top1:
                top1_labels.append(canonical_top1)
        if top1_labels:
            observed_vote_count = len(top1_labels)
            counts = Counter(top1_labels)
            winner, count = counts.most_common(1)[0]

            # In two-view tie cases (different top-1 labels), do not force a majority winner.
            # We intentionally fall through to coverage/confidence fallback (or hint majority upstream).
            if observed_vote_count == 2 and count == 1 and len(counts) == 2:
                pass
            elif count > (observed_vote_count / 2.0):
                return winner, "strict_majority"

        label_stats: Dict[str, Dict[str, float]] = {}
        for detections in per_view_detections:
            if not detections:
                continue
            per_view_best: Dict[str, float] = {}
            for det in detections:
                label = self._normalize_label(str(det.label))
                if not label:
                    continue
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
    ) -> Tuple[Optional[Any], bool, str]:
        """
        Select final detection for a view.
        Returns (selected_detection, label_outlier, selected_by).
        """
        if not detections:
            return None, bool(consensus_label), "fallback_top1"
        if not consensus_label:
            return detections[0], False, "fallback_top1"

        consensus_canonical = self._normalize_label(str(consensus_label)) or str(consensus_label)
        matching = []
        for det in detections:
            det_label = str(det.label)
            det_canonical = self._normalize_label(det_label) or det_label
            if det_canonical == consensus_canonical:
                matching.append(det)
        if matching:
            best = max(matching, key=lambda det: float(getattr(det, "confidence", 0.0)))
            return best, False, "consensus_match"
        return detections[0], True, "fallback_top1"

    async def analyze(
        self,
        files: List[UploadFile],
        storage: StorageService,
        request_id: Optional[str] = None,
    ) -> PP2Response:
        request_start = time.perf_counter()
        profile = self.perf_profile
        item_id = str(uuid.uuid4())
        trace_request_id = str(request_id or "")
        if not trace_request_id:
            trace_request_id = str(uuid.uuid4())
        n_views = len(files)
        if n_views < self.MIN_VIEWS or n_views > self.MAX_VIEWS:
            raise ValueError(
                f"Multi-view analysis requires {self.MIN_VIEWS} to {self.MAX_VIEWS} views, got {n_views}."
            )
        logger.info(
            "PP2_PIPELINE_START request_id=%s item_id=%s n_views=%d profile=%s",
            trace_request_id,
            item_id,
            n_views,
            profile,
        )

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
            top1 = detections[0] if detections else None
            top1_label = str(getattr(top1, "label", "none"))
            top1_conf = float(getattr(top1, "confidence", 0.0)) if top1 else 0.0
            top1_bbox = getattr(top1, "bbox", None) if top1 else None
            logger.debug(
                "PP2_VIEW_YOLO request_id=%s item_id=%s view=%d image_wh=%dx%d detections=%d top1_label=%s top1_conf=%.4f top1_bbox=%s",
                trace_request_id,
                item_id,
                i,
                pil_img.width,
                pil_img.height,
                len(detections),
                top1_label,
                top1_conf,
                top1_bbox,
            )
            logger.debug(
                "PP2_VIEW_TOPK request_id=%s item_id=%s view=%d labels=%s",
                trace_request_id,
                item_id,
                i,
                self._label_conf_pairs(detections),
            )

            provisional_det = detections[0] if detections else None
            provisional_bbox_xyxy: Optional[Tuple[int, int, int, int]] = None
            if provisional_det:
                provisional_bbox = provisional_det.bbox
                w, h = pil_img.size
                x1, y1, x2, y2 = provisional_bbox
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)
                if x2 > x1 and y2 > y1:
                    provisional_crop = pil_img.crop((x1, y1, x2, y2))
                    lite_input_source = "yolo_top1_crop"
                    bbox_w = int(x2 - x1)
                    bbox_h = int(y2 - y1)
                    provisional_bbox_xyxy = (int(x1), int(y1), int(x2), int(y2))
                else:
                    provisional_crop = pil_img
                    lite_input_source = "full_image_fallback"
                    bbox_w = int(pil_img.width)
                    bbox_h = int(pil_img.height)
                provisional_label = str(provisional_det.label)
            else:
                provisional_crop = pil_img
                provisional_label = "unknown"
                lite_input_source = "full_image_fallback"
                bbox_w = int(pil_img.width)
                bbox_h = int(pil_img.height)

            logger.debug(
                "PP2_VIEW_LITE_INPUT request_id=%s item_id=%s view=%d source=%s crop_wh=%dx%d bbox_wh=%dx%d",
                trace_request_id,
                item_id,
                i,
                lite_input_source,
                provisional_crop.width,
                provisional_crop.height,
                bbox_w,
                bbox_h,
            )

            lite_extraction = self._run_lite_with_retry_and_fallback(
                image=pil_img,
                provisional_crop=provisional_crop,
                provisional_bbox=provisional_bbox_xyxy,
                canonical_label=provisional_label if provisional_label != "unknown" else None,
                profile=profile,
                request_id=trace_request_id,
                item_id=item_id,
                view_index=i,
                input_source=lite_input_source,
            )
            raw_lite = lite_extraction.get("raw", {}) if isinstance(lite_extraction, dict) else {}
            timings = raw_lite.get("timings", {}) if isinstance(raw_lite, dict) else {}
            lite_ms = timings.get("lite_total_ms") if isinstance(timings, dict) else None
            if not isinstance(lite_ms, (int, float)):
                lite_ms = timings.get("lite_ms") if isinstance(timings, dict) else None
            if not isinstance(lite_ms, (int, float)):
                lite_ms = 0.0
            lite_ms_float = float(lite_ms)
            florence_lite_total_ms += lite_ms_float
            lite_meta = raw_lite.get("lite", {}) if isinstance(raw_lite, dict) else {}
            if not isinstance(lite_meta, dict):
                lite_meta = {}
            caption_text = str(lite_extraction.get("caption", ""))
            ocr_text = str(lite_extraction.get("ocr_text", ""))
            caption_len = len(caption_text.strip())
            ocr_len = len(ocr_text.strip())
            lite_status = str(lite_meta.get("status", "unknown"))
            lite_reason = str(lite_meta.get("reason", "unknown"))
            if lite_status == "unknown":
                lite_status = "success"
                if caption_len > 0 and ocr_len > 0:
                    lite_reason = "ok_nonempty"
                elif caption_len == 0 and ocr_len == 0:
                    lite_reason = "ok_empty_both"
                elif caption_len == 0:
                    lite_reason = "ok_empty_caption"
                else:
                    lite_reason = "ok_empty_ocr"
            logger.debug(
                "PP2_VIEW_LITE_RESULT request_id=%s item_id=%s view=%d status=%s reason=%s lite_ms=%.2f caption_len=%d ocr_len=%d has_caption=%s has_ocr=%s",
                trace_request_id,
                item_id,
                i,
                lite_status,
                lite_reason,
                lite_ms_float,
                caption_len,
                ocr_len,
                caption_len > 0,
                ocr_len > 0,
            )

            canonical_hint, hint_signals = self._infer_canonical_hint_with_signals(
                caption=lite_extraction.get("caption", ""),
                ocr_text=lite_extraction.get("ocr_text", ""),
                grounded_features=lite_extraction.get("grounded_features", {}),
            )
            canonical_hint_by_index[i] = canonical_hint
            lite_ms_by_index[i] = lite_ms_float
            logger.debug(
                "PP2_HINT_SIGNAL request_id=%s item_id=%s view=%d hint=%s caption_hit=%s ocr_hit=%s feature_hit=%s",
                trace_request_id,
                item_id,
                i,
                canonical_hint,
                hint_signals.get("caption_hit", False),
                hint_signals.get("ocr_hit", False),
                hint_signals.get("feature_hit", False),
            )
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
        top1_votes = [
            self._normalize_label(str(dets[0].label)) or str(dets[0].label)
            for dets in per_view_detections
            if dets
        ]
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
        logger.debug(
            "PP2_CONSENSUS_PATH request_id=%s item_id=%s strategy=%s used_hint_majority=%s yolo_fallback=%s top1_votes=%s hint_votes=%s",
            trace_request_id,
            item_id,
            consensus_strategy,
            consensus_strategy == "hint_majority",
            consensus_strategy != "hint_majority",
            top1_votes,
            hint_votes,
        )

        # 3. Process each view using consensus-aligned selection
        for entry in view_inputs:
            i = int(entry["view_index"])
            filename = str(entry["filename"])
            pil_img = entry["image"]
            detections = entry["detections"]

            selected_det, label_outlier, selection_mode = self._select_detection_for_view(detections, consensus_label)
            label_outliers[i] = label_outlier

            candidates = []
            for det in detections:
                raw_label = str(getattr(det, "label", ""))
                canonical_det_label = self._normalize_label(raw_label)
                det_bbox = getattr(det, "bbox", None) or (0, 0, 0, 0)
                if len(det_bbox) != 4:
                    det_bbox = (0, 0, 0, 0)
                candidates.append(
                    {
                        "raw_label": raw_label,
                        "canonical_label": canonical_det_label,
                        "confidence": float(getattr(det, "confidence", 0.0)),
                        "bbox": (
                            float(det_bbox[0]),
                            float(det_bbox[1]),
                            float(det_bbox[2]),
                            float(det_bbox[3]),
                        ),
                    }
                )

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
                "PP2_VIEW_SELECTION view=%d selected_label=%s canonical_label=%s canonical_differs=%s selected_conf=%.4f outlier=%s selected_by=%s",
                i,
                cls_name,
                canonical_label,
                canonical_differs,
                det_conf,
                label_outlier,
                selection_mode,
            )
            view_meta_by_index[i] = {
                "final_label": cls_name,
                "selected_label": cls_name,
                "canonical_label": canonical_label,
                "label_outlier": label_outlier,
                "selected_by": selection_mode,
                "candidates": candidates,
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
            lite_nonempty = self._is_lite_nonempty(lite_extraction)
            per_view_results.append(PP2PerViewResult(
                view_index=i,
                filename=filename,
                detection=PP2PerViewDetection(
                    bbox=(float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])),
                    cls_name=cls_name,
                    confidence=det_conf,
                    selected_by=selection_mode,
                    outlier_view=label_outlier,
                    candidates=candidates,
                ),
                extraction=PP2PerViewExtraction(
                    caption=str(lite_extraction.get("caption", "")),
                    ocr_text=str(lite_extraction.get("ocr_text", "")),
                    grounded_features=lite_extraction.get("grounded_features", {}),
                    extraction_confidence=(
                        self.lite_success_confidence
                        if lite_nonempty
                        else self.LITE_FAILED_EXTRACTION_CONFIDENCE
                    ),
                    raw=lite_extraction.get("raw", {}) if isinstance(lite_extraction.get("raw", {}), dict) else {},
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
            "PP2_CONSENSUS_OUTLIERS request_id=%s item_id=%s any_fallback=%s outlier_views=%s",
            trace_request_id,
            item_id,
            bool(outlier_views),
            outlier_views,
        )

        consensus_canonical = self._normalize_label(consensus_label) if consensus_label else None
        dropped_reasons_by_index: Dict[int, str] = {}
        for idx, result in enumerate(per_view_results):
            reasons: List[str] = []
            if bool(label_outliers.get(idx, False)) or bool(getattr(result.detection, "outlier_view", False)):
                reasons.append("outlier_view=true")

            selected_canonical = self._normalize_label(result.detection.cls_name)
            if consensus_canonical and selected_canonical != consensus_canonical:
                reasons.append(
                    f"label_mismatch_vs_consensus(selected={selected_canonical or 'unknown'}, consensus={consensus_canonical})"
                )

            if reasons:
                dropped_reasons_by_index[idx] = "; ".join(reasons)

        candidate_indices = sorted(
            idx for idx in range(len(per_view_results)) if idx not in dropped_reasons_by_index
        )
        logger.debug(
            "PP2_ELIGIBLE_VIEWS request_id=%s item_id=%s candidate_indices=%s",
            trace_request_id,
            item_id,
            candidate_indices,
        )

        # 4. Verification
        # Convert vectors to numpy for verifier
        verify_start = time.perf_counter()
        vectors_np = [np.array(v, dtype=np.float32) for v in vectors]
        embedding_variants_by_index: Dict[int, Dict[str, np.ndarray]] = {
            idx: {"full": vectors_np[idx]}
            for idx in range(len(vectors_np))
        }
        for idx in candidate_indices:
            center_source = crop_by_index.get(idx)
            if center_source is None:
                continue
            center_crop = self._center_crop(center_source, ratio=self.CENTER_CROP_RATIO)
            try:
                center_vec = self.dino.embed_128(center_crop)
            except Exception:
                logger.exception(
                    "PP2_CENTER_EMBEDDING_FAILED request_id=%s item_id=%s view=%d",
                    trace_request_id,
                    item_id,
                    idx,
                )
                continue
            embedding_variants_by_index[idx]["center"] = np.array(center_vec, dtype=np.float32)

        used_views: List[int] = []
        pair_scores: Dict[str, float] = {}
        if len(candidate_indices) == 2:
            used_views = list(candidate_indices)
        elif len(candidate_indices) == 3:
            try:
                best_pair, pair_scores = self.verifier.select_best_pair(
                    vectors_np,
                    self.faiss,
                    candidate_indices=candidate_indices,
                    embedding_variants_by_index=embedding_variants_by_index,
                )
            except Exception:
                logger.exception(
                    "PP2_BEST_PAIR_SELECTION_FAILED request_id=%s item_id=%s candidate_indices=%s",
                    trace_request_id,
                    item_id,
                    candidate_indices,
                )
                best_pair = None

            if best_pair is not None:
                used_views = [int(best_pair[0]), int(best_pair[1])]
            else:
                # Defensive fallback; should not happen with 3 valid candidates.
                used_views = [candidate_indices[0], candidate_indices[1]]

            for idx in candidate_indices:
                if idx not in used_views:
                    dropped_reasons_by_index[idx] = "not_best_pair_lower_similarity"

        dropped_views = [
            {"view_index": idx, "reason": dropped_reasons_by_index[idx]}
            for idx in sorted(dropped_reasons_by_index.keys())
        ]
        logger.debug(
            "PP2_BEST_PAIR_SELECTION request_id=%s item_id=%s candidate_indices=%s pair_scores=%s used_views=%s dropped_views=%s",
            trace_request_id,
            item_id,
            candidate_indices,
            pair_scores,
            used_views,
            dropped_views,
        )

        decision_indices = list(used_views) if len(used_views) == 2 else list(candidate_indices)
        verification = self.verifier.verify(
            per_view_results,
            vectors_np,
            crops,
            self.faiss,
            eligible_indices=decision_indices,
            used_views_override=used_views if len(used_views) == 2 else None,
            dropped_views=dropped_views,
            decision_category=consensus_label,
            embedding_variants_by_index=embedding_variants_by_index,
            request_id=trace_request_id,
            item_id=item_id,
        )
        verification_payload = verification.model_dump()
        verification_payload["used_views"] = used_views if len(used_views) == 2 else []
        verification_payload["dropped_views"] = dropped_views
        verification = PP2VerificationResult(**verification_payload)
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
            selected_indices = (
                list(verification.used_views)
                if len(getattr(verification, "used_views", [])) == 2
                else (decision_indices if len(decision_indices) == 2 else list(range(len(per_view_results))))
            )
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
                    raw=normalized.get("raw", {}) if isinstance(normalized.get("raw", {}), dict) else {},
                )
            florence_ms = (time.perf_counter() - florence_start) * 1000.0
            florence_skipped = False
            logger.debug(
                "PP2_FLORENCE_DEFERRED request_id=%s item_id=%s executed_views=%s florence_ms=%.2f",
                trace_request_id,
                item_id,
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
                    "PP2_FUSED_VECTOR_INDEXING_FAILED request_id=%s item_id=%s embedding_id=%s",
                    trace_request_id,
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
            logger.debug(
                "PP2_FLORENCE_SKIPPED request_id=%s item_id=%s verification_passed=false",
                trace_request_id,
                item_id,
            )

        total_ms = (time.perf_counter() - request_start) * 1000.0
        logger.info(
            "PP2_TIMING request_id=%s item_id=%s total_ms=%.2f per_view_avg_ms=%.2f verify_ms=%.2f florence_lite_total_ms=%.2f florence_lite_avg_ms=%.2f florence_ms=%.2f florence_skipped=%s storage_ms=%.2f profile=%s",
            trace_request_id,
            item_id,
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
            logger.warning(
                "PP2_SLOW_REQUEST request_id=%s item_id=%s total_ms=%.2f profile=%s",
                trace_request_id,
                item_id,
                total_ms,
                profile,
            )
        logger.info(
            "PP2_PIPELINE_END request_id=%s item_id=%s verification_passed=%s stored=%s total_ms=%.2f",
            trace_request_id,
            item_id,
            bool(verification.passed),
            bool(stored),
            total_ms,
        )
            
        return PP2Response(
            item_id=item_id,
            per_view=per_view_results,
            verification=verification,
            fused=fused,
            stored=stored,
            cache_key=cache_key
        )
