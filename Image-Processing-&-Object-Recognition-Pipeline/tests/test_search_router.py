import io
import sys
from contextlib import asynccontextmanager
from unittest.mock import MagicMock

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image


# Patch heavy modules before importing app.main
mock_yolo_module = MagicMock()
mock_florence_module = MagicMock()
mock_dino_module = MagicMock()

mock_yolo_module.YoloService = MagicMock()
mock_florence_module.FlorenceService = MagicMock()
mock_dino_module.DINOEmbedder = MagicMock()

sys.modules["app.services.yolo_service"] = mock_yolo_module
sys.modules["app.services.florence_service"] = mock_florence_module
sys.modules["app.services.dino_embedder"] = mock_dino_module

from app.main import app


class _DummyDet:
    def __init__(self):
        self.confidence = 0.9
        self.bbox = (0, 0, 10, 10)


class _DummyYolo:
    def detect_objects(self, _image):
        return [_DummyDet()]


class _DummyDino:
    def embed_128(self, _image):
        return np.ones(128, dtype=np.float32)


class _DummyFaiss:
    def __init__(self):
        self.saved = False
        self._vectors = {
            7: np.full(128, 0.74, dtype=np.float32),
            8: np.full(128, 0.92, dtype=np.float32),
            10: np.full(128, 0.88, dtype=np.float32),
            11: np.full(128, 0.81, dtype=np.float32),
        }

    def add(self, _vector, _metadata):
        return 7

    def save(self):
        self.saved = True

    def search(self, _vector, top_k=5):
        hits = [
            {
                "score": 0.92,
                "faiss_id": 7,
                "item_id": "item-123",
                "category": "Wallet",
                "fused_embedding_id": "item-123_fused",
            },
            {
                "score": 0.97,
                "faiss_id": 8,
                "item_id": "item-123",
                "category": "Wallet",
                "view_index": 1,
            },
            {
                "score": 0.89,
                "faiss_id": 10,
                "item_id": "item-xyz",
                "category": "Bag",
                "view_index": 3,
            },
            {
                "score": 0.86,
                "faiss_id": 11,
                "item_id": "item-xyz",
                "category": "Bag",
                "view_index": 2,
            },
        ]
        return hits[:top_k]

    def get_vector(self, faiss_id):
        return self._vectors[faiss_id]

    def compute_similarity(self, _query_vec, stored_vec):
        return float(stored_vec[0])


@asynccontextmanager
async def mock_lifespan(app_obj):
    pipeline_mock = MagicMock()
    pipeline_mock.yolo = _DummyYolo()
    pipeline_mock.dino = _DummyDino()
    pipeline_mock.faiss = _DummyFaiss()

    app_obj.state.multiview_pipeline = pipeline_mock
    yield
    app_obj.state.multiview_pipeline = None


app.router.lifespan_context = mock_lifespan


def _image_bytes() -> bytes:
    image = Image.new("RGB", (32, 32), color=(255, 0, 0))
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def test_index_vector_returns_faiss_id():
    with TestClient(app) as client:
        payload = {
            "vector_128d": [0.1] * 128,
            "metadata": {"item_id": "item-123"},
        }
        response = client.post("/search/index_vector", json=payload)
        assert response.status_code == 200
        assert response.json()["faiss_id"] == 7


def test_search_by_image_returns_matches():
    with TestClient(app) as client:
        files = {"file": ("query.png", _image_bytes(), "image/png")}
        data = {"top_k": "2", "min_score": "0.7"}

        response = client.post("/search/by-image", files=files, data=data)

        assert response.status_code == 200
        payload = response.json()
        assert payload["top_k"] == 2
        assert payload["min_score"] == 0.7
        assert len(payload["matches"]) == 2
        assert [match["item_id"] for match in payload["matches"]] == ["item-xyz", "item-123"]
        top_match = payload["matches"][0]
        fused_match = payload["matches"][1]
        assert top_match["score"] == pytest.approx(0.88)
        assert top_match["canonical_score"] == pytest.approx(0.88)
        assert top_match["best_hit_score"] == pytest.approx(0.89)
        assert top_match["score_source"] == "canonical_full_vs_fallback"
        assert fused_match["faiss_id"] == 7
        assert fused_match["score"] == pytest.approx(0.74)
        assert fused_match["canonical_score"] == pytest.approx(0.74)
        assert fused_match["best_hit_score"] == pytest.approx(0.97)
        assert fused_match["score_source"] == "canonical_full_vs_fused"
        assert fused_match["vector_hits_count"] == 2


def test_search_by_image_prefers_fused_vector_for_canonical_score():
    with TestClient(app) as client:
        files = {"file": ("query.png", _image_bytes(), "image/png")}

        response = client.post("/search/by-image", files=files, data={"top_k": "2", "min_score": "0.7"})

        assert response.status_code == 200
        payload = response.json()
        item = next(match for match in payload["matches"] if match["item_id"] == "item-123")
        assert item["item_id"] == "item-123"
        assert item["faiss_id"] == 7
        assert item["score"] < item["best_hit_score"]
        assert item["metadata"]["canonical_from_faiss_id"] == 7
        assert item["metadata"]["canonical_query_view"] == "full"


def test_search_by_image_uses_lowest_faiss_id_for_fallback_canonical_score():
    with TestClient(app) as client:
        files = {"file": ("query.png", _image_bytes(), "image/png")}

        response = client.post("/search/by-image", files=files, data={"top_k": "2", "min_score": "0.7"})

        assert response.status_code == 200
        payload = response.json()
        fallback_item = next(match for match in payload["matches"] if match["item_id"] == "item-xyz")
        assert fallback_item["faiss_id"] == 10
        assert fallback_item["score"] == pytest.approx(0.88)


def test_search_by_image_repeated_calls_return_same_canonical_score():
    with TestClient(app) as client:
        files = {"file": ("query.png", _image_bytes(), "image/png")}
        data = {"top_k": "2", "min_score": "0.7"}

        response_a = client.post("/search/by-image", files=files, data=data)
        response_b = client.post("/search/by-image", files={"file": ("query.png", _image_bytes(), "image/png")}, data=data)

        assert response_a.status_code == 200
        assert response_b.status_code == 200
        first_a = response_a.json()["matches"][0]
        first_b = response_b.json()["matches"][0]
        assert first_a["item_id"] == first_b["item_id"] == "item-xyz"
        assert first_a["score"] == pytest.approx(first_b["score"])


def test_search_by_image_defaults_to_top1_item():
    with TestClient(app) as client:
        files = {"file": ("query.png", _image_bytes(), "image/png")}
        response = client.post("/search/by-image", files=files)

        assert response.status_code == 200
        payload = response.json()
        assert payload["top_k"] == 1
        assert len(payload["matches"]) == 1
        assert payload["matches"][0]["item_id"] == "item-xyz"


def test_search_by_image_filters_on_canonical_score():
    with TestClient(app) as client:
        files = {"file": ("query.png", _image_bytes(), "image/png")}

        response = client.post("/search/by-image", files=files, data={"top_k": "2", "min_score": "0.8"})

        assert response.status_code == 200
        payload = response.json()
        assert [match["item_id"] for match in payload["matches"]] == ["item-xyz"]
