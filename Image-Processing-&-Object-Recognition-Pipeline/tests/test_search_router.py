import io
import sys
from contextlib import asynccontextmanager
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image


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
from app.services.image_search_reranker import build_color_histogram


def _solid_hist(color: tuple[int, int, int]) -> list[float]:
    image = Image.new("RGB", (32, 32), color=color)
    hist = build_color_histogram(image)
    assert hist is not None
    return [float(v) for v in hist.tolist()]


class _DummyDet:
    def __init__(self, label="Wallet", confidence=0.9, bbox=(0, 0, 24, 24)):
        self.label = label
        self.cls_name = label
        self.confidence = confidence
        self.bbox = bbox


class _DummyYolo:
    def __init__(self, label="Wallet"):
        self._label = label

    def detect_objects(self, _image):
        return [_DummyDet(label=self._label)]


class _DummyFlorence:
    def __init__(self, ocr_text=""):
        self._ocr_text = ocr_text

    def ocr_structured(self, _image, profile="fast"):
        return {"ocr_text": self._ocr_text}


class _DummyDino:
    def embed_128(self, _image):
        return np.ones(128, dtype=np.float32)


class _DummyFaiss:
    def __init__(self, hits, vectors=None):
        self.saved = False
        self._hits = list(hits)
        self._vectors = vectors or {}

    def add(self, _vector, _metadata):
        return 7

    def save(self):
        self.saved = True

    def search(self, _vector, top_k=5):
        return list(self._hits[:top_k])

    def get_vector(self, faiss_id):
        return self._vectors[faiss_id]

    def compute_similarity(self, _query_vec, stored_vec):
        return float(stored_vec[0])


_CURRENT_YOLO = _DummyYolo()
_CURRENT_DINO = _DummyDino()
_CURRENT_FLORANCE = _DummyFlorence()
_CURRENT_FAISS = _DummyFaiss([])


@asynccontextmanager
async def mock_lifespan(app_obj):
    pipeline_mock = MagicMock()
    pipeline_mock.yolo = _CURRENT_YOLO
    pipeline_mock.dino = _CURRENT_DINO
    pipeline_mock.florence = _CURRENT_FLORANCE
    pipeline_mock.faiss = _CURRENT_FAISS

    app_obj.state.multiview_pipeline = pipeline_mock
    yield
    app_obj.state.multiview_pipeline = None


app.router.lifespan_context = mock_lifespan


def _image_bytes(color=(255, 0, 0)) -> bytes:
    image = Image.new("RGB", (32, 32), color=color)
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def _make_hit(
    *,
    faiss_id,
    item_id,
    score,
    category,
    color=None,
    color_histogram=None,
    brand=None,
    brand_tokens=None,
    ocr_tokens=None,
):
    payload = {
        "score": score,
        "faiss_id": faiss_id,
        "item_id": item_id,
        "category": category,
    }
    if color is not None:
        payload["normalized_color"] = color
    if color_histogram is not None:
        payload["color_histogram"] = color_histogram
    if brand is not None:
        payload["brand"] = brand
    if brand_tokens is not None:
        payload["brand_tokens"] = brand_tokens
    if ocr_tokens is not None:
        payload["ocr_tokens"] = ocr_tokens
    return payload


def _set_pipeline(*, hits, vectors, yolo_label="Wallet", ocr_text=""):
    global _CURRENT_YOLO, _CURRENT_DINO, _CURRENT_FLORANCE, _CURRENT_FAISS
    _CURRENT_YOLO = _DummyYolo(label=yolo_label)
    _CURRENT_DINO = _DummyDino()
    _CURRENT_FLORANCE = _DummyFlorence(ocr_text=ocr_text)
    _CURRENT_FAISS = _DummyFaiss(hits=hits, vectors=vectors)


def test_index_vector_returns_faiss_id():
    _set_pipeline(hits=[], vectors={})
    with TestClient(app) as client:
        payload = {
            "vector_128d": [0.1] * 128,
            "metadata": {"item_id": "item-123"},
        }
        response = client.post("/search/index_vector", json=payload)
        assert response.status_code == 200
        assert response.json()["faiss_id"] == 7


