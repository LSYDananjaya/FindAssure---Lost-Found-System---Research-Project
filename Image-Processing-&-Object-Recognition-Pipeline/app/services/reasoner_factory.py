from __future__ import annotations

from app.services.reasoner_types import ReasonerProtocol


def create_reasoner_from_settings() -> ReasonerProtocol:
    from app.services.gemini_reasoner import GeminiReasoner

    return GeminiReasoner()
