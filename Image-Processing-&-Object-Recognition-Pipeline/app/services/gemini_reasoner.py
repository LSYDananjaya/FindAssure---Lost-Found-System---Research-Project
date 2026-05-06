"""
Gemini reasoner

- Phase 1 (PP1): single-image evidence-locked extraction:
    * label selection (must be one of ALLOWED_LABELS)
    * precise color (prefer Florence VQA)
    * category-specific features / defects / attachments (evidence-backed only)
    * key_count only if evidence provides it

- Phase 2 (PP2): multi-image validation + fusion:
    * validate all images are the same category AND same physical object (best-effort)
    * merge descriptions + details into one final JSON

This module stores the "ready-to-paste" prompt templates requested.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
import json
import logging
import re
import time

from app.config.settings import settings
from app.domain.category_specs import ALLOWED_LABELS, CATEGORY_SPECS, canonicalize_label
from app.services.reasoner_types import (
    REASONING_FAILED_MESSAGE,
    RETRYABLE_UNAVAILABLE_MESSAGE,
    ReasonerFatalError,
    ReasonerProtocol,
    ReasonerQuotaError,
    ReasonerServiceError,
    ReasonerTransientError,
)

logger = logging.getLogger(__name__)

# Gemini output is treated as advisory evidence, not a source of unrestricted
# truth. Normalizers below clamp responses back into the schema and evidence
# contract expected by PP1/PP2.

TRANSIENT_STATUS_CODES = {429, 500, 502, 503, 504}
TRANSIENT_PROVIDER_STATUSES = {
    "UNAVAILABLE",
    "RESOURCE_EXHAUSTED",
    "DEADLINE_EXCEEDED",
    "INTERNAL",
    "ABORTED",
    "UNKNOWN",
}
FATAL_PROVIDER_STATUSES = {"UNAUTHENTICATED", "PERMISSION_DENIED", "INVALID_ARGUMENT"}

GeminiServiceError = ReasonerServiceError
GeminiTransientError = ReasonerTransientError
GeminiQuotaError = ReasonerQuotaError
GeminiFatalError = ReasonerFatalError


# ----------------------------
# PROMPTS
# ----------------------------

STRICT_EXTRACTOR_PROMPT = r"""
You are an evidence-locked inspection assistant for a lost-and-found system.
IMPORTANT: You have access to the crop image. Use it to VERIFY the evidence fields provided below.
Do NOT guess. Do NOT invent. If evidence is missing or contradicted by the image, output empty arrays.

TASK
1) From the candidate lists, select ONLY items that are clearly supported by the EVIDENCE and VISIBLE in the image.
2) Produce a natural, fluent public-listing description (2–4 sentences) using ONLY confirmed details.
3) Use ONLY the exact phrases from the candidate lists when listing features/defects/attachments.

DESCRIPTION WRITING RULES (CRITICAL):
- Write in natural, flowing English prose that reads like a professional product listing.
- Open sentence 1 with the item color and label (e.g. "A black helmet with a red and white CS logo on the back.").
- Weave features, defects, and attachments naturally into sentences — do NOT use robotic patterns.
- BANNED patterns (never use these): "It has X.", "It shows X.", "It includes X.", "It features X."
  Instead, combine details: "The helmet features a tinted visor and adjustable chin strap, with minor scratches on the left side."
- NEVER mention the person, hands, arms, legs, skin tone, body parts, poses, or background.
- NEVER reference how the item is held, placed, or positioned (e.g. "on their leg", "held in hand", "on a table").
- Focus exclusively on the physical item — its color, brand, material, condition, and distinguishing marks.

HOW TO DECIDE (STRICT)
- Start with GROUNDED_FEATURES / GROUNDED_DEFECTS / GROUNDED_ATTACHMENTS:
  If an item appears there and also exists in the corresponding candidate list, include it.
- Then check CAPTION and DEFECTS_VQA_TEXT:
  If a candidate phrase appears verbatim (case-insensitive) in CAPTION or DEFECTS_VQA_TEXT, include it.
- VISUAL VERIFICATION:
  If the image clearly contradicts any evidence (e.g., evidence says "red" but image is "blue"), REJECT that piece of evidence.
- COLOR ACCURACY:
  PRIMARY_COLOR is the authoritative color — it comes from a direct visual question asked about the object.
  Trust PRIMARY_COLOR. Do NOT override it based on caption text; captions often describe the background,
  surface, or secondary objects, not the main item.
  Only output a different color if PRIMARY_COLOR is "Unknown" AND you can clearly and unambiguously
  see the object's color in the image. If uncertain, use PRIMARY_COLOR exactly as provided.
- OCR RULE:
  If OCR_TEXT is not "None" and FEATURE_LIST contains "text", include "text".
  Only include "brand name" if OCR_TEXT looks like a brand AND FEATURE_LIST contains "brand name"
  AND at least one of CAPTION or grounding indicates branding/text presence (do not assume).

STRICT OUTPUT FORMAT (JSON ONLY)
Return exactly one JSON object with these keys:
{{
  "status": string,
  "final_description": string,
  "detailed_description": string,
  "color": string | null,
  "features": [string],
  "defects": [string],
  "attachments": [string],
  "key_count": integer | null,
  "label_change_reason": string | null,
  "evidence_used": {{
    "caption": [string],
    "ocr": [string],
    "grounding": [string],
    "color": [string],
    "key_count": [string]
  }},
  "unsupported_claims": [string]
}}

RULES
- Do NOT mention the person, hands, skin tone, background, body parts, poses, or surroundings.
- If none found in a list, return an empty array for that list.
- Keep description object-only and specific to the item itself.
- Prefer distinctive visible details over generic wording like "an object" or "an item".
- If OCR_TEXT is provided and the text is visibly present on the object, include the most relevant exact text verbatim in the description.
- Mention clearly visible features, wear, attachments, and surface markings when supported by evidence.
- If you believe the provided LABEL is INCORRECT based on the image and evidence, you may change it.
  In that case, set label_change_reason to a short explanation (e.g. "Image shows earbuds not a wallet").
  If the label is correct, set label_change_reason to null.
