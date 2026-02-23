"""
LostTextNormalizer — Gemini-powered text normalization and attribute extraction.

Implements:
  - normalize_lost_description(): request-time Gemini extraction with MongoDB cache (TTL = 1hr)
  - extract_found_attributes():   offline/batch Gemini extraction for found items
  - Graceful fallback: if GEMINI_API_KEY is absent, returns a passthrough struct from raw text.
"""

import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt Templates (DESIGN_DOC §B1 and §B2)
# ---------------------------------------------------------------------------

LOST_EXTRACTION_PROMPT = """\
You are an expert at understanding lost item descriptions written by regular people.
Descriptions may be:
- Incomplete (missing some details)
- Grammatically incorrect or informal
- Written in mixed languages (English + Sinhala / Singlish)
- Using abbreviations, slang, or brand nicknames

Your job is to extract structured information from the description below.

=== LOST ITEM DESCRIPTION ===
{raw_description}

=== ITEM CATEGORY ===
{category}

=== OUTPUT FORMAT ===
Return ONLY a valid JSON object. No explanation, no markdown, no code fence.

{{
  "clean_description": "<rewrite the description in clean English, filling obvious gaps>",
  "language_detected": "<english | sinhala | singlish | mixed>",
  "keywords": ["<important content words only, no stop words, lowercase>"],
  "attributes": {{
    "brand": "<brand/manufacturer or null>",
    "model": "<model name/number or null>",
    "color": "<primary color(s) or null>",
    "material": "<material type or null>",
    "size": "<size/dimensions in any unit or null>",
    "identifiers": [
      {{
        "type": "<serial | imei | id_number | name | phone | other>",
        "value": "<exact value as written>"
      }}
    ],
    "unique_marks": "<scratches, stickers, engravings, damage marks, or null>"
  }},
  "must_match_tokens": [
    "<if identifiers exist (serial/IMEI/ID/name/phone), list their values here verbatim>"
  ],
  "missing_fields": ["<list attribute names the user didn't mention>"],
  "confidence": "<high | medium | low>"
}}

=== RULES ===
1. If a field is not mentioned, set it to null (not empty string).
2. must_match_tokens MUST only contain values that are unique identifiers — not common words.
3. For mixed language (Singlish/Sinhala), translate to English in clean_description.
4. Do not guess. Only extract what is clearly stated or strongly implied.
5. keywords should be 3-10 terms that best identify the item (colors, brand, model, type).
6. If the description is ambiguous, set confidence to "low".
"""

FOUND_EXTRACTION_PROMPT = """\
You are an expert at analyzing lost-and-found item descriptions.
The description below was written by someone who found an item.

=== FOUND ITEM DESCRIPTION ===
{raw_description}

=== ITEM CATEGORY ===
{category}

=== OUTPUT FORMAT ===
Return ONLY a valid JSON object. No explanation, no markdown, no code fence.

{{
  "clean_description": "<clean, normalized English version of the description>",
  "language_detected": "<english | sinhala | singlish | mixed>",
  "keywords": ["<key identifying terms, lowercase>"],
  "attributes": {{
    "brand": "<brand/manufacturer or null>",
    "model": "<model name/number or null>",
    "color": "<primary color(s) or null>",
    "material": "<material type or null>",
    "size": "<size or null>",
    "identifiers": [
      {{
        "type": "<serial | imei | id_number | name | phone | other>",
        "value": "<exact value>"
      }}
    ],
    "unique_marks": "<any distinctive physical marks or null>"
  }},
  "searchable_tokens": [
    "<list all identifier values and any rare/unique tokens for BM25 indexing>"
  ]
}}

=== RULES ===
1. null for missing fields — never empty string.
2. searchable_tokens must include all identifier values verbatim.
3. Translate any non-English text to English in clean_description.
4. Do not infer details not present in the description.
"""

# ---------------------------------------------------------------------------
# Fallback schema (used when Gemini API key is not configured)
# ---------------------------------------------------------------------------

def _passthrough_lost(raw_text: str, category: str) -> dict:
    """Minimal structured dict from raw text when Gemini is unavailable."""
    tokens = [w.lower() for w in raw_text.split() if len(w) > 2]
    return {
        "clean_description": raw_text.strip(),
        "language_detected": "unknown",
        "keywords": tokens[:10],
        "attributes": {
            "brand": None, "model": None, "color": None,
            "material": None, "size": None,
            "identifiers": [], "unique_marks": None,
        },
        "must_match_tokens": [],
        "missing_fields": ["brand", "model", "color", "material", "size"],
        "confidence": "low",
        "_fallback": True,
    }

def _passthrough_found(raw_text: str, category: str) -> dict:
    tokens = [w.lower() for w in raw_text.split() if len(w) > 2]
    return {
        "clean_description": raw_text.strip(),
        "language_detected": "unknown",
        "keywords": tokens[:10],
        "attributes": {
            "brand": None, "model": None, "color": None,
            "material": None, "size": None,
            "identifiers": [], "unique_marks": None,
        },
        "searchable_tokens": tokens[:10],
        "_fallback": True,
    }

# ---------------------------------------------------------------------------
# LostTextNormalizer
# ---------------------------------------------------------------------------

