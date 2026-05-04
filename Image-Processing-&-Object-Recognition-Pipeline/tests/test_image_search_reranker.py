import numpy as np
from PIL import Image

from app.services.image_search_reranker import (
    SearchQueryContext,
    build_color_histogram,
    collect_search_tokens,
    extract_brand_tokens,
    histogram_similarity,
    rerank_score,
)


def test_collect_search_tokens_normalizes_and_dedupes():
    tokens = collect_search_tokens("JBL jbl www.example.com cable")
    assert tokens == ["JBL", "EXAMPLE", "CABLE"]


def test_extract_brand_tokens_keeps_brand_like_values():
    assert extract_brand_tokens(["JBL", "abc", "USB-C", "SONY"]) == ["JBL", "SONY"]


def test_histogram_similarity_prefers_same_color_image():
    red = build_color_histogram(Image.new("RGB", (32, 32), color=(255, 0, 0)))
    blue = build_color_histogram(Image.new("RGB", (32, 32), color=(0, 0, 255)))
    assert red is not None
    assert blue is not None
    assert histogram_similarity(red, red) > histogram_similarity(red, blue)


def test_rerank_score_penalizes_color_conflict_and_rewards_brand_overlap():
    query_hist = build_color_histogram(Image.new("RGB", (32, 32), color=(255, 0, 0)))
    assert query_hist is not None
    query = SearchQueryContext(
        category="Wallet",
        normalized_color="red",
        ocr_tokens=["JBL"],
        brand_tokens=["JBL"],
        color_histogram=query_hist,
        base_vector_128=np.ones(128, dtype=np.float32),
    )

    accepted_brand, branded_score, _ = rerank_score(
        query=query,
        candidate_metadata={
            "category": "Wallet",
            "normalized_color": "red",
            "color_histogram": query_hist.tolist(),
            "brand_tokens": ["JBL"],
            "ocr_tokens": ["JBL"],
        },
        base_vector_score=0.84,
    )
    accepted_conflict, conflict_score, debug = rerank_score(
        query=query,
        candidate_metadata={
            "category": "Wallet",
            "normalized_color": "blue",
            "brand_tokens": [],
            "ocr_tokens": [],
        },
        base_vector_score=0.92,
    )

    assert accepted_brand is True
    assert accepted_conflict is True
    assert branded_score > conflict_score
    assert debug["color_conflict"] is True
