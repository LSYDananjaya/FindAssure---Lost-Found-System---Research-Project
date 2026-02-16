from typing import Any, Dict, List, Optional
from PIL import Image
import os
import uuid
import logging
import numpy as np

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
# from app.domain.category_specs import ALLOWED_LABELS # Removed restriction

logger = logging.getLogger(__name__)

class UnifiedPipeline:
    def __init__(self):
        # Initialize services
        # Note: Models are loaded lazily or on first use in their respective services
        self.yolo = YoloService()
        self.florence = FlorenceService()
        self.gemini = GeminiReasoner()
        self.dino = DINOEmbedder()

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
        if not os.path.exists(image_path):
            return [self._empty_response("rejected", f"Image file not found: {image_path}")]

        try:
            image = Image.open(image_path).convert("RGB")
        except Exception as e:
            return [self._empty_response("rejected", f"Failed to open image: {str(e)}")]

        filename = os.path.basename(image_path)

        # 1. Detect
        detections = self.yolo.detect_objects(image)
        
        if not detections:
            resp = self._empty_response("rejected", "No object detected.")
            resp["image"]["filename"] = filename
            return [resp]

        # Sort by confidence (descending)
        detections.sort(key=lambda x: x.confidence, reverse=True)
        
        # Process all detections
        results = []
        
        for detection in detections:
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
            # FlorenceService.analyze_crop now handles grounding internally using CATEGORY_SPECS
            analysis = self.florence.analyze_crop(crop, canonical_label=detection.label)

            # 4. Construct Evidence JSON for Gemini
            evidence = {
                "detection": {
                    "label": detection.label,
                    "confidence": detection.confidence,
                    "bbox": detection.bbox
                },
                "crop_analysis": analysis
            }

            # 5. Reason (Gemini)
            gemini_error_meta = None
            try:
                gemini_result = self.gemini.run_phase1(evidence, crop_image=crop)
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
                    "label": detection.label,
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
                    "label": detection.label,
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
                    "label": detection.label,
                    "color": None,
                    "category_details": {"features": [], "defects": [], "attachments": []},
                    "key_count": None,
                    "final_description": None,
                    "tags": [],
                }
            
            # 6. Embeddings (DINOv2)
            # We embed the CROP to get object-centric embeddings
            vec_768_list = []
            vec_128_list = []
            try:
                vec_768 = self.dino.embed_768(crop)
                vec_128 = self.dino.embed_128(crop)
                # Convert to list
                vec_768_list = vec_768.tolist()
                vec_128_list = vec_128.tolist()
            except Exception as e:
                logger.warning("Embedding failed: %s", e)
                # Keep empty lists

            # 7. Construct Final Response
            status = gemini_result.get("status", "rejected")
            
            raw_payload = {
                "yolo": {
                    "label": detection.label,
                    "confidence": detection.confidence,
                    "bbox": detection.bbox
                },
                "florence": analysis,
                "gemini": gemini_result
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
                "label": gemini_result.get("label") or detection.label, # Fallback to YOLO label if Gemini is unsure
                "confidence": detection.confidence,
                "bbox": detection.bbox,
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
                "raw": raw_payload
            }
            results.append(response)
        
        if not results:
             resp = self._empty_response("rejected", "No valid objects processed.")
             resp["image"]["filename"] = filename
             return [resp]
             
        return results
