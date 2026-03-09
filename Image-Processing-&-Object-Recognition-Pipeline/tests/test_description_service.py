import re
import unittest

import numpy as np

from app.schemas.pp2_schemas import (
    PP2PerViewDetection,
    PP2PerViewEmbedding,
    PP2PerViewExtraction,
    PP2PerViewResult,
)
from app.services.description_service import DescriptionComposer
from app.services.pp2_fusion_service import MultiViewFusionService


def _view_result(
    view_index: int,
    *,
    quality_score: float,
    confidence: float,
    cls_name: str,
    ocr_text: str,
    grounded_features: dict,
    caption: str = "",
) -> PP2PerViewResult:
    return PP2PerViewResult(
        view_index=view_index,
        filename=f"view_{view_index}.jpg",
        detection=PP2PerViewDetection(
            bbox=(0.0, 0.0, 10.0, 10.0),
            cls_name=cls_name,
            confidence=confidence,
        ),
        extraction=PP2PerViewExtraction(
            caption=caption,
            ocr_text=ocr_text,
            grounded_features=grounded_features,
            extraction_confidence=1.0,
            raw={},
        ),
        embedding=PP2PerViewEmbedding(
            dim=8,
            vector_preview=[0.1] * 8,
            vector_id=f"vec_{view_index}",
        ),
        quality_score=quality_score,
    )


class TestDescriptionComposer(unittest.TestCase):
    def setUp(self):
        self.composer = DescriptionComposer()

    def test_smartphone_mentions_visible_text_without_material_guess(self):
        result = self.composer.compose(
            label="Smart Phone",
            color="black",
            ocr_text="FindAssure",
            features=["camera module"],
            defects=["screen scratches"],
            attachments=["screen protector attached"],
            caption="A black smart phone on a desk",
        )

        description = result["final_description"].lower()
        self.assertEqual(result["final_description"], result["detailed_description"])
        self.assertIn("visible screen text", description)
        self.assertIn("camera module", description)
        self.assertNotIn("plastic", description)
        self.assertLessEqual(result["description_word_count"]["final_description"], 50)
        self.assertEqual(
            result["description_word_count"]["final_description"],
            result["description_word_count"]["detailed_description"],
        )

    def test_student_id_filters_sensitive_features_and_keeps_visible_text(self):
        result = self.composer.compose(
            label="Student ID",
            color="blue",
            ocr_text="ABC University 12345",
            features=["name", "id number", "photo"],
            attachments=["lanyard"],
            caption="student card",
        )

        description = result["final_description"].lower()
        self.assertIn("photo", description)
        self.assertIn("lanyard", description)
        self.assertIn("visible printed text", description)
        self.assertNotIn("name", description)
        self.assertNotIn("id number", description)
        self.assertIn("feature_card_sensitive_filter", result["description_filters_applied"])

    def test_sparse_evidence_still_returns_safe_object_description(self):
        result = self.composer.compose(
            label="Wallet",
        )

        self.assertEqual(result["description_source"], "evidence_composer")
        self.assertEqual(result["detailed_description_source"], "evidence_composer")
        self.assertEqual(result["final_description"], "A wallet.")
        self.assertEqual(result["final_description"], result["detailed_description"])
        self.assertEqual(result["description_timings_ms"]["fallback_ms"], 0.0)

    def test_wallet_description_filters_fragment_and_keeps_readable_terms(self):
        result = self.composer.compose(
            label="Wallet",
            color="black",
            features=["log", "logo", "zipper"],
            defects=["scratch"],
        )

        description = result["final_description"].lower()
        self.assertIn("black wallet", description)
        self.assertIn("visible logo", description)
        self.assertIn("zipper", description)
        self.assertIn("scratch", description)
        self.assertIsNone(re.search(r"\blog\b", description))
        self.assertIn("feature_fragment_filter", result["description_filters_applied"])

    def test_compatibility_fields_share_same_generated_description(self):
        result = self.composer.compose(
            label="Wallet",
            color="navy",
            features=["logo"],
            attachments=["chain attached"],
        )

        self.assertEqual(result["final_description"], result["detailed_description"])
        self.assertEqual(result["description_source"], "evidence_composer")
        self.assertEqual(result["detailed_description_source"], "evidence_composer")
        self.assertEqual(
            result["description_word_count"]["final_description"],
            result["description_word_count"]["detailed_description"],
        )


class TestDetailedFusionDescriptions(unittest.TestCase):
    def setUp(self):
        self.fusion = MultiViewFusionService()
        self.vectors = [
            np.array([1.0, 0.0], dtype=np.float32),
            np.array([1.0, 0.0], dtype=np.float32),
        ]

    def test_fused_profile_adds_detailed_description_and_metadata(self):
        per_view = [
            _view_result(
                0,
                quality_score=0.99,
                confidence=0.98,
                cls_name="Wallet",
                ocr_text="BRANDX",
                grounded_features={
                    "color": "black",
                    "brand": "BRANDX",
                    "features": ["logo"],
                    "defects": ["scratch"],
                },
                caption="wallet front",
            ),
            _view_result(
                1,
                quality_score=0.92,
                confidence=0.95,
                cls_name="Wallet",
                ocr_text="BRANDX",
                grounded_features={
                    "color": "black",
                    "brand": "BRANDX",
                    "features": ["zipper"],
                    "defects": ["dent"],
                },
                caption="wallet side",
            ),
        ]

        fused = self.fusion.fuse(per_view, self.vectors, item_id="item-123", used_view_indices=[0, 1])

        self.assertTrue(fused.caption)
        self.assertTrue(fused.detailed_description)
        self.assertIn("consensus_only", fused.description_filters_applied)
        self.assertEqual(fused.description_source, "consensus_conservative_caption")
        self.assertIn("description_scope_view_indices", fused.attributes)
        self.assertLessEqual(fused.description_word_count["detailed_description"], 50)

    def test_detailed_description_uses_best_view_fallback_without_combining_conflicts(self):
        per_view = [
            _view_result(
                0,
                quality_score=0.99,
                confidence=0.98,
                cls_name="Wallet",
                ocr_text="BRANDX",
                grounded_features={
                    "color": "black",
                    "features": ["logo"],
                    "defects": ["scratch"],
                },
                caption="wallet front",
            ),
            _view_result(
                1,
                quality_score=0.90,
                confidence=0.95,
                cls_name="Wallet",
                ocr_text="BRANDX",
                grounded_features={
                    "color": "black",
                    "features": ["zipper"],
                    "defects": ["dent"],
                },
                caption="wallet side",
            ),
        ]

        fused = self.fusion.fuse(per_view, self.vectors, item_id="item-456", used_view_indices=[0, 1])
        detailed_lower = fused.detailed_description.lower()

        self.assertIn("logo", detailed_lower)
        self.assertIn("scratch", detailed_lower)
        self.assertNotIn("zipper and logo", detailed_lower)
        self.assertNotIn("dent and scratch", detailed_lower)
        self.assertIn("best_view_feature_fallback", fused.description_filters_applied)


if __name__ == "__main__":
    unittest.main()
