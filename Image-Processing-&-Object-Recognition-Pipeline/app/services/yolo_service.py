from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import logging

from ultralytics import YOLO
from app.domain.category_specs import canonicalize_label

# Configure logging
logger = logging.getLogger(__name__)

# Config constants
MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
YOLO_WEIGHTS_PATH = MODEL_DIR / "final_master_model.pt"

@dataclass
class YoloDetection:
    label: str
    confidence: float
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2

class YoloService:
    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        """
        Load YOLOv8 model from local weights.
        Raises RuntimeError if weights file is missing.
        """
        if not YOLO_WEIGHTS_PATH.exists():
            error_msg = f"YOLO weights not found at {YOLO_WEIGHTS_PATH}. Please ensure the model file is present."
            logger.error(error_msg)
            raise RuntimeError(error_msg)

        try:
            logger.info(f"Loading YOLO model from {YOLO_WEIGHTS_PATH}...")
            # Load model using the string path as posix
            self.model = YOLO(YOLO_WEIGHTS_PATH.as_posix())
            logger.info("YOLO model loaded successfully.")
        except Exception as e:
            error_msg = f"Failed to load YOLO model: {str(e)}"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from e

    def detect_objects(
        self,
        image_path_or_array: Any,
        conf_threshold: float = 0.25,
        max_detections: Optional[int] = None,
    ) -> List[YoloDetection]:
        """
        Run object detection on the provided image.
        
        Args:
            image_path_or_array: Path to image or numpy array/PIL Image.
            conf_threshold: Confidence threshold for detections.
            max_detections: Optional top-K truncation. If None, return all detections.

        Returns:
            List of YoloDetection objects with raw labels.
        """
        if self.model is None:
            raise RuntimeError("YOLO model is not loaded.")

        results = self.model(image_path_or_array, conf=conf_threshold, verbose=False)
        
        detections = []
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Get class ID and confidence
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                
                # Get raw class name from model names dict
                raw_label = self.model.names[cls_id]
                
                # Canonicalize label for downstream consistency
                canonical = canonicalize_label(raw_label)
                final_label = canonical if canonical else raw_label

                # Get bounding box coordinates (x1, y1, x2, y2)
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                detections.append(YoloDetection(
                    label=final_label,
                    confidence=conf,
                    bbox=(x1, y1, x2, y2)
                ))

        detections.sort(key=lambda x: x.confidence, reverse=True)
        if isinstance(max_detections, int) and max_detections > 0:
            detections = detections[:max_detections]

        return detections