- status must be "accepted" when the output stays evidence-locked, otherwise "rejected".
- final_description and detailed_description must be object-only. Do not mention background, hands, people, desks, tables, floors, body parts, or ownership/use assumptions.
- unsupported_claims must list any tempting but unsupported facts you intentionally left out. Use [] when none.

CATEGORY-SPECIFIC RULES:
- SMART PHONE: Identify the BACK COVER color ONLY. The screen/display shows wallpaper/content — do NOT use screen color. Look at the physical back panel, glass, or casing.
- NIC / NATIONAL ID CARD: Government-issued national identity document. Extract NIC number (9 digits + V or X, e.g. 123456789V), full name, date of birth, issuing authority from OCR.
- STUDENT ID: Institution-issued student card. Extract institution name, student name, student ID number from OCR.
- ALL ITEMS — COLOR ACCURACY: Report the dominant PHYSICAL surface color. Do NOT report screen backlight glow, flash hotspots, reflected glare, or background colors.

EVIDENCE (authoritative)
LABEL: {LABEL}
PRIMARY_COLOR: {COLOR_OR_UNKNOWN}
OCR_TEXT: {OCR_TEXT_OR_NONE}
CAPTION: {CAPTION_OR_NONE}
DEFECTS_VQA_TEXT: {DEFECTS_VQA_TEXT_OR_NONE}

GROUNDED_FEATURES: {GROUNDED_FEATURES_JSON}
GROUNDED_DEFECTS: {GROUNDED_DEFECTS_JSON}
GROUNDED_ATTACHMENTS: {GROUNDED_ATTACHMENTS_JSON}
GROUNDING_LABELS_RAW: {GROUNDING_LABELS_RAW_JSON}

CANDIDATES
FEATURE_LIST:
{FEATURE_LIST}

DEFECT_LIST:
{DEFECT_LIST}

ATTACHMENT_LIST:
{ATTACHMENT_LIST}

(If LABEL == "Key")
KEY COUNT INSTRUCTION:
If key_count is provided in evidence, use it. Otherwise:
Count how many separate keys are visible. Return a single integer. If only one key is visible, return 1.
Else set key_count to null.
"""

PHASE2_PP2_SYSTEM_INSTRUCTION = r"""
You are an evidence-locked information extractor for a lost-and-found system.

STRICT RULES:
1) Use ONLY the provided selected-view images and EVIDENCE_BUNDLE JSON. Do NOT invent, assume, or hallucinate.
2) Every feature, defect, and attachment must be explicitly supported by the evidence bundle or be clearly visible in the supplied images.
3) Reject the item if the selected views do not show the same category or strongly suggest different physical objects.
4) Color must be precise and refer to the physical item only. Reject screen glow, reflections, glare, and background colors.
5) If status is accepted, final_description must be 4 to 6 sentences of natural, flowing English prose — like a professional item listing.
6) Sentence 1 must open with the item color and label when known.
7) If status is accepted, weave all confirmed features, attachments, and defects naturally into the description. Include the most relevant exact OCR text only when supported.
8) If key_count is not supported by evidence, return null.
9) Synthesize a single unified item description across all selected views; do not write one repeated description per image.
10) Do not repeat the same color, category, or identity sentence for each view. Mention the item identity once, then merge distinct supported details from all views.
11) Output JSON only and follow the response schema exactly.

DESCRIPTION QUALITY RULES:
- Write natural, fluent prose. Do NOT use robotic patterns like "It has X.", "It shows X.", "It includes X."
- Instead, combine details gracefully: "The helmet features a tinted visor and adjustable strap, with minor scratches along the left side."
- NEVER mention people, hands, arms, legs, body parts, poses, backgrounds, tables, desks, floors, or how the item is held/placed.
- Focus exclusively on the physical item itself.

CATEGORY-SPECIFIC RULES:
- SMART PHONE: Use the BACK COVER color only. Never use wallpaper or screen color.
- NIC / NATIONAL ID CARD: Extract NIC number, full name, and date of birth only from OCR-backed evidence.
- STUDENT ID: Extract institution name, student name, and student number only from OCR-backed evidence.
"""

PHASE2_PP2_PROMPT = r"""
Analyze the selected views for one lost-and-found item.

Preferred labels:
{{ALLOWED_LABELS_LIST}}

Return:
- status="accepted" when the selected views support one coherent item.
- status="rejected" with a short message when the evidence conflicts.