def test_search_by_image_rejects_category_mismatch():
    red_hist = _solid_hist((255, 0, 0))
    hits = [
        _make_hit(faiss_id=7, item_id="item-wallet", score=0.82, category="Wallet", color="red", color_histogram=red_hist),
        _make_hit(faiss_id=8, item_id="item-bag", score=0.96, category="Bag", color="red", color_histogram=red_hist),
    ]
    vectors = {
        7: np.full(128, 0.82, dtype=np.float32),
        8: np.full(128, 0.96, dtype=np.float32),
    }
    _set_pipeline(hits=hits, vectors=vectors, yolo_label="Wallet")

    with TestClient(app) as client:
        response = client.post("/search/by-image", files={"file": ("query.png", _image_bytes(), "image/png")}, data={"top_k": "2"})

        assert response.status_code == 200
        payload = response.json()
        assert payload["category_filter"] == "Wallet"
        assert [match["item_id"] for match in payload["matches"]] == ["item-wallet"]


def test_search_by_image_penalizes_color_conflicts():
    red_hist = _solid_hist((255, 0, 0))
    blue_hist = _solid_hist((0, 0, 255))
    hits = [
        _make_hit(faiss_id=7, item_id="item-red", score=0.82, category="Wallet", color="red", color_histogram=red_hist),
        _make_hit(faiss_id=8, item_id="item-blue", score=0.93, category="Wallet", color="blue", color_histogram=blue_hist),
    ]
    vectors = {
        7: np.full(128, 0.82, dtype=np.float32),
        8: np.full(128, 0.93, dtype=np.float32),
    }
    _set_pipeline(hits=hits, vectors=vectors, yolo_label="Wallet")

    with TestClient(app) as client:
        response = client.post("/search/by-image", files={"file": ("query.png", _image_bytes(), "image/png")}, data={"top_k": "2"})

        assert response.status_code == 200
        payload = response.json()
        assert [match["item_id"] for match in payload["matches"]] == ["item-red"]


def test_search_by_image_prefers_brand_and_ocr_overlap():
    red_hist = _solid_hist((255, 0, 0))
    hits = [
        _make_hit(
            faiss_id=7,
            item_id="item-generic",
            score=0.89,
            category="Wallet",
            color="red",
            color_histogram=red_hist,
        ),
        _make_hit(
            faiss_id=8,
            item_id="item-jbl",
            score=0.86,
            category="Wallet",
            color="red",
            color_histogram=red_hist,
            brand="JBL",
            brand_tokens=["JBL"],
            ocr_tokens=["JBL"],
        ),
    ]
    vectors = {
        7: np.full(128, 0.89, dtype=np.float32),
        8: np.full(128, 0.86, dtype=np.float32),
    }
    _set_pipeline(hits=hits, vectors=vectors, yolo_label="Wallet", ocr_text="JBL")

    with TestClient(app) as client:
        response = client.post(
            "/search/by-image",
            files={"file": ("query.png", _image_bytes(), "image/png")},
            data={"top_k": "2", "return_debug_scores": "true"},
        )

        assert response.status_code == 200
        payload = response.json()
        assert [match["item_id"] for match in payload["matches"]] == ["item-jbl", "item-generic"]
        assert payload["matches"][0]["metadata"]["rerank_debug"]["brand_overlap"] == pytest.approx(1.0)


def test_search_by_image_keeps_match_when_color_unknown():
    red_hist = _solid_hist((255, 0, 0))
    hits = [
        _make_hit(
            faiss_id=7,
            item_id="item-strong",
            score=0.96,
            category="Wallet",
            color="blue",
            color_histogram=red_hist,
        ),
    ]
    vectors = {
        7: np.full(128, 0.96, dtype=np.float32),
    }
    _set_pipeline(hits=hits, vectors=vectors, yolo_label="Wallet")

    with patch("app.routers.search_router.extract_pixel_dominant_color", return_value=None):
        with TestClient(app) as client:
            response = client.post(
                "/search/by-image",
                files={"file": ("query.png", _image_bytes(), "image/png")},
                data={"top_k": "1", "min_score": "0.55"},
            )

            assert response.status_code == 200
            payload = response.json()
            assert [match["item_id"] for match in payload["matches"]] == ["item-strong"]
