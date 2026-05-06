import unittest

from app.services.gemini_reasoner import GeminiReasoner
from app.services.reasoner_factory import create_reasoner_from_settings


class TestReasonerFactory(unittest.TestCase):
    def test_factory_returns_gemini_reasoner(self):
        reasoner = create_reasoner_from_settings()

        self.assertIsInstance(reasoner, GeminiReasoner)