EVIDENCE_BUNDLE_JSON:
{{EVIDENCE_BUNDLE_JSON}}
"""

PHASE2_PP2_RESPONSE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "status",
        "message",
        "label",
        "color",
        "final_description",
        "category_details",
        "key_count",
        "tags",
        "evidence_used",
    ],
    "properties": {
        "status": {"type": "string", "enum": ["accepted", "rejected"]},
        "message": {"type": "string"},
        "label": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "color": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "final_description": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "category_details": {
            "type": "object",
            "additionalProperties": False,
            "required": ["features", "defects", "attachments"],
            "properties": {
                "features": {"type": "array", "items": {"type": "string"}},
                "defects": {"type": "array", "items": {"type": "string"}},
                "attachments": {"type": "array", "items": {"type": "string"}},
            },
        },
        "key_count": {"anyOf": [{"type": "integer"}, {"type": "null"}]},
        "tags": {"type": "array", "items": {"type": "string"}},
        "evidence_used": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "color_source",
                "feature_sources",
                "defect_sources",
                "attachment_sources",
                "ocr_source",
            ],
            "properties": {
                "color_source": {
                    "type": "string",
                    "enum": ["florence_vqa_color", "caption", "unknown"],
                },
                "feature_sources": {"type": "array", "items": {"type": "string"}},
                "defect_sources": {"type": "array", "items": {"type": "string"}},
                "attachment_sources": {"type": "array", "items": {"type": "string"}},
                "ocr_source": {"type": "string", "enum": ["ocr_text", "none"]},
            },
        },
    },
}

PHASE1_PP1_RESPONSE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "status",
        "label",
        "color",
        "final_description",
        "detailed_description",
        "category_details",
        "key_count",
        "evidence_used",
        "unsupported_claims",
        "label_change_reason",
    ],
    "properties": {
        "status": {"type": "string", "enum": ["accepted", "rejected"]},
        "label": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "color": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "final_description": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "detailed_description": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "category_details": {
            "type": "object",
            "additionalProperties": False,
            "required": ["features", "defects", "attachments"],
            "properties": {
                "features": {"type": "array", "items": {"type": "string"}},
                "defects": {"type": "array", "items": {"type": "string"}},
                "attachments": {"type": "array", "items": {"type": "string"}},
            },
        },
        "key_count": {"anyOf": [{"type": "integer"}, {"type": "null"}]},
        "evidence_used": {
            "type": "object",
            "additionalProperties": False,
            "required": ["caption", "ocr", "grounding", "color", "key_count"],
            "properties": {
                "caption": {"type": "array", "items": {"type": "string"}},
                "ocr": {"type": "array", "items": {"type": "string"}},
                "grounding": {"type": "array", "items": {"type": "string"}},
                "color": {"type": "array", "items": {"type": "string"}},
                "key_count": {"type": "array", "items": {"type": "string"}},
            },
        },
        "unsupported_claims": {"type": "array", "items": {"type": "string"}},
        "label_change_reason": {"anyOf": [{"type": "string"}, {"type": "null"}]},
    },
}


# ----------------------------
# Client wrapper
# ----------------------------

def _extract_json_content(text: str) -> str:
    """
    Robustly extract JSON content from a string.
    1. Strips code fences.
    2. Finds the first '{' and the last '}'.
    """
    # Strip markdown code fences
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.I)
    text = re.sub(r"\s*```$", "", text)
    
    # Find first '{' and last '}'
    start = text.find('{')
    end = text.rfind('}')
    
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    
    return text.strip()


class GeminiReasoner(ReasonerProtocol):
    """
    Thin wrapper around Gemini.

    Expected dependencies (install in your env):
      pip install google-genai

    And set an API key in env:
      export GEMINI_API_KEY=...
    """

    def __init__(
        self,
        model_name: Optional[str] = None,
        *,
        pp2_model_name: Optional[str] = None,
    ) -> None:
        """Initialize Gemini reasoner settings, model names, and request metadata state."""
        configured_pp1_model = str(
            model_name or getattr(settings, "PP1_GEMINI_MODEL", "models/gemini-2.5-flash")
        ).strip()
        self.model_name = configured_pp1_model or "models/gemini-2.5-flash"
        self.pp1_fallback_model = str(
            getattr(settings, "PP1_GEMINI_FALLBACK_MODEL", "gemini-2.5-flash")
        ).strip() or "gemini-2.5-flash"
        self.pp2_model_name = str(
            pp2_model_name or getattr(settings, "PP2_REASONER_MODEL", "models/gemini-2.5-flash")
        ).strip() or "models/gemini-3.1-pro-preview"
        self.pp2_fallback_model = str(
            getattr(settings, "PP2_REASONER_FALLBACK_MODEL", "gemini-2.5-flash")
        ).strip() or "gemini-2.5-flash"
        self._client = None
        self._retry_delay_seconds = 0.5
        self._validated_models: Dict[str, bool] = {}
        self._last_request_meta: Dict[str, Any] = {}

    def _load_client(self) -> None:
        """Initialize the Gemini client from configured API settings."""
        if self._client is not None:
            return
        try:
            from google import genai  # type: ignore
            from dotenv import load_dotenv
            import os
            
            load_dotenv()
            gemini_api_key = str(
                getattr(settings, "GEMINI_API_KEY", None) or os.getenv("GEMINI_API_KEY") or ""
            ).strip()
            google_api_key = str(
                getattr(settings, "GOOGLE_API_KEY", None) or os.getenv("GOOGLE_API_KEY") or ""
            ).strip()
            api_key = gemini_api_key or google_api_key
            if not api_key:
                raise ValueError("GOOGLE_API_KEY or GEMINI_API_KEY not found in environment variables")
                
        except ImportError as e:
            raise RuntimeError(
                "Required packages not installed. Install with: pip install google-genai python-dotenv"
            ) from e

        previous_google_key = os.environ.get("GOOGLE_API_KEY")
        previous_gemini_key = os.environ.get("GEMINI_API_KEY")
        try:
            if gemini_api_key:
                os.environ["GEMINI_API_KEY"] = gemini_api_key
                os.environ.pop("GOOGLE_API_KEY", None)
            elif google_api_key:
                os.environ["GOOGLE_API_KEY"] = google_api_key
                os.environ.pop("GEMINI_API_KEY", None)
            self._client = genai.Client(api_key=api_key)
        finally:
            if previous_google_key is None:
                os.environ.pop("GOOGLE_API_KEY", None)
            else:
                os.environ["GOOGLE_API_KEY"] = previous_google_key
            if previous_gemini_key is None:
                os.environ.pop("GEMINI_API_KEY", None)
            else:
                os.environ["GEMINI_API_KEY"] = previous_gemini_key

    @staticmethod
    def _extract_provider_status(exc: Exception) -> Optional[str]:
        """Extract a provider status string from a Gemini exception when available."""
        response_json = getattr(exc, "response_json", None)
        if isinstance(response_json, dict):
            error = response_json.get("error")
            if isinstance(error, dict):
                status = error.get("status")
                if isinstance(status, str):
                    return status
        return None

    @staticmethod
    def _parse_status_from_message(message: str) -> tuple:
        """Fallback: extract status code and provider status from exception message text."""
        status_code = None
        provider_status = None
        # Match patterns like "503 UNAVAILABLE" or "'code': 503"
        code_match = re.search(r"\b(4[0-9]{2}|5[0-9]{2})\b", message)
        if code_match:
            status_code = int(code_match.group(1))
        for ps in TRANSIENT_PROVIDER_STATUSES | FATAL_PROVIDER_STATUSES:
            if ps in message.upper():
                provider_status = ps
                break
        return status_code, provider_status

    def _classify_gemini_exception(self, exc: Exception) -> GeminiServiceError:
        """Convert a provider exception into the service error shape used by the reasoner."""
        status_code_raw = getattr(exc, "status_code", None)
        status_code = int(status_code_raw) if isinstance(status_code_raw, int) else None
        provider_status = self._extract_provider_status(exc)
        message = str(exc)

        # Fallback: parse the message string when structured attrs are missing
        if status_code is None or provider_status is None:
            parsed_code, parsed_status = self._parse_status_from_message(message)
            if status_code is None:
                status_code = parsed_code
            if provider_status is None:
                provider_status = parsed_status

        if status_code == 429 or provider_status == "RESOURCE_EXHAUSTED":
            return GeminiQuotaError(message, status_code=status_code, provider_status=provider_status)

        if status_code in TRANSIENT_STATUS_CODES:
            return GeminiTransientError(message, status_code=status_code, provider_status=provider_status)

        if provider_status in TRANSIENT_PROVIDER_STATUSES:
            return GeminiTransientError(message, status_code=status_code, provider_status=provider_status)

        if provider_status in FATAL_PROVIDER_STATUSES or status_code in {400, 401, 403}:
            return GeminiFatalError(message, status_code=status_code, provider_status=provider_status)

        return GeminiFatalError(message, status_code=status_code, provider_status=provider_status)

    @staticmethod
    def _indefinite_article(label: str) -> str:
        """Choose an English indefinite article for a phrase."""
        cleaned = re.sub(r"^[^A-Za-z0-9]+", "", str(label or "").strip())
        if not cleaned:
            return "a"
        return "an" if cleaned[0].lower() in {"a", "e", "i", "o", "u"} else "a"

    @classmethod
    def _build_pp1_visual_context(cls, label: Optional[str], image_count: int) -> str:
        """Build text context that describes PP1 visual evidence for prompting."""
        resolved_label = str(label or "").strip()
        if not resolved_label:
            return "This image includes one detected item. Describe only this item using the visible evidence."
        article = cls._indefinite_article(resolved_label)
        return (
            f"This image includes {article} {resolved_label}. "
            f"Describe only this {resolved_label} using the visible evidence."
        )

    @staticmethod
    def _extract_phase2_prompt_label(evidence_bundle_json: Dict[str, Any]) -> Optional[str]:
        """Resolve the object label used in PP2 phase-2 prompts."""
        per_image = evidence_bundle_json.get("per_image", [])
        if not isinstance(per_image, list):
            return None

        labels_by_canonical: Dict[str, Dict[str, Any]] = {}
        for entry in per_image:
            if not isinstance(entry, dict) or not entry.get("selected_for_verification"):
                continue
            phase1_output = entry.get("phase1_output", {})
            if not isinstance(phase1_output, dict):
                continue
            raw_label = str(phase1_output.get("label") or "").strip()
            if not raw_label:
                continue
            canonical_label = canonicalize_label(raw_label) or raw_label
            bucket = labels_by_canonical.setdefault(
                canonical_label,
                {"count": 0, "label": raw_label},
            )
            bucket["count"] += 1

        if not labels_by_canonical:
            return None

        ranked = sorted(
            labels_by_canonical.values(),
            key=lambda item: int(item["count"]),
            reverse=True,
        )
        if len(ranked) > 1 and int(ranked[0]["count"]) == int(ranked[1]["count"]):
            return None
        return str(ranked[0]["label"]).strip() or None

    @classmethod
    def _build_pp2_visual_context(cls, evidence_bundle_json: Dict[str, Any], image_count: int) -> str:
        """Build text context that describes PP2 multi-view evidence for prompting."""
        label = cls._extract_phase2_prompt_label(evidence_bundle_json)
        if image_count <= 1:
            if label:
                article = cls._indefinite_article(label)
                return (
                    f"This image includes {article} {label}. "
                    f"Describe the same {label} using only supported evidence."
                )
            return "This image includes one item. Describe the item using only supported evidence."

        if label:
            return (
                f"These images include different angles of {label}. "
                f"Describe the same {label} consistently across the selected views using only supported evidence."
            )
        return (
            "These images include different angles of the same item. "
            "Describe the item consistently across the selected views using only supported evidence."
        )

    def _generate_text_once(
        self,
        prompt: str,
        images: Optional[List[Any]] = None,
        *,
        config: Any = None,
        model_name: Optional[str] = None,
        image_first: bool = False,
    ) -> str:
        """Send one text-generation request to Gemini and return the response text."""
        self._load_client()
        assert self._client is not None
        self._ensure_model_available(model_name or self.model_name)

        contents: List[Any] = []
        if image_first and images:
            contents.extend(images)
        contents.append(prompt)
        if (not image_first) and images:
            contents.extend(images)

        try:
            resp = self._client.models.generate_content(
                model=model_name or self.model_name,
                contents=contents,
                config=config,
            )
        except GeminiServiceError:
            raise
        except Exception as exc:
            raise self._classify_gemini_exception(exc) from exc

        # resp.text is common; otherwise try candidates.
        text = getattr(resp, "text", None)
        if text:
            return str(text)
        # fallback
        try:
            return str(resp.candidates[0].content.parts[0].text)
        except Exception:
            return str(resp)

    def _generate_text(
        self,
        prompt: str,
        images: Optional[List[Any]] = None,
        *,
        config: Any = None,
        model_name: Optional[str] = None,
        fallback_model_name: Optional[str] = None,
        fallback_config: Any = None,
        image_first: bool = False,
    ) -> str:
        """Generate text with retry and fallback handling around Gemini calls."""
        attempts = 2
        primary_model = str(model_name or self.model_name).strip()
        fallback_model = str(fallback_model_name or "").strip()
        primary_config = config
        secondary_config = fallback_config if fallback_config is not None else config
        model_attempts: List[Dict[str, Any]] = []
        failover_reason: Optional[str] = None
        model_sequence: List[tuple[str, Any]] = [(primary_model, primary_config)]
        if fallback_model and fallback_model != primary_model:
            model_sequence.append((fallback_model, secondary_config))

        def _fallback_reason(exc: GeminiServiceError) -> Optional[str]:
            """Create fallback metadata when Gemini generation cannot complete."""
            if attempted_fallback or not fallback_model or fallback_model == current_model:
                return None
            provider_status = str(getattr(exc, "provider_status", "") or "").upper()
            status_code = getattr(exc, "status_code", None)
            message = str(exc).upper()
            if isinstance(exc, GeminiQuotaError) or status_code == 429 or provider_status == "RESOURCE_EXHAUSTED":
                return "quota_limit"
            if isinstance(exc, GeminiTransientError):
                if status_code in TRANSIENT_STATUS_CODES or provider_status in TRANSIENT_PROVIDER_STATUSES:
                    return "transient_unavailable"
            if isinstance(exc, GeminiFatalError):
                model_unavailable_statuses = {
                    "MODEL_UNAVAILABLE",
                    "MODEL_NOT_FOUND",
                    "NOT_FOUND",
                    "INSUFFICIENT_SYSTEM_MEMORY",
                }
                if status_code == 404 or provider_status in model_unavailable_statuses:
                    return "model_unavailable"
                if "NOT_FOUND" in message or "MODEL_UNAVAILABLE" in message:
                    return "model_unavailable"
                if "INSUFFICIENT_SYSTEM_MEMORY" in message:
                    return "model_capacity"
            return None

        last_exc: Optional[Exception] = None
        for model_index, (current_model, current_config) in enumerate(model_sequence):
            attempted_fallback = model_index > 0
            for attempt in range(1, attempts + 1):
                attempt_meta: Dict[str, Any] = {
                    "model": current_model,
                    "attempt": attempt,
                    "fallback": attempted_fallback,
                }
                model_attempts.append(attempt_meta)
                try:
                    output = self._generate_text_once(
                        prompt,
                        images=images,
                        config=current_config,
                        model_name=current_model,
                        image_first=image_first,
                    )
                    attempt_meta["status"] = "success"
                    self._last_request_meta = {
                        "model_attempts": model_attempts,
                        "selected_model": current_model,
                        "failover_reason": failover_reason,
                    }
                    if attempt > 1:
                        logger.info("Gemini request succeeded after retry.")
                    return output
                except GeminiQuotaError as exc:
                    last_exc = exc
                    attempt_meta["status"] = "quota_error"
                    attempt_meta["status_code"] = exc.status_code
                    attempt_meta["provider_status"] = exc.provider_status
                    reason = _fallback_reason(exc)
                    if reason:
                        failover_reason = reason
                        logger.warning(
                            "Gemini quota/capacity failure on %s; failing over to %s",
                            current_model,
                            fallback_model,
                        )
                        break
                    if attempt < attempts:
                        time.sleep(self._retry_delay_seconds)
                        continue
                    self._last_request_meta = {
                        "model_attempts": model_attempts,
                        "selected_model": None,
                        "failover_reason": failover_reason or "quota_limit",
                    }
                    raise
                except GeminiTransientError as exc:
                    last_exc = exc
                    attempt_meta["status"] = "transient_error"
                    attempt_meta["status_code"] = exc.status_code
                    attempt_meta["provider_status"] = exc.provider_status
                    reason = _fallback_reason(exc)
                    if reason:
                        failover_reason = reason
                        logger.warning(
                            "Gemini transient failure on %s; failing over to %s",
                            current_model,
                            fallback_model,
                        )
                        break
                    if attempt < attempts:
                        logger.warning(
                            "Gemini transient failure (attempt %s/%s): status_code=%s provider_status=%s",
                            attempt,
                            attempts,
                            exc.status_code,
                            exc.provider_status,
                        )
                        time.sleep(self._retry_delay_seconds)
                        continue
                    self._last_request_meta = {
                        "model_attempts": model_attempts,
                        "selected_model": None,
                        "failover_reason": failover_reason,
                    }
                    raise
                except GeminiFatalError as exc:
                    last_exc = exc
                    attempt_meta["status"] = "fatal_error"
                    attempt_meta["status_code"] = exc.status_code
                    attempt_meta["provider_status"] = exc.provider_status
                    reason = _fallback_reason(exc)
                    if reason:
                        failover_reason = reason
                        logger.warning(
                            "Gemini model failure on %s; failing over to %s",
                            current_model,
                            fallback_model,
                        )
                        break
                    self._last_request_meta = {
                        "model_attempts": model_attempts,
                        "selected_model": None,
                        "failover_reason": failover_reason,
                    }
                    raise

        self._last_request_meta = {
            "model_attempts": model_attempts,
            "selected_model": None,
            "failover_reason": failover_reason,
        }
        if isinstance(last_exc, GeminiServiceError):
            raise last_exc
        raise GeminiFatalError("Gemini generation failed unexpectedly.")

    def consume_last_request_meta(self) -> Dict[str, Any]:
        """Return and clear metadata for the most recent Gemini request."""
        meta = dict(self._last_request_meta)
        self._last_request_meta = {}
        return meta

    @staticmethod
    def _normalize_string_list(value: Any) -> List[str]:
        """Normalize a value into a list of non-empty strings."""
        if not isinstance(value, list):
            return []
        out: List[str] = []
        for item in value:
            text = str(item or "").strip()
            if text:
                out.append(text)
        return out

    @staticmethod
    def _is_gemini3_model(model_name: str) -> bool:
        """Return whether a model name refers to a Gemini 3 generation model."""
        normalized = str(model_name or "").strip().lower()
        return "gemini-3" in normalized or "gemini 3" in normalized

    def _ensure_model_available(self, model_name: str) -> None:
        """Validate that the configured model can be used before sending requests."""
        normalized = str(model_name or "").strip()
        if not normalized:
            raise GeminiFatalError("Gemini model name is empty.", provider_status="MODEL_NOT_CONFIGURED")
        if self._validated_models.get(normalized):
            return

        assert self._client is not None
        models_api = getattr(self._client, "models", None)
        if models_api is None:
            self._validated_models[normalized] = True
            return

        getter = getattr(models_api, "get", None)
        if callable(getter):
            try:
                try:
                    getter(model=normalized)
                except TypeError:
                    getter(normalized)
                self._validated_models[normalized] = True
                return
            except Exception as exc:
                classified = self._classify_gemini_exception(exc)
                raise GeminiFatalError(
                    f"Configured Gemini model unavailable: {normalized}",
                    status_code=classified.status_code,
                    provider_status=classified.provider_status or "MODEL_UNAVAILABLE",
                ) from exc

        self._validated_models[normalized] = True

    @classmethod
    def normalize_phase1_response(cls, payload: Any, *, fallback_label: Optional[str], fallback_color: Optional[str]) -> Dict[str, Any]:
        """Normalize Gemini PP1 output into the expected phase-1 response contract."""
        if not isinstance(payload, dict):
            return {
                "status": "rejected",
                "message": "Gemini returned a non-object Phase 1 payload",
                "label": fallback_label,
                "color": fallback_color,
                "category_details": {"features": [], "defects": [], "attachments": []},
                "key_count": None,
                "final_description": None,
                "detailed_description": None,
                "label_change_reason": None,
                "evidence_used": {"caption": [], "ocr": [], "grounding": [], "color": [], "key_count": []},
                "unsupported_claims": [],
            }

        category_details = payload.get("category_details")
        category_details = category_details if isinstance(category_details, dict) else {}
        evidence_used = payload.get("evidence_used")
        evidence_used = evidence_used if isinstance(evidence_used, dict) else {}
        key_count = payload.get("key_count")
        if not isinstance(key_count, int) or isinstance(key_count, bool):
            key_count = None

        status = str(payload.get("status", "rejected") or "rejected").strip().lower()
        if status not in {"accepted", "rejected"}:
            status = "rejected"

        return {
            "status": status,
            "message": str(payload.get("message", "") or "").strip(),
            "label": str(payload.get("label", "") or "").strip() or fallback_label,
            "color": str(payload.get("color", "") or "").strip() or fallback_color,
            "category_details": {
                "features": cls._normalize_string_list(category_details.get("features")),
                "defects": cls._normalize_string_list(category_details.get("defects")),
                "attachments": cls._normalize_string_list(category_details.get("attachments")),
            },
            "key_count": key_count,
            "final_description": str(payload.get("final_description", "") or "").strip() or None,
            "detailed_description": str(payload.get("detailed_description", "") or "").strip() or None,
            "label_change_reason": str(payload.get("label_change_reason", "") or "").strip() or None,
            "evidence_used": {
                "caption": cls._normalize_string_list(evidence_used.get("caption")),
                "ocr": cls._normalize_string_list(evidence_used.get("ocr")),
                "grounding": cls._normalize_string_list(evidence_used.get("grounding")),
                "color": cls._normalize_string_list(evidence_used.get("color")),
                "key_count": cls._normalize_string_list(evidence_used.get("key_count")),
            },
            "unsupported_claims": cls._normalize_string_list(payload.get("unsupported_claims")),
        }

    @classmethod
    def normalize_phase2_response(cls, payload: Any) -> Dict[str, Any]:
        """Normalize Gemini PP2 output into the expected phase-2 response contract."""
        if not isinstance(payload, dict):
            return {
                "status": "rejected",
                "message": "Gemini returned a non-object Phase 2 payload",
                "label": None,
                "color": None,
                "final_description": None,
                "category_details": {"features": [], "defects": [], "attachments": []},
                "key_count": None,
                "tags": [],
                "evidence_used": {
                    "color_source": "unknown",
                    "feature_sources": [],
                    "defect_sources": [],
                    "attachment_sources": [],
                    "ocr_source": "none",
                },
            }

        status = str(payload.get("status", "") or "").strip().lower()
        if status not in {"accepted", "rejected"}:
            status = "rejected"

        category_details = payload.get("category_details")
        category_details = category_details if isinstance(category_details, dict) else {}
        evidence_used = payload.get("evidence_used")
        evidence_used = evidence_used if isinstance(evidence_used, dict) else {}
        key_count = payload.get("key_count")
        if not isinstance(key_count, int) or isinstance(key_count, bool):
            key_count = None

        color_source = str(evidence_used.get("color_source", "unknown") or "unknown").strip()
        if color_source not in {"florence_vqa_color", "caption", "unknown"}:
            color_source = "unknown"
        ocr_source = str(evidence_used.get("ocr_source", "none") or "none").strip()
        if ocr_source not in {"ocr_text", "none"}:
            ocr_source = "none"

        result = {
            "status": status,
            "message": str(payload.get("message", "") or "").strip(),
            "label": str(payload.get("label", "") or "").strip() or None,
            "color": str(payload.get("color", "") or "").strip() or None,
            "final_description": str(payload.get("final_description", "") or "").strip() or None,
            "category_details": {
                "features": cls._normalize_string_list(category_details.get("features")),
                "defects": cls._normalize_string_list(category_details.get("defects")),
                "attachments": cls._normalize_string_list(category_details.get("attachments")),
            },
            "key_count": key_count,
            "tags": cls._normalize_string_list(payload.get("tags")),
            "evidence_used": {
                "color_source": color_source,
                "feature_sources": cls._normalize_string_list(evidence_used.get("feature_sources")),
                "defect_sources": cls._normalize_string_list(evidence_used.get("defect_sources")),
                "attachment_sources": cls._normalize_string_list(evidence_used.get("attachment_sources")),
                "ocr_source": ocr_source,
            },
        }

        if result["status"] == "accepted" and not result["final_description"]:
            result["status"] = "rejected"
            result["message"] = result["message"] or "Gemini returned an empty accepted Phase 2 description"

        return result

    def _build_pp2_generate_config(self) -> Any:
        """Build Gemini generation configuration for PP2 prompts."""
        from google.genai import types  # type: ignore

        thinking_budget = max(0, int(getattr(settings, "PP2_REASONER_THINKING_BUDGET", 256)))
        thinking_level = str(getattr(settings, "PP2_REASONER_THINKING_LEVEL", "medium") or "medium").strip().lower()
        thinking_config = (
            types.ThinkingConfig(thinkingLevel=thinking_level)
            if self._is_gemini3_model(self.pp2_model_name)
            else types.ThinkingConfig(thinkingBudget=thinking_budget)
        )
        return types.GenerateContentConfig(
            systemInstruction=PHASE2_PP2_SYSTEM_INSTRUCTION.strip(),
            temperature=float(getattr(settings, "PP2_REASONER_TEMPERATURE", 0.2)),
            maxOutputTokens=int(getattr(settings, "PP2_REASONER_MAX_OUTPUT_TOKENS", 320)),
            response_mime_type="application/json",
            response_json_schema=PHASE2_PP2_RESPONSE_SCHEMA,
            thinkingConfig=thinking_config,
        )

    def _build_pp1_generate_config(self) -> Any:
        """Build Gemini generation configuration for PP1 prompts."""
        from google.genai import types  # type: ignore

        thinking_level = str(getattr(settings, "PP1_GEMINI_THINKING_LEVEL", "low") or "low").strip().lower()
        thinking_config = (
            types.ThinkingConfig(thinkingLevel=thinking_level)
            if self._is_gemini3_model(self.model_name)
            else types.ThinkingConfig(thinkingBudget=max(0, int(getattr(settings, "PP2_REASONER_THINKING_BUDGET", 256))))
        )
        return types.GenerateContentConfig(
            temperature=float(getattr(settings, "PP1_GEMINI_TEMPERATURE", 0.1)),
            maxOutputTokens=int(getattr(settings, "PP1_GEMINI_MAX_OUTPUT_TOKENS", 320)),
            response_mime_type="application/json",
            response_json_schema=PHASE1_PP1_RESPONSE_SCHEMA,
            thinkingConfig=thinking_config,
        )

    def _build_pp1_fallback_generate_config(self) -> Any:
        """Build Gemini fallback generation configuration for PP1 prompts."""
        from google.genai import types  # type: ignore

        return types.GenerateContentConfig(
            temperature=float(getattr(settings, "PP1_GEMINI_TEMPERATURE", 0.1)),
            maxOutputTokens=int(getattr(settings, "PP1_GEMINI_MAX_OUTPUT_TOKENS", 320)),
            response_mime_type="application/json",
            response_json_schema=PHASE1_PP1_RESPONSE_SCHEMA,
            thinkingConfig=types.ThinkingConfig(
                thinkingBudget=max(0, int(getattr(settings, "PP2_REASONER_THINKING_BUDGET", 256)))
            ),
        )

    def _build_pp2_fallback_generate_config(self) -> Any:
        """Build Gemini fallback generation configuration for PP2 prompts."""
        from google.genai import types  # type: ignore

        return types.GenerateContentConfig(
            systemInstruction=PHASE2_PP2_SYSTEM_INSTRUCTION.strip(),
            temperature=float(getattr(settings, "PP2_REASONER_TEMPERATURE", 0.2)),
            maxOutputTokens=int(getattr(settings, "PP2_REASONER_MAX_OUTPUT_TOKENS", 320)),
            response_mime_type="application/json",
            response_json_schema=PHASE2_PP2_RESPONSE_SCHEMA,
            thinkingConfig=types.ThinkingConfig(
                thinkingBudget=max(0, int(getattr(settings, "PP2_REASONER_THINKING_BUDGET", 256)))
            ),
        )

    def extract_category_details(self, evidence_json: Dict[str, Any], crop_image: Optional[Any] = None) -> Dict[str, Any]:
        """
        Strict extractor function for Phase 1.
        """
        # Extract context
        detection = evidence_json.get("detection", {})
        crop_analysis = evidence_json.get("crop_analysis", {})
        canonical_label_in = evidence_json.get("canonical_label")
        label_lock = bool(evidence_json.get("label_lock", False))
        label_candidates_raw = evidence_json.get("label_candidates", [])
        label_candidates = [
            str(label).strip()
            for label in (label_candidates_raw if isinstance(label_candidates_raw, list) else [])
            if str(label).strip()
        ]
        
        raw_label = canonical_label_in if canonical_label_in else detection.get("label", "Unknown")
        label = canonicalize_label(raw_label) or raw_label
        
        color = crop_analysis.get("color_vqa")
        if not color or color.lower() == "unknown":
            color = "Unknown"
            
        ocr = crop_analysis.get("ocr_text")
        if not ocr:
            ocr = "None"
        
        # Get specs
        specs = CATEGORY_SPECS.get(label, {})
        feature_list = specs.get("features", [])
        defect_list = specs.get("defects", [])
        attachment_list = specs.get("attachments", [])
        
        # Extract new evidence fields
        caption = crop_analysis.get("caption", "None")
        defects_vqa = crop_analysis.get("raw", {}).get("defects_vqa", "None")
        
        grounded_features = crop_analysis.get("grounded_features", [])
        grounded_defects = crop_analysis.get("grounded_defects", [])
        grounded_attachments = crop_analysis.get("grounded_attachments", [])
        
        grounding_raw = crop_analysis.get("raw", {}).get("grounding_raw", {})
        grounding_labels_raw = grounding_raw.get("labels", []) if isinstance(grounding_raw, dict) else []

        prompt_body = STRICT_EXTRACTOR_PROMPT.format(
            LABEL=label,
            COLOR_OR_UNKNOWN=color,
            OCR_TEXT_OR_NONE=ocr,
            CAPTION_OR_NONE=caption,
            DEFECTS_VQA_TEXT_OR_NONE=defects_vqa,
            GROUNDED_FEATURES_JSON=json.dumps(grounded_features),
            GROUNDED_DEFECTS_JSON=json.dumps(grounded_defects),
            GROUNDED_ATTACHMENTS_JSON=json.dumps(grounded_attachments),
            GROUNDING_LABELS_RAW_JSON=json.dumps(grounding_labels_raw),
            FEATURE_LIST=json.dumps(feature_list, indent=2),
            DEFECT_LIST=json.dumps(defect_list, indent=2),
            ATTACHMENT_LIST=json.dumps(attachment_list, indent=2)
        )
        prompt = f"{self._build_pp1_visual_context(label, 1)}\n\n{prompt_body}"
        if label_lock:
            prompt += (
                "\n\nCATEGORY LOCK (MANDATORY):\n"
                f"- CANONICAL_LABEL: {label}\n"
                f"- LABEL_CANDIDATES: {json.dumps(label_candidates)}\n"
                "- DO NOT change category.\n"
                "- You MUST keep the category as CANONICAL_LABEL and only extract details.\n"
            )

        images = [crop_image] if crop_image else None
        text = self._generate_text(
            prompt,
            images=images,
            config=self._build_pp1_generate_config(),
            model_name=self.model_name,
            fallback_model_name=self.pp1_fallback_model,
            fallback_config=self._build_pp1_fallback_generate_config(),
        )
        cleaned_json_str = _extract_json_content(text)

        try:
            data = self.normalize_phase1_response(
                json.loads(cleaned_json_str),
                fallback_label=label,
                fallback_color=(color if color != "Unknown" else None),
            )

            gemini_color = data.get("color")
            if gemini_color and str(gemini_color).strip().lower() not in ("", "unknown", "null", "none"):
                resolved_color = str(gemini_color).strip()
            else:
                resolved_color = color if color != "Unknown" else None
            return {
                "status": data.get("status", "accepted"),
                "message": data.get("message") or "Extracted successfully",
                "label": data.get("label") or label,
                "color": resolved_color,
                "category_details": data.get("category_details", {"features": [], "defects": [], "attachments": []}),
                "key_count": data.get("key_count"),
                "final_description": data.get("final_description"),
                "detailed_description": data.get("detailed_description") or data.get("final_description"),
                "label_change_reason": data.get("label_change_reason"),
                "evidence_used": data.get("evidence_used", {"caption": [], "ocr": [], "grounding": [], "color": [], "key_count": []}),
                "unsupported_claims": data.get("unsupported_claims", []),
                "reasoning_meta": self.consume_last_request_meta(),
            }
            
        except json.JSONDecodeError:
            # Fallback: return rejected if JSON parsing fails
            return {
                "status": "rejected",
                "message": "Gemini returned invalid JSON",
                "label": label,
                "evidence_used": {"caption": [], "ocr": [], "grounding": [], "color": [], "key_count": []},
                "unsupported_claims": [],
                "reasoning_meta": self.consume_last_request_meta(),
            }

    def run_phase1(self, florence_evidence_json: Dict[str, Any], crop_image: Optional[Any] = None) -> Dict[str, Any]:
        """
        Alias for extract_category_details to maintain backward compatibility if needed,
        or simply delegate to the new strict extractor.
        """
        return self.extract_category_details(florence_evidence_json, crop_image=crop_image)

    def analyze_pp2_view(self, evidence_json: Dict[str, Any], crop_image: Optional[Any] = None) -> Dict[str, Any]:
        """
        Reuse the Phase 1 schema-backed extractor for a single PP2 view and return
        the full normalized payload so PP2 can persist richer per-view evidence.
        """
        phase1 = self.run_phase1(evidence_json, crop_image=crop_image)
        status_in = str(phase1.get("status", "")).strip().lower()

        if status_in == "accepted":
            pp2_status = "success"
        elif status_in == "rejected":
            pp2_status = "rejected"
        else:
            pp2_status = "error"

        payload: Dict[str, Any] = dict(phase1)
        payload["pp2_view_status"] = pp2_status
        payload["description"] = phase1.get("detailed_description") or phase1.get("final_description")
        return payload

    def confirm_pp2_view(self, evidence_json: Dict[str, Any], crop_image: Optional[Any] = None) -> Dict[str, Any]:
        """
        PP2 helper that returns a compact, normalized payload for single-view advisory evidence.
        Timeout behavior is intentionally owned by the PP2 caller.
        """
        phase1 = self.analyze_pp2_view(evidence_json, crop_image=crop_image)
        status = str(phase1.get("pp2_view_status", "")).strip().lower() or "error"

        payload: Dict[str, Any] = {
            "status": status,
            "label": phase1.get("label"),
            "description": phase1.get("description"),
            "message": str(phase1.get("message", "") or ""),
        }
        if "error" in phase1:
            payload["error"] = phase1.get("error")
        return payload

    def run_phase2(
        self,
        evidence_bundle_json: Dict[str, Any],
        images: Optional[List[Any]] = None,
    ) -> Dict[str, Any]:
        """Run the PP2 phase-2 reasoning prompt and normalize the result."""
        image_count = len(images) if images else len(evidence_bundle_json.get("selected_view_indices", []) or [])
        prompt_body = PHASE2_PP2_PROMPT.replace(
            "{{EVIDENCE_BUNDLE_JSON}}",
            json.dumps(evidence_bundle_json, ensure_ascii=False),
        ).replace(
            "{{ALLOWED_LABELS_LIST}}",
            "\n".join(f"- {label}" for label in ALLOWED_LABELS)
        )
        prompt = f"{self._build_pp2_visual_context(evidence_bundle_json, image_count)}\n\n{prompt_body}"
        text = self._generate_text(
            prompt,
            images=images,
            config=self._build_pp2_generate_config(),
            model_name=self.pp2_model_name,
            fallback_model_name=self.pp2_fallback_model,
            fallback_config=self._build_pp2_fallback_generate_config(),
            image_first=True,
        )
        cleaned = _extract_json_content(text)
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            result = {
                "status": "rejected",
                "message": "Gemini returned invalid JSON in Phase 2",
                "label": None,
                "color": None,
                "final_description": None,
                "category_details": {"features": [], "defects": [], "attachments": []},
                "key_count": None,
                "tags": [],
                "evidence_used": {
                    "color_source": "unknown",
                    "feature_sources": [],
                    "defect_sources": [],
                    "attachment_sources": [],
                    "ocr_source": "none",
                },
            }
            result["reasoning_meta"] = self.consume_last_request_meta()
            return result

        result = self.normalize_phase2_response(data)
        result["reasoning_meta"] = self.consume_last_request_meta()
        return result
