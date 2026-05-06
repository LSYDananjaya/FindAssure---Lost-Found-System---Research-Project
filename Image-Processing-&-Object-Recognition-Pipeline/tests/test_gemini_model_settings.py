import json
from unittest.mock import patch

from PIL import Image

from app.config.settings import Settings
from app.services.gemini_reasoner import GeminiReasoner


def test_gemini_flash_is_default_reasoner_model():
    settings = Settings(_env_file=None)

    assert settings.PP1_GEMINI_MODEL == "models/gemini-2.5-flash"
    assert settings.PP1_GEMINI_FALLBACK_MODEL == "gemini-2.5-flash"
    assert settings.PP1_GEMINI_INCLUDE_IMAGE is True
    assert settings.PP2_ENABLE_REASONER is True
    assert settings.PP2_REASONER_MODE == "per_view_and_phase2"
    assert settings.PP2_REASONER_MODEL == "models/gemini-2.5-flash"
    assert settings.PP2_REASONER_FALLBACK_MODEL == "gemini-2.5-flash"
    assert settings.PP2_REASONER_ALWAYS_ENRICH is True
    assert settings.PP2_REASONER_INCLUDE_IMAGES is True


def test_pp2_gemini_timeouts_default_to_60_seconds():
    settings = Settings(_env_file=None)

    assert settings.PP2_REASONER_TIMEOUT_S == 60
    assert settings.PP2_PHASE2_TIMEOUT_S == 60


def test_pp1_gemini_reasoner_passes_crop_image_inline():
    reasoner = GeminiReasoner()
    crop = Image.new("RGB", (4, 4), "blue")
    captured = {}

    def fake_generate_text(prompt, *, images=None, config=None, model_name=None, image_first=False, **kwargs):
        captured["images"] = images
        return json.dumps(
            {
                "status": "accepted",
                "label": "Wallet",
                "color": "Blue",
                "final_description": "A blue wallet with a plain exterior.",
                "detailed_description": "A blue wallet with a plain exterior.",
                "category_details": {
                    "features": [],
                    "defects": [],
                    "attachments": [],
                },
                "key_count": None,
                "evidence_used": {
                    "caption": [],
                    "ocr": [],
                    "grounding": [],
                    "color": ["PRIMARY_COLOR"],
                    "key_count": [],
                },
                "unsupported_claims": [],
                "label_change_reason": None,
            }
        )

    evidence = {
        "detection": {"label": "Wallet"},
        "canonical_label": "Wallet",
        "crop_analysis": {
            "color_vqa": "Blue",
            "caption": "blue wallet",
            "ocr_text": "",
            "grounded_features": [],
            "grounded_defects": [],
            "grounded_attachments": [],
            "raw": {},
        },
    }

    with patch.object(reasoner, "_generate_text", side_effect=fake_generate_text):
        result = reasoner.run_phase1(evidence, crop_image=crop)

    assert result["status"] == "accepted"
    assert captured["images"] == [crop]
