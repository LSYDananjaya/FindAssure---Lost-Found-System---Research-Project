"""Reranking helpers for image-based retrieval.

Module overview: FAISS gives visually similar candidates, but this module decides
which candidates are convincing enough by combining vector similarity with
category, color, OCR, brand, and histogram signals.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import re
from typing import Any, Iterable, Optional

import cv2
import numpy as np
from PIL import Image

from app.domain.color_utils import normalize_color

# The reranker only consumes lightweight metadata and vectors already produced
# by PP1/PP2. It should stay side-effect free so search ranking can be tested
# independently from model execution.


_TOKEN_RE = re.compile(r"[A-Za-z0-9]+")
_BRAND_RE = re.compile(r"^[A-Z]+$")
_STOP_TOKENS = {
    "HTTP",
    "HTTPS",
    "WWW",
    "COM",
    "NET",
    "ORG",
    "LK",
    "CO",
    "THE",
    "AND",
    "FOR",
    "USB",
}


@dataclass
class SearchQueryContext:
    """All query-side signals available after processing the uploaded image."""

    category: Optional[str] = None
    normalized_color: Optional[str] = None
    ocr_tokens: list[str] = field(default_factory=list)
    brand_tokens: list[str] = field(default_factory=list)
    color_histogram: Optional[np.ndarray] = None
    rerank_vector_768: Optional[np.ndarray] = None
    base_vector_128: Optional[np.ndarray] = None
    primary_view: str = "full"


def normalize_search_token(raw: Any) -> str:
    """Normalize raw search text into a stable uppercase token."""
    token = str(raw or "").strip().upper()
    if not token:
        return ""
    token = "".join(ch for ch in token if ch.isalnum())
    if len(token) < 3:
        return ""
    if token in _STOP_TOKENS:
        return ""
    return token


def collect_search_tokens(values: Any) -> list[str]:
    """Normalize OCR/metadata text into stable tokens for overlap scoring."""

    if values is None:
        return []

    raw_tokens: list[str] = []
    if isinstance(values, str):
        raw_tokens.extend(_TOKEN_RE.findall(values))
    elif isinstance(values, (list, tuple, set)):
        for value in values:
            raw_tokens.extend(_TOKEN_RE.findall(str(value or "")))
    else:
        raw_tokens.extend(_TOKEN_RE.findall(str(values)))

    deduped: list[str] = []
    seen: set[str] = set()
    for raw in raw_tokens:
        token = normalize_search_token(raw)
        if not token or token in seen:
            continue
        seen.add(token)
        deduped.append(token)
    return deduped


def extract_brand_tokens(values: Any) -> list[str]:
    """Extract likely brand tokens from OCR or metadata values."""
    raw_tokens: list[str] = []
    if values is None:
        return []
    if isinstance(values, str):
        raw_tokens.extend(_TOKEN_RE.findall(values))
    elif isinstance(values, (list, tuple, set)):
        for value in values:
            raw_tokens.extend(_TOKEN_RE.findall(str(value or "")))
    else:
        raw_tokens.extend(_TOKEN_RE.findall(str(values)))

    deduped: list[str] = []
    seen: set[str] = set()
    for raw in raw_tokens:
        token = normalize_search_token(raw)
        if not token or token in seen:
            continue
        if token in _STOP_TOKENS or not _BRAND_RE.fullmatch(token) or not (3 <= len(token) <= 20):
            continue
        if not any(ch.isupper() for ch in str(raw)):
            continue
        seen.add(token)
        deduped.append(token)
    return deduped


def build_color_histogram(image: Optional[Image.Image], bins: tuple[int, int, int] = (8, 4, 4)) -> Optional[np.ndarray]:
    """Build a compact HSV histogram for color-aware reranking."""

    if image is None or not isinstance(image, Image.Image):
        return None

    rgb = np.array(image.convert("RGB"))
    if rgb.size == 0:
        return None

    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    hist = cv2.calcHist([hsv], [0, 1, 2], None, list(bins), [0, 180, 0, 256, 0, 256])
    hist = hist.astype(np.float32).reshape(-1)
    total = float(hist.sum())
    if total <= 0:
        return None
    hist /= total
    return hist


def histogram_similarity(left: Optional[np.ndarray], right: Optional[np.ndarray]) -> float:
    """Compare two color histograms and return a normalized similarity score."""
    if left is None or right is None:
        return 0.0
    lvec = np.asarray(left, dtype=np.float32).reshape(-1)
    rvec = np.asarray(right, dtype=np.float32).reshape(-1)
    if lvec.size == 0 or rvec.size == 0 or lvec.size != rvec.size:
        return 0.0
    corr = float(cv2.compareHist(lvec.reshape(-1, 1), rvec.reshape(-1, 1), cv2.HISTCMP_CORREL))
    return max(0.0, min(1.0, (corr + 1.0) / 2.0))


def vector_similarity(left: Optional[np.ndarray], right: Optional[np.ndarray]) -> Optional[float]:
    """Compute cosine similarity for two optional vectors when dimensions are valid."""
    if left is None or right is None:
        return None
    lvec = np.asarray(left, dtype=np.float32).reshape(-1)
    rvec = np.asarray(right, dtype=np.float32).reshape(-1)
    if lvec.size == 0 or rvec.size == 0 or lvec.size != rvec.size:
        return None
    lnorm = float(np.linalg.norm(lvec))
    rnorm = float(np.linalg.norm(rvec))
    if lnorm <= 1e-12 or rnorm <= 1e-12:
        return None
    return float(np.dot(lvec, rvec) / (lnorm * rnorm))


def color_conflict(query_color: Optional[str], candidate_color: Optional[str]) -> bool:
    """Return whether two normalized colors are both present and different."""
    left = normalize_color(str(query_color or "")) or ""
    right = normalize_color(str(candidate_color or "")) or ""
    return bool(left and right and left != right)


def token_overlap_score(query_tokens: Iterable[str], candidate_tokens: Iterable[str]) -> float:
    """Score normalized token overlap between query and candidate token sets."""
    qset = {normalize_search_token(token) for token in query_tokens}
    cset = {normalize_search_token(token) for token in candidate_tokens}
    qset.discard("")
    cset.discard("")
    if not qset or not cset:
        return 0.0
    overlap = qset.intersection(cset)
    if not overlap:
        return 0.0
    return float(len(overlap) / max(1, min(len(qset), len(cset))))


def parse_histogram(values: Any) -> Optional[np.ndarray]:
    """Parse a serialized histogram into a normalized NumPy vector."""
    if not isinstance(values, (list, tuple)):
        return None
    try:
        arr = np.asarray(values, dtype=np.float32).reshape(-1)
    except Exception:
        return None
    if arr.size == 0:
        return None
    total = float(arr.sum())
    if total > 0:
        arr = (arr / total).astype(np.float32, copy=False)
    return arr


def parse_vector(values: Any, *, expected_dim: Optional[int] = None) -> Optional[np.ndarray]:
    """Parse a serialized vector into a NumPy array with optional dimension validation."""
    if not isinstance(values, (list, tuple)):
        return None
    try:
        arr = np.asarray(values, dtype=np.float32).reshape(-1)
    except Exception:
        return None
    if arr.size == 0:
        return None
    if expected_dim is not None and arr.size != expected_dim:
        return None
    return arr


def resolve_candidate_category(metadata: dict[str, Any]) -> Optional[str]:
    """Resolve the candidate category from searchable metadata fields."""
    raw = metadata.get("category") or metadata.get("label")
    if raw is None:
        return None
    text = str(raw).strip()
    return text or None


def resolve_candidate_color(metadata: dict[str, Any]) -> Optional[str]:
    """Resolve and normalize the candidate color from searchable metadata fields."""
    raw = metadata.get("normalized_color") or metadata.get("color")
    if raw is None:
        return None
    text = normalize_color(str(raw).strip()) or str(raw).strip()
    return text or None


def build_item_metadata(hits: list[dict[str, Any]], canonical_metadata: dict[str, Any]) -> dict[str, Any]:
    """Merge per-hit metadata into one candidate-level reranking payload."""
    merged = dict(canonical_metadata)

    ocr_tokens: list[str] = []
    brand_tokens: list[str] = []
    for hit in hits:
        meta = hit.get("metadata", {}) if isinstance(hit.get("metadata"), dict) else {}
        ocr_tokens.extend(collect_search_tokens(meta.get("ocr_tokens") or meta.get("merged_ocr_tokens") or meta.get("ocr_text")))
        brand_tokens.extend(extract_brand_tokens(meta.get("brand_tokens") or meta.get("brand")))
        if not merged.get("category") and meta.get("category"):
            merged["category"] = meta.get("category")
        if not merged.get("label") and meta.get("label"):
            merged["label"] = meta.get("label")
        if not merged.get("normalized_color") and meta.get("normalized_color"):
            merged["normalized_color"] = meta.get("normalized_color")
        if not merged.get("color") and meta.get("color"):
            merged["color"] = meta.get("color")
        if "color_histogram" not in merged and meta.get("color_histogram") is not None:
            merged["color_histogram"] = meta.get("color_histogram")
        if "rerank_vector_768" not in merged and meta.get("rerank_vector_768") is not None:
            merged["rerank_vector_768"] = meta.get("rerank_vector_768")

    merged["ocr_tokens"] = collect_search_tokens(ocr_tokens)
    merged["brand_tokens"] = extract_brand_tokens(brand_tokens)
    return merged


def rerank_score(
    *,
    query: SearchQueryContext,
    candidate_metadata: dict[str, Any],
    base_vector_score: float,
    strict_color: bool = False,
) -> tuple[bool, float, dict[str, Any]]:
    """Combine vector, color, histogram, OCR, and brand signals into a reranking score."""
    candidate_category = resolve_candidate_category(candidate_metadata)
    candidate_color = resolve_candidate_color(candidate_metadata)
    candidate_ocr_tokens = collect_search_tokens(candidate_metadata.get("ocr_tokens") or candidate_metadata.get("ocr_text"))
    candidate_brand_tokens = extract_brand_tokens(candidate_metadata.get("brand_tokens") or candidate_metadata.get("brand"))
    candidate_hist = parse_histogram(candidate_metadata.get("color_histogram"))

    debug = {
        "query_category": query.category,
        "candidate_category": candidate_category,
        "query_color": query.normalized_color,
        "candidate_color": candidate_color,
        "base_vector_score": round(float(base_vector_score), 4),
    }

    if query.category and candidate_category and str(query.category).lower() != str(candidate_category).lower():
        debug["rejected"] = "category_mismatch"
        return False, 0.0, debug

    conflicting_color = color_conflict(query.normalized_color, candidate_color)
    debug["color_conflict"] = conflicting_color
    if strict_color and conflicting_color:
        debug["rejected"] = "strict_color_conflict"
        return False, 0.0, debug

    brand_overlap = token_overlap_score(query.brand_tokens, candidate_brand_tokens)
    ocr_overlap = token_overlap_score(query.ocr_tokens, candidate_ocr_tokens)
    hist_score = histogram_similarity(query.color_histogram, candidate_hist)
    color_bonus = 0.05 if query.normalized_color and candidate_color and not conflicting_color else 0.0
    color_penalty = 0.18 if conflicting_color else 0.0

    score = (
        0.62 * float(base_vector_score)
        + 0.20 * hist_score
        + 0.10 * brand_overlap
        + 0.08 * ocr_overlap
        + color_bonus
        - color_penalty
    )
    score = max(0.0, min(1.0, score))

    debug["histogram_score"] = round(hist_score, 4)
    debug["brand_overlap"] = round(brand_overlap, 4)
    debug["ocr_overlap"] = round(ocr_overlap, 4)
    debug["color_bonus"] = round(color_bonus, 4)
    debug["color_penalty"] = round(color_penalty, 4)
    debug["rerank_score"] = round(score, 4)
    return True, score, debug
