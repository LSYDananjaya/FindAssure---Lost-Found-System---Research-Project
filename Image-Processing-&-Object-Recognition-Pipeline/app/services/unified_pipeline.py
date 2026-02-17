from typing import Any, Dict, List, Optional
from PIL import Image
import os
import re
import time
import uuid
import logging

from app.services.yolo_service import YoloService
from app.services.florence_service import FlorenceService
from app.services.gemini_reasoner import (
    GeminiReasoner,
    GeminiFatalError,
    GeminiTransientError,
    REASONING_FAILED_MESSAGE,
    RETRYABLE_UNAVAILABLE_MESSAGE,
)
from app.services.dino_embedder import DINOEmbedder
from app.config.settings import settings
# from app.domain.category_specs import ALLOWED_LABELS # Removed restriction

logger = logging.getLogger(__name__)

class UnifiedPipeline:
    LABEL_RERANK_TOPK = 5
    LABEL_RERANK_KEYWORDS: Dict[str, List[str]] = {
        "Helmet": ["helmet", "visor", "shield", "chin", "headgear"],
        "Smart Phone": ["phone", "screen", "camera", "bezel", "home button"],
    }
    LABEL_RERANK_SOURCE_WEIGHTS: Dict[str, int] = {
        "caption": 2,
        "ocr": 2,
        "grounding": 1,
    }
    LABEL_RERANK_MIN_WINNER_SCORE = 3
    LABEL_RERANK_MIN_MARGIN = 2

    def __init__(
        self,
        yolo: Optional[YoloService] = None,
        florence: Optional[FlorenceService] = None,
        gemini: Optional[GeminiReasoner] = None,
        dino: Optional[DINOEmbedder] = None,
    ):
        # Initialize services
        # Note: Models are loaded lazily or on first use in their respective services
        self.yolo = yolo or YoloService()
        self.florence = florence or FlorenceService()
        self.gemini = gemini or GeminiReasoner()
        self.dino = dino or DINOEmbedder()
        self.perf_profile = str(settings.PERF_PROFILE).lower()
        self.max_detections = max(1, int(settings.PP1_MAX_DETECTIONS))
        self.include_gemini_image = bool(settings.PP1_GEMINI_INCLUDE_IMAGE)

    def _empty_response(self, status: str, message: str) -> Dict[str, Any]:
        """Helper to return a standardized empty/rejected response."""
        return {
            "status": status,
            "message": message,
            "item_id": str(uuid.uuid4()),
            "image": { "image_id": str(uuid.uuid4()), "filename": None },
            "label": None,
            "confidence": None,
            "bbox": None,
            "color": None,
            "ocr_text": "",
            "final_description": None,
            "category_details": {
                "features": [],
                "defects": [],
                "attachments": []
            },
            "key_count": None,
            "tags": [],
            "embeddings": {
                "vector_128d": [],
                "vector_dinov2": []
            },
            "raw": {
                "yolo": None,
                "florence": None,
                "gemini": None
            }
        }

    @staticmethod
    def _normalize_text_for_rerank(text: Any) -> str:
        if text is None:
            return ""
        if isinstance(text, str):
            return text.lower()
        if isinstance(text, (list, tuple, set)):
            return " ".join(str(x) for x in text if x is not None).lower()
        return str(text).lower()

    def _collect_rerank_texts(self, analysis: Dict[str, Any]) -> Dict[str, str]:
        raw = analysis.get("raw", {})
        grounding_raw = raw.get("grounding_raw", {}) if isinstance(raw, dict) else {}
        grounding_labels = grounding_raw.get("labels", []) if isinstance(grounding_raw, dict) else []
        return {
            "caption": self._normalize_text_for_rerank(analysis.get("caption", "")),
            "ocr": self._normalize_text_for_rerank(analysis.get("ocr_text", "")),
            "grounding": self._normalize_text_for_rerank(grounding_labels),
        }

    @staticmethod
    def _text_has_keyword(text: str, keyword: str) -> bool:
        if not text:
            return False
        phrase = str(keyword or "").strip().lower()
        if not phrase:
            return False
        pattern = r"\b" + re.escape(phrase).replace(r"\ ", r"\s+") + r"\b"
        return re.search(pattern, text) is not None

    def _score_label_keywords(self, label: str, texts: Dict[str, str]) -> Dict[str, Any]:
        keywords = self.LABEL_RERANK_KEYWORDS.get(str(label), [])
        matched_keywords: Dict[str, List[str]] = {"caption": [], "ocr": [], "grounding": []}
        total = 0

        for source in ("caption", "ocr", "grounding"):
            source_text = texts.get(source, "")
            for kw in keywords:
                if self._text_has_keyword(source_text, kw):
                    matched_keywords[source].append(kw)
            total += len(matched_keywords[source]) * int(self.LABEL_RERANK_SOURCE_WEIGHTS.get(source, 0))

        return {"score": total, "matched_keywords": matched_keywords}

    def _rerank_label(self, top1_label: str, candidates: List[Any], analysis: Dict[str, Any]) -> Dict[str, Any]:
        candidate_labels: List[str] = []
        best_conf_by_label: Dict[str, float] = {}
        for det in candidates:
            label = str(getattr(det, "label", "") or "")
            if not label:
                continue
            if label not in candidate_labels:
                candidate_labels.append(label)
            conf = float(getattr(det, "confidence", 0.0))
            prev = best_conf_by_label.get(label)
            if prev is None or conf > prev:
                best_conf_by_label[label] = conf

        texts = self._collect_rerank_texts(analysis)
        scores_by_label = {
            label: self._score_label_keywords(label, texts)
            for label in candidate_labels
        }
        top1_score = int(scores_by_label.get(top1_label, {}).get("score", 0))

        if not candidate_labels:
            return {
                "final_label": top1_label,
                "winner_label": top1_label,
                "winner_score": top1_score,
                "top1_score": top1_score,
                "applied": False,
                "reason": "no_candidates",
                "scores_by_label": scores_by_label,
            }

        winner_label = sorted(
            candidate_labels,
            key=lambda label: (
                -int(scores_by_label[label]["score"]),
                -float(best_conf_by_label.get(label, 0.0)),
                label,
            ),
        )[0]
        winner_score = int(scores_by_label[winner_label]["score"])
        margin = winner_score - top1_score
        contradiction_pair = (
            top1_label in self.LABEL_RERANK_KEYWORDS
            and winner_label in self.LABEL_RERANK_KEYWORDS
        )
        applied = (
            winner_label != top1_label
            and winner_score >= self.LABEL_RERANK_MIN_WINNER_SCORE
            and margin >= self.LABEL_RERANK_MIN_MARGIN
            and contradiction_pair
        )

        if applied:
            reason = "override_strong_contradiction"
        elif winner_label == top1_label:
            reason = "top1_best_score"
        elif winner_score < self.LABEL_RERANK_MIN_WINNER_SCORE:
            reason = "winner_score_below_threshold"
        elif margin < self.LABEL_RERANK_MIN_MARGIN:
            reason = "margin_below_threshold"
        elif not contradiction_pair:
            reason = "not_contradiction_pair"
        else:
            reason = "no_override"

        return {
            "final_label": winner_label if applied else top1_label,
            "winner_label": winner_label,
            "winner_score": winner_score,
            "top1_score": top1_score,
            "applied": applied,
            "reason": reason,
            "scores_by_label": scores_by_label,
        }

    def _derive_florence_strong_label(self, analysis: Dict[str, Any]) -> Optional[str]:
        texts = self._collect_rerank_texts(analysis)
        scored: List[Dict[str, Any]] = []
        for label in self.LABEL_RERANK_KEYWORDS:
            details = self._score_label_keywords(label, texts)
            matched = details.get("matched_keywords", {})
            caption_hits = len(matched.get("caption", []))
            ocr_hits = len(matched.get("ocr", []))
            score = int(details.get("score", 0))
            if score >= self.LABEL_RERANK_MIN_WINNER_SCORE and (caption_hits + ocr_hits) > 0:
                scored.append(
                    {
                        "label": label,
                        "score": score,
                        "caption_ocr_hits": caption_hits + ocr_hits,
                    }
                )

        if not scored:
            return None

        scored.sort(
            key=lambda item: (
                -int(item["score"]),
                -int(item["caption_ocr_hits"]),
                str(item["label"]),
            )
        )
        return str(scored[0]["label"])

    def _labels_incompatible(self, yolo_label: str, florence_label: str) -> bool:
        yolo = str(yolo_label or "")
        florence = str(florence_label or "")
        return (
            yolo != florence
            and yolo in self.LABEL_RERANK_KEYWORDS
            and florence in self.LABEL_RERANK_KEYWORDS
        )

    @staticmethod
    def _unique_labels(labels: List[str]) -> List[str]:
        seen = set()
        out: List[str] = []
        for label in labels:
            text = str(label or "").strip()
            if not text or text in seen:
                continue
            seen.add(text)
            out.append(text)
        return out

    def process_pp1(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Phase 1 Pipeline: Single Image Analysis
        
        Steps:
        1. Detect object using YOLOv8m (Local).
        2. Crop to each detection.
        3. Analyze crop with Florence-2 (Caption, OCR, VQA, Grounding).
           - Grounding uses candidates from CATEGORY_SPECS.
        4. Reason with Gemini (Evidence-Locked) to produce final JSON.
        5. Generate Embeddings (DINOv2).
        """
        request_start = time.perf_counter()

        if not os.path.exists(image_path):
            return [self._empty_response("rejected", f"Image file not found: {image_path}")]

        try:
            image = Image.open(image_path).convert("RGB")
        except Exception as e:
            return [self._empty_response("rejected", f"Failed to open image: {str(e)}")]

        filename = os.path.basename(image_path)
        profile = self.perf_profile
        include_gemini_image = self.include_gemini_image or profile in {"balanced", "quality"}

        # 1. Detect
        detect_start = time.perf_counter()
        all_detections = self.yolo.detect_objects(
            image,
            max_detections=max(self.max_detections, self.LABEL_RERANK_TOPK),
        )
        detect_ms = (time.perf_counter() - detect_start) * 1000.0
        
        if not all_detections:
            resp = self._empty_response("rejected", "No object detected.")
            resp["image"]["filename"] = filename
            return [resp]

        # Sort by confidence (descending) and process only top-N detections
        all_detections.sort(key=lambda x: x.confidence, reverse=True)
        detections = all_detections[: self.max_detections]
        rerank_candidates = all_detections[: self.LABEL_RERANK_TOPK]
        
        results: List[Dict[str, Any]] = []
        
        for detection_idx, detection in enumerate(detections):
            det_start = time.perf_counter()

            # 2. Crop
            # Ensure bbox is within image bounds
            x1, y1, x2, y2 = detection.bbox
            w, h = image.size
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(w, x2)
            y2 = min(h, y2)
            
            if x2 <= x1 or y2 <= y1:
                 continue

            crop = image.crop((x1, y1, x2, y2))

            # 3. Analyze Crop (Caption, OCR, VQA, Grounding)
            florence_start = time.perf_counter()
            analysis = self.florence.analyze_crop(
                crop,
                canonical_label=detection.label,
                profile=profile,
            )
            florence_ms = (time.perf_counter() - florence_start) * 1000.0

            final_detection = detection
            final_label = detection.label
            label_rerank_ms = 0.0
            label_lock = False
            florence_strong_label: Optional[str] = None
            gemini_warnings: List[str] = []
            label_rerank_payload: Dict[str, Any] = {
                "enabled": False,
                "applied": False,
                "initial_label": detection.label,
                "final_label": detection.label,
                "topk_candidates": [],
                "scores_by_label": {},
                "winner_label": detection.label,
                "winner_score": 0,
                "top1_score": 0,
                "selected_bbox_source": "top1",
                "reason": "not_applied_non_primary_detection",
            }
            if detection_idx == 0:
                rerank_start = time.perf_counter()
                rerank_decision = self._rerank_label(
                    top1_label=detection.label,
                    candidates=rerank_candidates,
                    analysis=analysis,
                )
                final_label = str(rerank_decision["final_label"])
                selected_bbox_source = "top1"
                if bool(rerank_decision.get("applied")):
                    matching = [det for det in rerank_candidates if str(getattr(det, "label", "")) == final_label]
                    if matching:
                        final_detection = max(matching, key=lambda det: float(getattr(det, "confidence", 0.0)))
                        selected_bbox_source = "label_best_conf"
                label_rerank_ms = (time.perf_counter() - rerank_start) * 1000.0
                label_rerank_payload = {
                    "enabled": True,
                    "applied": bool(rerank_decision.get("applied", False)),
                    "initial_label": detection.label,
                    "final_label": final_label,
                    "topk_candidates": [
                        {
                            "label": str(getattr(det, "label", "")),
                            "confidence": float(getattr(det, "confidence", 0.0)),
                            "bbox": tuple(getattr(det, "bbox", ())),
                        }
                        for det in rerank_candidates
                    ],
                    "scores_by_label": rerank_decision.get("scores_by_label", {}),
                    "winner_label": rerank_decision.get("winner_label"),
                    "winner_score": int(rerank_decision.get("winner_score", 0)),
                    "top1_score": int(rerank_decision.get("top1_score", 0)),
                    "selected_bbox_source": selected_bbox_source,
                    "reason": str(rerank_decision.get("reason", "")),
                }

                florence_strong_label = self._derive_florence_strong_label(analysis)
                if (
                    florence_strong_label
                    and self._labels_incompatible(detection.label, florence_strong_label)
                ):
                    label_lock = True
                    final_label = florence_strong_label
                    matching = [
                        det for det in rerank_candidates
                        if str(getattr(det, "label", "")) == final_label
                    ]
                    if matching:
                        final_detection = max(
                            matching,
                            key=lambda det: float(getattr(det, "confidence", 0.0)),
                        )
                        label_rerank_payload["selected_bbox_source"] = "label_best_conf"
                    else:
                        label_rerank_payload["selected_bbox_source"] = "top1"
                    label_rerank_payload["final_label"] = final_label
                    label_rerank_payload["reason"] = "canonical_lock_florence_strong"
                    label_rerank_payload["canonical_lock_applied"] = True
                else:
                    label_rerank_payload["canonical_lock_applied"] = False
            else:
                label_rerank_payload["canonical_lock_applied"] = False

            if florence_strong_label is None:
                florence_strong_label = self._derive_florence_strong_label(analysis)

            label_candidates = self._unique_labels(
                [str(getattr(det, "label", "")) for det in rerank_candidates]
                + ([florence_strong_label] if florence_strong_label else [])
            )

            # 4. Construct Evidence JSON for Gemini
            evidence = {
                "detection": {
                    "label": final_label,
                    "confidence": final_detection.confidence,
                    "bbox": final_detection.bbox
                },
                "canonical_label": final_label,
                "label_candidates": label_candidates,
                "label_lock": label_lock,
                "crop_analysis": analysis
            }

            # 5. Reason (Gemini)
            gemini_start = time.perf_counter()
            gemini_error_meta = None
            try:
                gemini_result = self.gemini.run_phase1(
                    evidence,
                    crop_image=crop if include_gemini_image else None,
                )
            except GeminiTransientError as exc:
                logger.warning(
                    "PP1_GEMINI_TRANSIENT_FALLBACK status_code=%s provider_status=%s",
                    exc.status_code,
                    exc.provider_status,
                )
                gemini_error_meta = exc.to_dict()
                gemini_result = {
                    "status": "rejected",
                    "message": RETRYABLE_UNAVAILABLE_MESSAGE,
                    "label": final_label,
                    "color": None,
                    "category_details": {"features": [], "defects": [], "attachments": []},
                    "key_count": None,
                    "final_description": None,
                    "tags": [],
                }
            except GeminiFatalError as exc:
                logger.warning(
                    "PP1_GEMINI_FATAL_FALLBACK status_code=%s provider_status=%s",
                    exc.status_code,
                    exc.provider_status,
                )
                gemini_error_meta = exc.to_dict()
                gemini_result = {
                    "status": "rejected",
                    "message": REASONING_FAILED_MESSAGE,
                    "label": final_label,
                    "color": None,
                    "category_details": {"features": [], "defects": [], "attachments": []},
                    "key_count": None,
                    "final_description": None,
                    "tags": [],
                }
            except Exception as exc:
                logger.exception("PP1_GEMINI_UNKNOWN_ERROR")
                gemini_error_meta = {
                    "type": "gemini_unknown_error",
                    "status_code": None,
                    "retryable": False,
                    "provider_status": None,
                    "message": str(exc),
                }
                gemini_result = {
                    "status": "rejected",
                    "message": REASONING_FAILED_MESSAGE,
                    "label": final_label,
                    "color": None,
                    "category_details": {"features": [], "defects": [], "attachments": []},
                    "key_count": None,
                    "final_description": None,
                    "tags": [],
                }
            gemini_ms = (time.perf_counter() - gemini_start) * 1000.0

            gemini_label_raw = gemini_result.get("label")
            gemini_label = str(gemini_label_raw).strip() if gemini_label_raw is not None else ""
            if (
                florence_strong_label
                and gemini_label
                and self._labels_incompatible(gemini_label, florence_strong_label)
            ):
                gemini_result["label"] = florence_strong_label
                gemini_warnings.append(
                    "Gemini label overridden from "
                    f"{gemini_label} to {florence_strong_label} due to strong Florence evidence (caption/ocr)."
                )
                matching = [
                    det for det in rerank_candidates
                    if str(getattr(det, "label", "")) == florence_strong_label
                ]
                if matching:
                    final_detection = max(
                        matching,
                        key=lambda det: float(getattr(det, "confidence", 0.0)),
                    )
                final_label = florence_strong_label
            
            # 6. Embeddings (DINOv2) from a single forward pass
            embeddings_start = time.perf_counter()
            vec_768_list = []
            vec_128_list = []
            try:
                vec_768, vec_128 = self.dino.embed_both(crop)
                vec_768_list = vec_768.tolist()
                vec_128_list = vec_128.tolist()
            except Exception as e:
                logger.warning("Embedding failed: %s", e)
            embeddings_ms = (time.perf_counter() - embeddings_start) * 1000.0

            total_ms = (time.perf_counter() - det_start) * 1000.0
            timings = {
                "detect_ms": round(detect_ms, 2),
                "florence_ms": round(florence_ms, 2),
                "label_rerank_ms": round(label_rerank_ms, 2),
                "gemini_ms": round(gemini_ms, 2),
                "embeddings_ms": round(embeddings_ms, 2),
                "total_ms": round(total_ms, 2),
            }

            # 7. Construct Final Response
            status = gemini_result.get("status", "rejected")
            
            raw_payload = {
                "yolo": {
                    "label": detection.label,
                    "confidence": detection.confidence,
                    "bbox": detection.bbox
                },
                "florence": analysis,
                "label_rerank": label_rerank_payload,
                "gemini": gemini_result,
                "gemini_warnings": gemini_warnings,
                "timings": timings,
            }
            if gemini_error_meta is not None:
                raw_payload["gemini_error"] = gemini_error_meta

            response = {
                "status": status,
                "message": gemini_result.get("message", "Success" if status == "accepted" else "Rejected by Gemini"),
                "item_id": str(uuid.uuid4()),
                "image": {
                    "image_id": str(uuid.uuid4()),
                    "filename": filename
                },
                "label": gemini_result.get("label") or final_label,
                "confidence": final_detection.confidence,
                "bbox": final_detection.bbox,
                "color": gemini_result.get("color"),
                "ocr_text": analysis.get("ocr_text", ""),
                "final_description": gemini_result.get("final_description"),
                "category_details": gemini_result.get("category_details", {
                    "features": [], "defects": [], "attachments": []
                }),
                "key_count": gemini_result.get("key_count"),
                "tags": gemini_result.get("tags", []),
                "embeddings": {
                    "vector_128d": vec_128_list,
                    "vector_dinov2": vec_768_list
                },
                "processing_time": round(total_ms, 2),
                "raw": raw_payload
            }
            results.append(response)
        
        if not results:
             resp = self._empty_response("rejected", "No valid objects processed.")
             resp["image"]["filename"] = filename
             return [resp]

        request_total_ms = (time.perf_counter() - request_start) * 1000.0
        logger.info(
            "PP1_TIMING total_ms=%.2f detect_ms=%.2f detections=%d profile=%s",
            request_total_ms,
            detect_ms,
            len(results),
            profile,
        )
        if request_total_ms > 8000:
            logger.warning("PP1_SLOW_REQUEST total_ms=%.2f profile=%s", request_total_ms, profile)
             
        return results
