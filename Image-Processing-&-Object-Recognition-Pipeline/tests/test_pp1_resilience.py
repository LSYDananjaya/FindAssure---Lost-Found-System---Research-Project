import io
import os
import sys
import tempfile
import unittest
from contextlib import asynccontextmanager
from types import SimpleNamespace
from unittest.mock import MagicMock

import numpy as np
from fastapi.testclient import TestClient
from PIL import Image


# Patch heavy model services before importing pipeline/app modules.
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

from app.services.gemini_reasoner import (
    GeminiFatalError,
    GeminiReasoner,
    GeminiTransientError,
    REASONING_FAILED_MESSAGE,
    RETRYABLE_UNAVAILABLE_MESSAGE,
)
from app.services.unified_pipeline import UnifiedPipeline
from app.main import app
import app.main as main_module

# Restore module table so unrelated tests use real implementations.
for name, module in original_modules.items():
    if module is None:
        del sys.modules[name]
    else:
        sys.modules[name] = module


def _write_temp_image() -> str:
    img = Image.new("RGB", (40, 40), "white")
    handle = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    img.save(handle, format="JPEG")
    handle.close()
    return handle.name


def _image_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (40, 40), "white").save(buf, format="JPEG")
    return buf.getvalue()


def _build_test_pipeline(gemini_behavior):
    pipeline = UnifiedPipeline.__new__(UnifiedPipeline)
    pipeline.yolo = MagicMock()
    pipeline.florence = MagicMock()
    pipeline.gemini = MagicMock()
    pipeline.dino = MagicMock()

    detection = SimpleNamespace(label="Wallet", confidence=0.95, bbox=(2, 2, 30, 30))
    pipeline.yolo.detect_objects.return_value = [detection]
    pipeline.florence.analyze_crop.return_value = {
        "caption": "A wallet",
        "ocr_text": "VISA",
        "grounded_features": [],
        "grounded_defects": [],
        "grounded_attachments": [],
        "raw": {},
    }
    if isinstance(gemini_behavior, Exception):
        pipeline.gemini.run_phase1.side_effect = gemini_behavior
    elif callable(gemini_behavior):
        pipeline.gemini.run_phase1.side_effect = gemini_behavior
    else:
        pipeline.gemini.run_phase1.return_value = gemini_behavior
    pipeline.dino.embed_768.return_value = np.array([0.1, 0.2, 0.3], dtype=float)
    pipeline.dino.embed_128.return_value = np.array([0.4, 0.5, 0.6], dtype=float)
    return pipeline


class TestUnifiedPipelineGeminiFallback(unittest.TestCase):
    def test_transient_gemini_error_degrades_to_rejected(self):
        pipeline = _build_test_pipeline(
            GeminiTransientError("503 UNAVAILABLE", status_code=503, provider_status="UNAVAILABLE")
        )
        path = _write_temp_image()
        try:
            out = pipeline.process_pp1(path)
        finally:
            os.remove(path)

        self.assertEqual(len(out), 1)
        row = out[0]
        self.assertEqual(row["status"], "rejected")
        self.assertEqual(row["message"], RETRYABLE_UNAVAILABLE_MESSAGE)
        self.assertEqual(row["label"], "Wallet")
        self.assertIn("gemini_error", row["raw"])
        self.assertEqual(row["raw"]["gemini_error"]["retryable"], True)
        self.assertEqual(row["raw"]["gemini_error"]["status_code"], 503)
        self.assertEqual(row["raw"]["gemini_error"]["provider_status"], "UNAVAILABLE")

    def test_fatal_gemini_error_degrades_to_reasoning_failed(self):
        pipeline = _build_test_pipeline(
            GeminiFatalError("401 unauthorized", status_code=401, provider_status="UNAUTHENTICATED")
        )
        path = _write_temp_image()
        try:
            out = pipeline.process_pp1(path)
        finally:
            os.remove(path)

        row = out[0]
        self.assertEqual(row["status"], "rejected")
        self.assertEqual(row["message"], REASONING_FAILED_MESSAGE)
        self.assertIn("gemini_error", row["raw"])
        self.assertEqual(row["raw"]["gemini_error"]["retryable"], False)

    def test_success_path_unchanged(self):
        pipeline = _build_test_pipeline(
            {
                "status": "accepted",
                "message": "Extracted successfully",
                "label": "Wallet",
                "color": "black",
                "category_details": {"features": ["logo"], "defects": [], "attachments": []},
                "key_count": None,
                "final_description": "black wallet",
                "tags": ["wallet"],
            }
        )
        path = _write_temp_image()
        try:
            out = pipeline.process_pp1(path)
        finally:
            os.remove(path)

        row = out[0]
        self.assertEqual(row["status"], "accepted")
        self.assertEqual(row["message"], "Extracted successfully")
        self.assertNotIn("gemini_error", row["raw"])


class TestGeminiReasonerRetry(unittest.TestCase):
    def test_generate_text_retries_once_then_succeeds(self):
        class FakeTransient(Exception):
            def __init__(self):
                super().__init__("temporary outage")
                self.status_code = 503
                self.response_json = {"error": {"status": "UNAVAILABLE"}}

        class FakeResponse:
            text = "ok"

        reasoner = GeminiReasoner()
        reasoner._retry_delay_seconds = 0.0
        generate = MagicMock(side_effect=[FakeTransient(), FakeResponse()])
        reasoner._client = SimpleNamespace(models=SimpleNamespace(generate_content=generate))

        text = reasoner._generate_text("prompt")
        self.assertEqual(text, "ok")
        self.assertEqual(generate.call_count, 2)


class TestPP1EndpointResilience(unittest.TestCase):
    def test_pp1_endpoint_returns_200_for_transient_gemini_fallback(self):
        pipeline = _build_test_pipeline(
            GeminiTransientError("503 UNAVAILABLE", status_code=503, provider_status="UNAVAILABLE")
        )

        original_pipeline = main_module.pipeline
        original_lifespan = app.router.lifespan_context

        @asynccontextmanager
        async def noop_lifespan(_app):
            yield

        main_module.pipeline = pipeline
        app.router.lifespan_context = noop_lifespan

        try:
            with TestClient(app) as client:
                files = [("files", ("test.jpg", _image_bytes(), "image/jpeg"))]
                response = client.post("/pp1/analyze", files=files)
        finally:
            main_module.pipeline = original_pipeline
            app.router.lifespan_context = original_lifespan

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(isinstance(payload, list) and len(payload) == 1)
        self.assertEqual(payload[0]["status"], "rejected")
        self.assertEqual(payload[0]["message"], RETRYABLE_UNAVAILABLE_MESSAGE)


if __name__ == "__main__":
    unittest.main()
