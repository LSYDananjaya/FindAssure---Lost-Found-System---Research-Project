import os
import sys
import types
import unittest
from unittest.mock import patch

from app.services import gemini_reasoner as gemini_reasoner_module
from app.services.gemini_reasoner import GeminiReasoner


class TestGeminiApiKeySelection(unittest.TestCase):
    def test_gemini_api_key_takes_precedence_and_google_key_is_hidden_from_client(self):
        client_calls = []

        def _client(**kwargs):
            client_calls.append(
                {
                    "kwargs": kwargs,
                    "google_key": os.environ.get("GOOGLE_API_KEY"),
                    "gemini_key": os.environ.get("GEMINI_API_KEY"),
                }
            )
            return object()

        fake_genai = types.SimpleNamespace(Client=_client)
        fake_google = types.SimpleNamespace(genai=fake_genai)
        fake_dotenv = types.SimpleNamespace(load_dotenv=lambda *args, **kwargs: None)

        with patch.dict(
            sys.modules,
            {
                "google": fake_google,
                "google.genai": fake_genai,
                "dotenv": fake_dotenv,
            },
        ), patch.dict(
            os.environ,
            {
                "GOOGLE_API_KEY": "google-key",
                "GEMINI_API_KEY": "gemini-key",
            },
            clear=False,
        ), patch.object(
            gemini_reasoner_module.settings,
            "GOOGLE_API_KEY",
            "google-key",
        ), patch.object(
            gemini_reasoner_module.settings,
            "GEMINI_API_KEY",
            "gemini-key",
        ):
            GeminiReasoner()._load_client()
            restored_google_key = os.environ.get("GOOGLE_API_KEY")
            restored_gemini_key = os.environ.get("GEMINI_API_KEY")

        self.assertEqual(client_calls[0]["kwargs"]["api_key"], "gemini-key")
        self.assertIsNone(client_calls[0]["google_key"])
        self.assertEqual(client_calls[0]["gemini_key"], "gemini-key")
        self.assertEqual(restored_google_key, "google-key")
        self.assertEqual(restored_gemini_key, "gemini-key")


if __name__ == "__main__":
    unittest.main()
