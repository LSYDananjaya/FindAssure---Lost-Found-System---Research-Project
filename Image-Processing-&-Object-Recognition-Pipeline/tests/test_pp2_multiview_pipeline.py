import sys
import unittest
from unittest.mock import MagicMock


# Patch service imports before importing MultiViewPipeline to avoid heavy deps in unit tests.
mock_yolo_module = MagicMock()
mock_florence_module = MagicMock()
mock_dino_module = MagicMock()

mock_yolo_module.YoloService = MagicMock()
mock_florence_module.FlorenceService = MagicMock()
mock_dino_module.DINOEmbedder = MagicMock()

patched_modules = {
    "app.services.yolo_service": mock_yolo_module,
    "app.services.florence_service": mock_florence_module,
    "app.services.dino_embedder": mock_dino_module,
}
original_modules = {name: sys.modules.get(name) for name in patched_modules}

for name, module in patched_modules.items():
    sys.modules[name] = module

from app.services.pp2_multiview_pipeline import MultiViewPipeline

# Restore module table so unrelated tests use real implementations.
for name, module in original_modules.items():
    if module is None:
        del sys.modules[name]
    else:
        sys.modules[name] = module


class TestMultiViewPipelineNormalization(unittest.TestCase):
    def setUp(self):
        self.pipeline = MultiViewPipeline(
            yolo=MagicMock(),
            florence=MagicMock(),
            dino=MagicMock(),
            verifier=MagicMock(),
            fusion=MagicMock(),
            faiss=MagicMock(),
        )

    def test_normalize_list_grounded_features(self):
        payload = {
            "caption": "sample",
            "ocr_text": "text",
            "grounded_features": ["logo", 123, None, " "],
            "grounded_defects": ["scratch"],
            "grounded_attachments": ["key ring"],
            "color_vqa": "black",
            "key_count": 2,
        }

        normalized = self.pipeline._normalize_extraction_payload(payload)
        grounded = normalized["grounded_features"]

        self.assertIsInstance(grounded, dict)
        self.assertEqual(grounded["features"], ["logo", "123"])
        self.assertEqual(grounded["defects"], ["scratch"])
        self.assertEqual(grounded["attachments"], ["key ring"])
        self.assertEqual(grounded["color"], "black")
        self.assertEqual(grounded["key_count"], 2)

    def test_normalize_dict_grounded_features_preserves_existing_color(self):
        payload = {
            "caption": "sample",
            "grounded_features": {
                "brand": "Acme",
                "color": "brown",
                "defects": ["scratch"],
            },
            "grounded_defects": ["dent"],
            "grounded_attachments": ["lanyard"],
            "color_vqa": "black",
            "key_count": 1,
        }

        normalized = self.pipeline._normalize_extraction_payload(payload)
        grounded = normalized["grounded_features"]

        self.assertEqual(grounded["brand"], "Acme")
        self.assertEqual(grounded["color"], "brown")
        self.assertEqual(grounded["defects"], ["scratch", "dent"])
        self.assertEqual(grounded["attachments"], ["lanyard"])
        self.assertEqual(grounded["key_count"], 1)

    def test_normalize_invalid_grounded_features_fallback(self):
        payload = {
            "caption": "sample",
            "grounded_features": "logo",
        }

        normalized = self.pipeline._normalize_extraction_payload(payload)
        grounded = normalized["grounded_features"]

        self.assertIsInstance(grounded, dict)
        self.assertEqual(grounded, {})

    def test_ocr_prefers_ocr_text_over_ocr(self):
        payload = {
            "caption": "sample",
            "ocr_text": "preferred",
            "ocr": "fallback",
            "grounded_features": {},
        }

        normalized = self.pipeline._normalize_extraction_payload(payload)
        self.assertEqual(normalized["ocr_text"], "preferred")

    def test_ocr_fallback_to_ocr_and_list_join(self):
        payload = {
            "caption": "sample",
            "ocr": ["AB", "123"],
            "grounded_features": {},
        }

        normalized = self.pipeline._normalize_extraction_payload(payload)
        self.assertEqual(normalized["ocr_text"], "AB 123")


if __name__ == "__main__":
    unittest.main()
