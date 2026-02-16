import uuid
import cv2
import numpy as np
import io
from PIL import Image
from typing import Any, Dict, List, Optional
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


class MultiViewPipeline:
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
            grounded_features = {"features": self._normalize_string_list(grounded_raw)}
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

    async def analyze(self, files: List[UploadFile], storage: StorageService) -> PP2Response:
        item_id = str(uuid.uuid4())
        per_view_results = []
        vectors = []
        crops = []
        
        # 1. Process each view independenty
        for i, file in enumerate(files):
            pil_img = self._load_image(file)
            filename = file.filename or f"view_{i}.jpg"
            
            # A. Detection
            detections = self.yolo.detect_objects(pil_img)
            
            if detections:
                # Naive: take best confidence
                # Improvement: Use logic from unified pipeline to pick 'main' object
                best_det = max(detections, key=lambda x: x.confidence)
                bbox = best_det.bbox # (x1, y1, x2, y2)
                
                # B. Crop
                # Ensure bbox is within bounds
                w, h = pil_img.size
                x1, y1, x2, y2 = bbox
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)
                
                try:
                    crop = pil_img.crop((x1, y1, x2, y2))
                except Exception:
                    # Fallback if crop invalid
                    crop = pil_img
                
                cls_name = best_det.label
                det_conf = best_det.confidence
            else:
                # Fallback: Whole Image
                bbox = (0.0, 0.0, float(pil_img.width), float(pil_img.height))
                crop = pil_img
                cls_name = "unknown"
                det_conf = 0.0
            
            # C. Extract Features (Florence)
            # Using analyze_crop which handles caption, ocr, grounding
            # We pass cls_name to help grounding if needed, or leave generic
            extraction_data = self.florence.analyze_crop(crop, canonical_label=cls_name)

            normalized = self._normalize_extraction_payload(extraction_data)
            caption = normalized["caption"]
            ocr_text = normalized["ocr_text"]
            grounded = normalized["grounded_features"]
            
            # D. Embedding (DINO)
            # Used for verification
            vector = self.dino.embed_128(crop) # Returns list[float]
            
            # Collect for verification
            vectors.append(vector)
            crops.append(crop)

            # E. Quality
            quality = self._compute_quality(crop)
            
            # F. Build Result Object
            per_view_results.append(PP2PerViewResult(
                view_index=i,
                filename=filename,
                detection=PP2PerViewDetection(
                    bbox=(float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])),
                    cls_name=cls_name,
                    confidence=det_conf
                ),
                extraction=PP2PerViewExtraction(
                    caption=caption,
                    ocr_text=ocr_text,
                    grounded_features=grounded,
                    extraction_confidence=1.0 # Placeholder
                ),
                embedding=PP2PerViewEmbedding(
                    dim=len(vector),
                    vector_preview=vector[:8],
                    vector_id=f"{item_id}_view_{i}"
                ),
                quality_score=quality
            ))
            
        # 2. Verification
        # Convert vectors to numpy for verifier
        vectors_np = [np.array(v) for v in vectors]
        verification = self.verifier.verify(per_view_results, vectors_np, crops, self.faiss)
        
        # 3. Fusion & Storage
        fused = None
        stored = False
        cache_key = None
        
        if verification.passed:
            # Ensure vectors are numpy arrays for the fusion service
            vectors_np = [np.array(v) for v in vectors]
            fused = self.fusion.fuse(per_view_results, vectors_np)
            fused.fused_embedding_id = f"{item_id}_fused"
            
            # Calculate fused vector for storage (Simple Mean if not provided by fusion service logic directly as vector)
            if vectors:
                # Use numpy to mean the vectors (list of lists or arrays)
                fused_vector_np = np.mean(vectors_np, axis=0)
                fused_vector = fused_vector_np.tolist()
            else:
                fused_vector = []

            # Prepare data for synchronous storage call
            per_view_dicts = [res.model_dump() for res in per_view_results]
            fused_dict = fused.model_dump()
            
            # Call synchronous store_multiview_result
            result = storage.store_multiview_result(
                item_id=item_id,
                per_view_results=per_view_dicts,
                fused_profile=fused_dict,
                fused_vector=fused_vector,
                faiss_id=-1  # Placeholder
            )
            
            stored = result.get("stored", False)
            cache_key = result.get("cache_key")
            
            # Add to Index
            # Ideally we fuse the embeddings mathematically or pick best
            # For now, simplistic: use first view or best view embedding
            if per_view_results:
                 # TODO: Actual vector retrieval (currently using dummy/recomputed coverage)
                 pass
            
        return PP2Response(
            item_id=item_id,
            per_view=per_view_results,
            verification=verification,
            fused=fused,
            stored=stored,
            cache_key=cache_key
        )
