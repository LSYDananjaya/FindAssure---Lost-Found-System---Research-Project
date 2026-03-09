from __future__ import annotations

import re
import time
from typing import Any, Dict, List, Optional, Set

from app.domain.category_specs import CATEGORY_SPECS, canonicalize_label
from app.domain.color_utils import extract_color_from_text, normalize_color


CANONICAL_DESCRIPTION_WORD_CAP = 50

PERSON_OR_BACKGROUND_TERMS = {
    "background",
    "desk",
    "table",
    "floor",
    "wall",
    "shelf",
    "person",
    "people",
    "hand",
    "hands",
    "finger",
    "fingers",
    "skin",
    "holding",
    "holder",
    "man",
    "woman",
    "boy",
    "girl",
    "human",
}
UNSUPPORTED_MATERIAL_GUESSES = {
    "leather",
    "plastic",
    "metal",
    "glass",
    "wood",
    "fabric",
    "rubber",
}
SENSITIVE_CARD_FEATURES = {
    "name",
    "id number",
    "student number",
    "institution name",
    "date of birth",
    "issuing authority",
    "signature",
    "place of birth",
    "national flag",
}
DESCRIPTION_BANNED_FEATURES = {
    "brand name",
    "logo",
    "text",
    "name",
    "id number",
    "student number",
    "institution name",
    "date of birth",
    "issuing authority",
    "signature",
    "place of birth",
    "national flag",
}
HUMANIZED_LABELS = {
    "Earbuds - Earbuds case": "earbuds case",
    "Smart Phone": "smart phone",
    "Student ID": "student ID card",
    "NIC / National ID Card": "national ID card",
    "Laptop/Mobile chargers & cables": "charger or cable",
}
CARD_LABELS = {"Student ID", "NIC / National ID Card"}
SMARTPHONE_LABEL = "Smart Phone"