class LostTextNormalizer:
    """
    Singleton normalizer.

    Cache strategy: MongoDB `gemini_cache` collection.
      - doc: { cache_key, result, expires_at }
      - TTL index on `expires_at` auto-expires documents.
    """

    _instance: Optional["LostTextNormalizer"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init()
        return cls._instance

    def _init(self):
        self._model = None
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self._model = genai.GenerativeModel(settings.GEMINI_MODEL)
                logger.info(f"Gemini model loaded: {settings.GEMINI_MODEL}")
            except Exception as e:
                logger.warning(f"Gemini init failed: {e} — running in fallback mode")
        else:
            logger.warning(
                "GEMINI_API_KEY not set — normalizer will use passthrough fallback. "
                "Set GEMINI_API_KEY in .env to enable full extraction."
            )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _cache_key(raw_text: str, category: str, prompt_type: str) -> str:
        payload = f"{prompt_type}|{raw_text.strip()[:2000]}|{category}"
        return hashlib.sha256(payload.encode()).hexdigest()

    async def _cache_get(self, db, key: str) -> Optional[dict]:
        if db is None:
            return None
        try:
            now = datetime.utcnow()
            doc = await db.gemini_cache.find_one(
                {"cache_key": key, "expires_at": {"$gt": now}}
            )
            if doc:
                return doc["result"]
        except Exception as e:
            logger.debug(f"Cache get failed: {e}")
        return None

    async def _cache_set(self, db, key: str, result: dict):
        if db is None:
            return
        try:
            expires_at = datetime.utcnow() + timedelta(seconds=settings.GEMINI_CACHE_TTL_SECONDS)
            await db.gemini_cache.replace_one(
                {"cache_key": key},
                {"cache_key": key, "result": result, "expires_at": expires_at},
                upsert=True
            )
        except Exception as e:
            logger.debug(f"Cache set failed: {e}")

    def _call_gemini(self, prompt_text: str) -> dict:
        if self._model is None:
            raise RuntimeError("Gemini model not available")
        try:
            import google.generativeai as genai
            response = self._model.generate_content(
                prompt_text,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=512,
                    response_mime_type="application/json",
                )
            )
            raw = response.text.strip()
            # Strip accidental markdown fences
            if raw.startswith("```"):
                raw = "\n".join(raw.split("\n")[1:])
            if raw.endswith("```"):
                raw = raw[: raw.rfind("```")]
            return json.loads(raw.strip())
        except Exception as e:
            logger.error(f"Gemini call failed: {e}")
            raise

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def normalize_lost_description(
        self,
        db,
        raw_text: str,
        category: str,
    ) -> dict:
        """
        Normalize a lost-item description via Gemini (or fallback).
        Result is cached in MongoDB for GEMINI_CACHE_TTL_SECONDS.

        Args:
            db:         Motor database instance (or None for fallback)
            raw_text:   User's raw search query
            category:   Selected item category

        Returns:
            dict matching the LOST_EXTRACTION schema (DESIGN_DOC §B1)
        """
        key = self._cache_key(raw_text, category, "lost")

        # 1. Cache lookup
        cached = await self._cache_get(db, key)
        if cached:
            logger.debug("Gemini cache hit for lost normalization")
            return cached

        # 2. Gemini call (or fallback)
        if self._model is None:
            result = _passthrough_lost(raw_text, category)
        else:
            try:
                prompt = LOST_EXTRACTION_PROMPT.format(
                    raw_description=raw_text.strip()[:2000],
                    category=category,
                )
                result = self._call_gemini(prompt)
                # Ensure required keys exist
                result.setdefault("clean_description", raw_text.strip())
                result.setdefault("keywords", [])
                result.setdefault("attributes", {})
                result.setdefault("must_match_tokens", [])
                result.setdefault("missing_fields", [])
                result.setdefault("confidence", "medium")
            except Exception as e:
                logger.warning(f"Gemini failed, using fallback: {e}")
                result = _passthrough_lost(raw_text, category)

        # 3. Store in cache
        await self._cache_set(db, key, result)
        return result

    async def extract_found_attributes(
        self,
        db,
        raw_text: str,
        category: str,
    ) -> dict:
        """
        Extract attributes from a found-item description via Gemini (or fallback).
        Intended to be called by the offline batch job — results cached in MongoDB.

        Args:
            db:         Motor database instance (or None)
            raw_text:   Found item description_text
            category:   Item category

        Returns:
            dict matching the FOUND_EXTRACTION schema (DESIGN_DOC §B2)
        """
        key = self._cache_key(raw_text, category, "found")

        cached = await self._cache_get(db, key)
        if cached:
            return cached

        if self._model is None:
            result = _passthrough_found(raw_text, category)
        else:
            try:
                prompt = FOUND_EXTRACTION_PROMPT.format(
                    raw_description=raw_text.strip()[:2000],
                    category=category,
                )
                result = self._call_gemini(prompt)
                result.setdefault("clean_description", raw_text.strip())
                result.setdefault("keywords", [])
                result.setdefault("attributes", {})
                result.setdefault("searchable_tokens", [])
            except Exception as e:
                logger.warning(f"Gemini found extraction failed, using fallback: {e}")
                result = _passthrough_found(raw_text, category)

        await self._cache_set(db, key, result)
        return result
