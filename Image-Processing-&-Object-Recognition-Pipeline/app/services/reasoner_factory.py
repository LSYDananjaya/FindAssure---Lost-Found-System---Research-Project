"""Factory for creating the Gemini reasoning provider."""

from __future__ import annotations

from app.services.reasoner_types import ReasonerProtocol


def create_reasoner_from_settings() -> ReasonerProtocol:
    """Create the Gemini reasoner used by PP1 and PP2."""
    from app.services.gemini_reasoner import GeminiReasoner

    return GeminiReasoner()