def _safe_str(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    try:
        return str(value)
    except Exception:
        return ""


def _normalize_text(value: Any) -> str:
    return re.sub(r"\s+", " ", _safe_str(value)).strip()


def _normalize_phrase(value: Any) -> str:
    return _normalize_text(value).lower()


def _word_count(text: Any) -> int:
    return len(re.findall(r"\b\S+\b", _safe_str(text)))


def _trim_to_word_limit(text: str, limit: int) -> str:
    words = re.findall(r"\S+", _safe_str(text))
    if len(words) <= limit:
        return _normalize_text(text)
    return " ".join(words[:limit]).strip().rstrip(",;:-")


def _ensure_sentence(text: str) -> str:
    clean = _normalize_text(text).rstrip(",;:-")
    if clean and clean[-1] not in ".!?":
        clean = f"{clean}."
    return clean


def _dedupe_keep_order(values: List[str]) -> List[str]:
    seen: Set[str] = set()
    out: List[str] = []
    for raw in values or []:
        text = _normalize_text(raw)
        if not text:
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(text)
    return out


def _join_natural(values: List[str]) -> str:
    items = [str(v).strip() for v in values if str(v).strip()]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return f"{', '.join(items[:-1])}, and {items[-1]}"


def _allowed_phrase_set(label: Optional[str]) -> Set[str]:
    if not label:
        return set()
    spec = CATEGORY_SPECS.get(label, {})
    allowed = set()
    for key in ("features", "defects", "attachments"):
        for raw in spec.get(key, []) or []:
            norm = _normalize_phrase(raw)
            if norm:
                allowed.add(norm)
    return allowed


def _safe_label(label: Optional[str], key_count: Optional[int] = None) -> str:
    canonical = canonicalize_label(label or "") or _normalize_text(label)
    if canonical == "Key" and isinstance(key_count, int) and key_count > 1:
        return f"{key_count} keys"
    return HUMANIZED_LABELS.get(canonical, canonical.lower() if canonical else "item")


def _contains_person_or_background(text: str) -> bool:
    words = set(re.findall(r"\b[a-z]+\b", _normalize_phrase(text)))
    return bool(words & PERSON_OR_BACKGROUND_TERMS)


def _filter_supported_phrase(
    phrase: Any,
    *,
    label: Optional[str],
    allowed_phrases: Set[str],
    filters_applied: List[str],
    field_name: str,
) -> str:
    display = _normalize_text(phrase)
    norm = display.lower()
    if not display:
        return ""
    if _contains_person_or_background(norm):
        filters_applied.append(f"{field_name}_background_filter")
        return ""
    if label in CARD_LABELS and norm in SENSITIVE_CARD_FEATURES:
        filters_applied.append(f"{field_name}_card_sensitive_filter")
        return ""
    if norm in DESCRIPTION_BANNED_FEATURES and norm not in allowed_phrases:
        filters_applied.append(f"{field_name}_unsupported_filter")
        return ""
    if norm in UNSUPPORTED_MATERIAL_GUESSES and norm not in allowed_phrases:
        filters_applied.append(f"{field_name}_material_guess_filter")
        return ""
    if norm not in allowed_phrases:
        token_parts = re.findall(r"[a-z0-9]+", norm)
        if len(token_parts) == 1 and len(token_parts[0]) <= 3:
            filters_applied.append(f"{field_name}_fragment_filter")
            return ""
    return display


def _extract_short_ocr_snippet(ocr_text: str, *, label: Optional[str]) -> str:
    text = _normalize_text(ocr_text)
    if not text:
        return ""

    tokens = re.findall(r"[A-Za-z0-9][A-Za-z0-9+._/-]*", text)
    if not tokens:
        return ""

    disallowed = {
        "press",
        "home",
        "unlock",
        "camera",
        "sun",
        "mon",
        "tue",
        "wed",
        "thu",
        "fri",
        "sat",
        "am",
        "pm",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
    }

    snippet_tokens: List[str] = []
    for token in tokens:
        clean = token.strip()
        if not clean:
            continue
        if clean.lower() in disallowed:
            continue
        if label not in CARD_LABELS and clean.isdigit():
            continue
        snippet_tokens.append(clean)
        if len(snippet_tokens) >= (2 if label in CARD_LABELS else 3):
            break

    if not snippet_tokens:
        return ""

    snippet = " ".join(snippet_tokens).strip()
    if len(snippet) > 28:
        return ""
    if not re.search(r"[A-Za-z]", snippet):
        return ""
    return snippet


def _ocr_reference(ocr_text: str, *, label: Optional[str]) -> str:
    text = _normalize_text(ocr_text)
    if not text:
        return ""

    snippet = _extract_short_ocr_snippet(text, label=label)
    if label == SMARTPHONE_LABEL:
        if snippet:
            return f'visible screen text "{snippet}"'
        return "visible screen text"
    if label in CARD_LABELS:
        if snippet:
            return f'visible printed text "{snippet}"'
        return "visible printed text"
    if snippet:
        return f'text "{snippet}"'
    return ""


def _salvage_caption_phrases(caption: str, label: Optional[str]) -> List[str]:
    if not label or label not in CATEGORY_SPECS:
        return []
    caption_norm = _normalize_phrase(caption)
    if not caption_norm:
        return []

    allowed_candidates = (
        CATEGORY_SPECS[label].get("features", [])
        + CATEGORY_SPECS[label].get("attachments", [])
        + CATEGORY_SPECS[label].get("defects", [])
    )
    out: List[str] = []
    for candidate in allowed_candidates:
        candidate_norm = _normalize_phrase(candidate)
        if not candidate_norm or candidate_norm in DESCRIPTION_BANNED_FEATURES:
            continue
        if candidate_norm in caption_norm:
            out.append(_normalize_text(candidate))
    return _dedupe_keep_order(out)


def _coerce_str_list(value: Any) -> List[str]:
    if isinstance(value, str):
        text = _normalize_text(value)
        return [text] if text else []
    if isinstance(value, list):
        out: List[str] = []
        for item in value:
            text = _normalize_text(item)
            if text:
                out.append(text)
        return out
    return []


def _describe_visible_phrase(phrase: str, *, label: Optional[str]) -> str:
    norm = _normalize_phrase(phrase)
    if not norm:
        return ""

    replacements = {
        "logo": "visible logo",
        "photo": "photo panel",
        "zipper": "zipper closure",
        "zippers": "zipper closures",
        "strap attached": "attached strap",
        "chain attached": "attached chain",
        "keyring attached": "attached keyring",
        "charger attached": "attached charger",
        "charging cable attached": "attached charging cable",
        "phone case attached": "phone case",
        "screen protector attached": "screen protector",
        "button clasp": "button clasp",
        "card slots": "card slots",
        "coin pouch": "coin pouch",
        "camera module": "camera module",
        "home button": "home button",
        "trackpad": "trackpad",
        "keyboard": "keyboard",
        "lanyard": "lanyard",
        "card holder": "card holder",
        "clip": "clip",
    }
    if norm in replacements:
        return replacements[norm]

    if label in CARD_LABELS and norm == "barcode":
        return "barcode area"

    return _normalize_text(phrase)


def _describe_defect_phrase(phrase: str) -> str:
    norm = _normalize_phrase(phrase)
    if not norm:
        return ""
    if norm.startswith(("broken ", "missing ", "damaged ", "cracked ", "torn ", "faded ", "worn ", "bent ")):
        return _normalize_text(phrase)
    if norm == "scratch":
        return "visible scratch"
    if norm.endswith(("scratch", "scratches", "stain", "dent", "rust", "hole")):
        return _normalize_text(phrase)
    return f"visible { _normalize_text(phrase) }".replace("  ", " ")


def _build_item_intro(descriptor: str, detail_clauses: List[str]) -> str:
    clean_descriptor = _normalize_text(descriptor) or "item"
    if detail_clauses:
        return f"A {clean_descriptor} with {_join_natural(detail_clauses)}."
    return f"A {clean_descriptor}."


def _build_observation_sentence(observations: List[str]) -> str:
    if not observations:
        return ""
    return f"Visible details include {_join_natural(observations)}."


class DescriptionComposer:
    def compose(
        self,
        *,
        label: Optional[str],
        color: Optional[str] = None,
        brand: Optional[str] = None,
        ocr_text: str = "",
        features: Optional[List[str]] = None,
        defects: Optional[List[str]] = None,
        attachments: Optional[List[str]] = None,
        caption: str = "",
        key_count: Optional[int] = None,
        allow_caption_salvage: bool = True,
    ) -> Dict[str, Any]:
        started_at = time.perf_counter()
        canonical_label = canonicalize_label(label or "") or _normalize_text(label)
        allowed_phrases = _allowed_phrase_set(canonical_label)
        filters_applied: List[str] = []

        normalized_color = normalize_color(color) if color else None
        if not normalized_color:
            caption_color = extract_color_from_text(caption)
            if caption_color:
                normalized_color = caption_color
                filters_applied.append("caption_color_fallback")

        brand_text = _normalize_text(brand)
        if brand_text and _contains_person_or_background(brand_text):
            filters_applied.append("brand_background_filter")
            brand_text = ""

        feature_values = _dedupe_keep_order(
            [
                _filter_supported_phrase(
                    item,
                    label=canonical_label,
                    allowed_phrases=allowed_phrases,
                    filters_applied=filters_applied,
                    field_name="feature",
                )
                for item in _coerce_str_list(features)
            ]
        )
        attachment_values = _dedupe_keep_order(
            [
                _filter_supported_phrase(
                    item,
                    label=canonical_label,
                    allowed_phrases=allowed_phrases,
                    filters_applied=filters_applied,
                    field_name="attachment",
                )
                for item in _coerce_str_list(attachments)
            ]
        )
        defect_values = _dedupe_keep_order(
            [
                _filter_supported_phrase(
                    item,
                    label=canonical_label,
                    allowed_phrases=allowed_phrases,
                    filters_applied=filters_applied,
                    field_name="defect",
                )
                for item in _coerce_str_list(defects)
            ]
        )

        evidence_used: List[str] = []

        if normalized_color:
            evidence_used.append("color")
        if brand_text:
            evidence_used.append("brand")
        if feature_values:
            evidence_used.append("features")
        if attachment_values:
            evidence_used.append("attachments")
        if defect_values:
            evidence_used.append("defects")

        if allow_caption_salvage and not feature_values and not attachment_values and canonical_label:
            caption_salvage = _salvage_caption_phrases(caption, canonical_label)
            if caption_salvage:
                feature_values = _dedupe_keep_order(feature_values + caption_salvage[:1])
                evidence_used.append("caption_salvage")
                filters_applied.append("caption_safe_vocab_only")

        ocr_reference = _ocr_reference(ocr_text, label=canonical_label)
        if ocr_reference:
            evidence_used.append("ocr")

        descriptor_parts: List[str] = []
        if normalized_color:
            descriptor_parts.append(str(normalized_color).lower())
        if brand_text:
            descriptor_parts.append(brand_text)
        descriptor_parts.append(_safe_label(canonical_label, key_count=key_count))
        descriptor = " ".join(part for part in descriptor_parts if part).strip() or "item"

        primary_clauses: List[str] = []
        primary_clauses.extend(
            _describe_visible_phrase(item, label=canonical_label)
            for item in feature_values[:2]
        )
        if len(primary_clauses) < 2:
            primary_clauses.extend(
                _describe_visible_phrase(item, label=canonical_label)
                for item in attachment_values[: 2 - len(primary_clauses)]
            )
        primary_clauses = _dedupe_keep_order([item for item in primary_clauses if item])

        observation_clauses: List[str] = []
        if defect_values:
            observation_clauses.append(_describe_defect_phrase(defect_values[0]))
        if ocr_reference:
            observation_clauses.append(ocr_reference)
        if canonical_label == "Key" and isinstance(key_count, int) and key_count > 1:
            observation_clauses.append(f"{key_count} keys")
        observation_clauses = _dedupe_keep_order([item for item in observation_clauses if item])

        sentences = [
            _build_item_intro(descriptor, primary_clauses),
            _build_observation_sentence(observation_clauses),
        ]
        canonical_description = " ".join(sentence.strip() for sentence in sentences if sentence).strip()
        canonical_description = _ensure_sentence(
            _trim_to_word_limit(canonical_description, CANONICAL_DESCRIPTION_WORD_CAP)
        )
        if _word_count(canonical_description) > CANONICAL_DESCRIPTION_WORD_CAP:
            canonical_description = _ensure_sentence(
                _trim_to_word_limit(canonical_description, CANONICAL_DESCRIPTION_WORD_CAP)
            )
            filters_applied.append("description_word_cap")

        finished_at = time.perf_counter()
        return {
            "final_description": canonical_description,
            "detailed_description": canonical_description,
            "description_source": "evidence_composer",
            "detailed_description_source": "evidence_composer",
            "description_evidence_used": {
                "summary": _dedupe_keep_order(evidence_used),
                "detailed": _dedupe_keep_order(evidence_used),
            },
            "description_filters_applied": _dedupe_keep_order(filters_applied),
            "description_word_count": {
                "final_description": _word_count(canonical_description),
                "detailed_description": _word_count(canonical_description),
            },
            "description_timings_ms": {
                "assembly_ms": round((finished_at - started_at) * 1000.0, 2),
                "fallback_ms": 0.0,
            },
        }
