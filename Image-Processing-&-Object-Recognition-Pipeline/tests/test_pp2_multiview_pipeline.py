import sys
import time
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock
from PIL import Image
import numpy as np


# Patch service imports before importing MultiViewPipeline to avoid heavy deps in unit tests.
mock_yolo_module = MagicMock()
mock_florence_module = MagicMock()
mock_dino_module = MagicMock()

mock_yolo_module.YoloService = MagicMock()
mock_florence_module.FlorenceService = MagicMock()
mock_dino_module.DINOEmbedder = MagicMock()

patched_modules = {
    "app.services.yolo_service": mock_yolo_module,
    "app.services.florence_service": mock_florence_module,
    "app.services.dino_embedder": mock_dino_module,
}
original_modules = {name: sys.modules.get(name) for name in patched_modules}

for name, module in patched_modules.items():
    sys.modules[name] = module

from app.services.pp2_multiview_pipeline import MultiViewPipeline
from app.services.gemini_reasoner import (
    GeminiFatalError,
    GeminiQuotaError,
    GeminiReasoner,
    GeminiTransientError,
    PHASE1_PP1_RESPONSE_SCHEMA,
    PHASE2_PP2_RESPONSE_SCHEMA,
    PHASE2_PP2_SYSTEM_INSTRUCTION,
)
from app.services.pp2_fusion_service import MultiViewFusionService
from app.services.unified_pipeline import UnifiedPipeline
from app.schemas.pp2_schemas import (
    PP2PerViewDetection,
    PP2PerViewEmbedding,
    PP2PerViewExtraction,
    PP2PerViewResult,
    PP2VerificationResult,
)
from app.config.settings import settings

# Restore module table so unrelated tests use real implementations.
for name, module in original_modules.items():
    if module is None:
        del sys.modules[name]
    else:
        sys.modules[name] = module


class TestMultiViewPipelineNormalization(unittest.TestCase):
    def setUp(self):
        self.pipeline = MultiViewPipeline(
            yolo=MagicMock(),
            florence=MagicMock(),
            dino=MagicMock(),
            verifier=MagicMock(),
            fusion=MagicMock(),
            faiss=MagicMock(),
        )

    def test_normalize_list_grounded_features(self):
        payload = {
            "caption": "sample",
            "ocr_text": "text",
            "grounded_features": ["logo", 123, None, " "],
            "grounded_defects": ["scratch"],
            "grounded_attachments": ["key ring"],
            "color_vqa": "black",
            "key_count": 2,
        }

        normalized = self.pipeline._normalize_extraction_payload(payload)
        grounded = normalized["grounded_features"]

        self.assertIsInstance(grounded, dict)
        self.assertEqual(grounded["features"], ["logo", "123"])
        self.assertEqual(grounded["defects"], ["scratch"])
        self.assertEqual(grounded["attachments"], ["key ring"])
        self.assertEqual(grounded["color"], "black")
        self.assertEqual(grounded["key_count"], 2)

    def test_normalize_dict_grounded_features_preserves_existing_color(self):
        payload = {
            "caption": "sample",
            "grounded_features": {
                "brand": "Acme",
                "color": "brown",
                "defects": ["scratch"],
            },
            "grounded_defects": ["dent"],
            "grounded_attachments": ["lanyard"],
            "color_vqa": "black",
            "key_count": 1,
        }

        normalized = self.pipeline._normalize_extraction_payload(payload)
        grounded = normalized["grounded_features"]

        self.assertEqual(grounded["brand"], "Acme")
        self.assertEqual(grounded["color"], "brown")
        self.assertEqual(grounded["defects"], ["scratch", "dent"])
        self.assertEqual(grounded["attachments"], ["lanyard"])
        self.assertEqual(grounded["key_count"], 1)

    def test_normalize_invalid_grounded_features_fallback(self):
        payload = {
            "caption": "sample",
            "grounded_features": "logo",
        }

        normalized = self.pipeline._normalize_extraction_payload(payload)
        grounded = normalized["grounded_features"]

        self.assertIsInstance(grounded, dict)
        self.assertEqual(grounded, {})

    def test_ocr_prefers_ocr_text_over_ocr(self):
        payload = {
            "caption": "sample",
            "ocr_text": "preferred",
            "ocr": "fallback",
            "grounded_features": {},
        }

        normalized = self.pipeline._normalize_extraction_payload(payload)
        self.assertEqual(normalized["ocr_text"], "preferred")

    def test_ocr_fallback_to_ocr_and_list_join(self):
        payload = {
            "caption": "sample",
            "ocr": ["AB", "123"],
            "grounded_features": {},
        }

        normalized = self.pipeline._normalize_extraction_payload(payload)
        self.assertEqual(normalized["ocr_text"], "AB 123")

    def test_build_phase2_category_details_extracts_lists(self):
        details = self.pipeline._build_phase2_category_details(
            {
                "features": ["logo", 123],
                "defects": ["scratch"],
                "attachments": ["key ring", None],
            }
        )

        self.assertEqual(details["features"], ["logo", "123"])
        self.assertEqual(details["defects"], ["scratch"])
        self.assertEqual(details["attachments"], ["key ring"])

    def test_should_prefer_phase2_description_when_it_covers_more_facts(self):
        preferred = self.pipeline._should_prefer_phase2_description(
            "A black helmet with a visor.",
            (
                "A black helmet with a clear visor. Visible features include white writing and chin vent. "
                "Attached parts include chin strap. Visible defects include surface scratches."
            ),
            features=["clear visor", "white writing", "chin vent"],
            defects=["surface scratches"],
            attachments=["chin strap"],
            ocr_text="",
        )

        self.assertTrue(preferred)

    def test_bypass_verification_result_forces_pass(self):
        verification = PP2VerificationResult(
            mode="two_view",
            cosine_sim_matrix=[[1.0, 0.2], [0.2, 1.0]],
            faiss_sim_matrix=[[1.0, 0.2], [0.2, 1.0]],
            geometric_scores={"0-1": {"score": 0.2}},
            passed=False,
            failure_reasons=["verification failed"],
            used_views=[0, 1],
            dropped_views=[],
        )

        updated = self.pipeline._bypass_verification_result(
            verification,
            used_views=[0, 1],
            decision_indices=[0, 1],
            dropped_views=[],
        )

        self.assertTrue(updated.passed)
        self.assertEqual(updated.failure_reasons, [])
        self.assertEqual(updated.used_views, [0, 1])

    def test_provisional_pair_verify_short_circuits_when_disabled(self):
        original = self.pipeline._multiview_verification_disabled
        self.pipeline._multiview_verification_disabled = MagicMock(return_value=True)
        try:
            passed, verification = self.pipeline._run_provisional_pair_verify(
                pair_indices=(0, 1),
                stage1_results_by_index={},
                request_id="req-disabled",
                item_id="item-disabled",
                decision_label="Wallet",
            )
        finally:
            self.pipeline._multiview_verification_disabled = original

        self.assertFalse(passed)
        self.assertIsNone(verification)


class TestMultiViewPipelineReasonerEnablement(unittest.TestCase):
    def setUp(self):
        self.pipeline = MultiViewPipeline(
            yolo=MagicMock(),
            florence=MagicMock(),
            dino=MagicMock(),
            verifier=MagicMock(),
            fusion=MagicMock(),
            faiss=MagicMock(),
        )
        self.original_pp2_enable = settings.PP2_ENABLE_REASONER
        self.original_pp2_reasoner_mode = settings.PP2_REASONER_MODE
        self.original_pp2_always_enrich = settings.PP2_REASONER_ALWAYS_ENRICH
        self.original_reasoner = self.pipeline._gemini

    def tearDown(self):
        settings.PP2_ENABLE_REASONER = self.original_pp2_enable
        settings.PP2_REASONER_MODE = self.original_pp2_reasoner_mode
        settings.PP2_REASONER_ALWAYS_ENRICH = self.original_pp2_always_enrich
        self.pipeline._gemini = self.original_reasoner

    def test_get_gemini_returns_configured_reasoner_when_pp2_enabled(self):
        settings.PP2_ENABLE_REASONER = True
        self.pipeline._gemini = MagicMock()

        reasoner = self.pipeline._get_gemini()

        self.assertIs(reasoner, self.pipeline._gemini)

    def test_phase2_only_mode_skips_per_view_and_runs_phase2_when_verification_passes(self):
        settings.PP2_ENABLE_REASONER = True
        settings.PP2_REASONER_MODE = "phase2_only"

        self.assertFalse(self.pipeline._should_run_pp2_per_view_reasoner())
        self.assertTrue(self.pipeline._should_run_pp2_phase2_reasoner(verification_passed=True))
        self.assertFalse(self.pipeline._should_run_pp2_phase2_reasoner(verification_passed=False))

    def test_per_view_and_phase2_mode_runs_phase2_when_verification_passes(self):
        settings.PP2_ENABLE_REASONER = True
        settings.PP2_REASONER_MODE = "per_view_and_phase2"
        settings.PP2_REASONER_ALWAYS_ENRICH = False

        self.assertTrue(self.pipeline._should_run_pp2_per_view_reasoner())
        self.assertTrue(self.pipeline._should_run_pp2_phase2_reasoner(verification_passed=True))

        settings.PP2_REASONER_ALWAYS_ENRICH = True
        self.assertTrue(self.pipeline._should_run_pp2_phase2_reasoner(verification_passed=True))

    def test_disabled_mode_skips_all_pp2_reasoner_paths(self):
        settings.PP2_ENABLE_REASONER = True
        settings.PP2_REASONER_MODE = "disabled"

        self.assertFalse(self.pipeline._pp2_reasoner_enabled())
        self.assertFalse(self.pipeline._should_run_pp2_per_view_reasoner())
        self.assertFalse(self.pipeline._should_run_pp2_phase2_reasoner(verification_passed=True))


class TestPP2Phase2GeminiBundle(unittest.TestCase):
    def setUp(self):
        self.gemini = MagicMock()
        self.gemini.run_phase2.return_value = {"status": "accepted", "final_description": "rich desc"}
        self.pipeline = MultiViewPipeline(
            yolo=MagicMock(),
            florence=MagicMock(),
            dino=MagicMock(),
            verifier=MagicMock(),
            fusion=MagicMock(),
            faiss=MagicMock(),
            gemini=self.gemini,
        )
        self.pipeline._get_gemini = MagicMock(return_value=self.gemini)

    def test_phase2_bundle_includes_category_details_and_detailed_description(self):
        per_view = [
            PP2PerViewResult(
                view_index=0,
                filename="view0.jpg",
                detection=PP2PerViewDetection(
                    bbox=(0.0, 0.0, 10.0, 10.0),
                    cls_name="Helmet",
                    confidence=0.95,
                ),
                extraction=PP2PerViewExtraction(
                    caption="short caption",
                    detailed_description="A black helmet with white writing.",
                    ocr_text="ACTIVE GENERATION",
                    grounded_features={
                        "color": "black",
                        "features": ["white writing", "clear visor"],
                        "defects": ["surface scratches"],
                        "attachments": ["chin strap"],
                    },
                    extraction_confidence=1.0,
                    raw={"color_vqa": "black"},
                ),
                embedding=PP2PerViewEmbedding(dim=16, vector_preview=[0.1] * 8, vector_id="vec0"),
                quality_score=0.99,
            )
        ]

        result = self.pipeline._run_pp2_phase2_gemini_sync(
            per_view_results=per_view,
            canonical_label_by_index={0: "Helmet"},
            crop_by_index={0: Image.new("RGB", (8, 8), color="black")},
            selected_indices=[0],
            item_id="item-1",
            request_id="req-1",
        )

        bundle = self.gemini.run_phase2.call_args.kwargs["evidence_bundle_json"]
        images = self.gemini.run_phase2.call_args.kwargs["images"]
        phase1_output = bundle["per_image"][0]["phase1_output"]

        self.assertEqual(bundle["selected_view_indices"], [0])
        self.assertEqual(phase1_output["description"], "A black helmet with white writing.")
        self.assertEqual(phase1_output["detailed_description"], "A black helmet with white writing.")
        self.assertEqual(phase1_output["category_details"]["features"], ["white writing", "clear visor"])
        self.assertEqual(phase1_output["category_details"]["defects"], ["surface scratches"])
        self.assertEqual(phase1_output["category_details"]["attachments"], ["chin strap"])
        self.assertEqual(bundle["per_image"][0]["source_tags"]["caption"], ["florence_caption"])
        self.assertEqual(bundle["per_image"][0]["source_tags"]["ocr"], ["ocr_text"])
        self.assertEqual(len(images), 1)
        self.assertEqual(result["status"], "accepted")
        self.assertIn("elapsed_ms", result)
        self.assertGreaterEqual(result["elapsed_ms"], 0.0)

    def test_pp2_gemini_evidence_keeps_feature_defect_attachment_lists_separate(self):
        view = PP2PerViewResult(
            view_index=0,
            filename="view0.jpg",
            detection=PP2PerViewDetection(
                bbox=(0.0, 0.0, 10.0, 10.0),
                cls_name="Helmet",
                confidence=0.95,
            ),
            extraction=PP2PerViewExtraction(
                caption="A black helmet.",
                detailed_description="A black helmet with a clear visor.",
                ocr_text="832",
                grounded_features={
                    "color": "black",
                    "features": ["clear visor", "red and white logo"],
                    "defects": ["visor scratch"],
                    "attachments": ["chin strap"],
                },
                extraction_confidence=1.0,
                raw={"color_vqa": "black"},
            ),
            embedding=PP2PerViewEmbedding(dim=16, vector_preview=[0.1] * 8, vector_id="vec0"),
            quality_score=0.99,
        )

        evidence = self.pipeline._build_pp2_gemini_evidence(view, "Helmet")
        crop_analysis = evidence["crop_analysis"]

        self.assertEqual(crop_analysis["grounded_features"], ["clear visor", "red and white logo"])
        self.assertEqual(crop_analysis["grounded_defects"], ["visor scratch"])
        self.assertEqual(crop_analysis["grounded_attachments"], ["chin strap"])

    def test_phase2_bundle_includes_all_views_and_marks_selected_subset(self):
        per_view = [
            PP2PerViewResult(
                view_index=0,
                filename="view0.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Wallet", confidence=0.95),
                extraction=PP2PerViewExtraction(
                    caption="front",
                    detailed_description="A brown wallet with logo.",
                    ocr_text="BRANDX",
                    grounded_features={"color": "brown", "features": ["logo"]},
                    extraction_confidence=1.0,
                    raw={"color_vqa": "brown"},
                ),
                embedding=PP2PerViewEmbedding(dim=16, vector_preview=[0.1] * 8, vector_id="vec0"),
                quality_score=0.99,
            ),
            PP2PerViewResult(
                view_index=1,
                filename="view1.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Wallet", confidence=0.95),
                extraction=PP2PerViewExtraction(
                    caption="inside",
                    detailed_description="The inside view shows card slots.",
                    ocr_text="BRANDX",
                    grounded_features={"color": "brown", "features": ["card slots"]},
                    extraction_confidence=1.0,
                    raw={"color_vqa": "brown"},
                ),
                embedding=PP2PerViewEmbedding(dim=16, vector_preview=[0.1] * 8, vector_id="vec1"),
                quality_score=0.97,
            ),
            PP2PerViewResult(
                view_index=2,
                filename="view2.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Wallet", confidence=0.95),
                extraction=PP2PerViewExtraction(
                    caption="discarded",
                    detailed_description="A background-only view.",
                    ocr_text="NOISE",
                    grounded_features={"color": "brown", "features": ["noise"]},
                    extraction_confidence=1.0,
                    raw={"color_vqa": "brown"},
                ),
                embedding=PP2PerViewEmbedding(dim=16, vector_preview=[0.1] * 8, vector_id="vec2"),
                quality_score=0.10,
            ),
        ]

        self.pipeline._run_pp2_phase2_gemini_sync(
            per_view_results=per_view,
            canonical_label_by_index={0: "Wallet", 1: "Wallet", 2: "Wallet"},
            crop_by_index={
                0: Image.new("RGB", (8, 8), color="brown"),
                1: Image.new("RGB", (8, 8), color="brown"),
                2: Image.new("RGB", (8, 8), color="white"),
            },
            selected_indices=[0, 1],
            item_id="item-2",
            request_id="req-2",
        )

        bundle = self.gemini.run_phase2.call_args.kwargs["evidence_bundle_json"]
        images = self.gemini.run_phase2.call_args.kwargs["images"]

        self.assertEqual(bundle["selected_view_indices"], [0, 1])
        self.assertEqual([entry["view_index"] for entry in bundle["per_image"]], [0, 1, 2])
        self.assertEqual(
            [entry["selected_for_verification"] for entry in bundle["per_image"]],
            [True, True, False],
        )
        self.assertEqual(len(images), 3)

    def test_phase2_capacity_failure_returns_structured_fallback_without_error_trace_log(self):
        self.gemini.run_phase2.side_effect = GeminiFatalError(
            '{"error":"model requires more system memory (7.1 GiB) than is available (7.0 GiB)"}',
            status_code=500,
            provider_status="INSUFFICIENT_SYSTEM_MEMORY",
        )

        per_view = [
            PP2PerViewResult(
                view_index=0,
                filename="view0.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Wallet", confidence=0.95),
                extraction=PP2PerViewExtraction(
                    caption="front",
                    detailed_description="A brown wallet with logo.",
                    ocr_text="BRANDX",
                    grounded_features={"color": "brown", "features": ["logo"]},
                    extraction_confidence=1.0,
                    raw={"color_vqa": "brown"},
                ),
                embedding=PP2PerViewEmbedding(dim=16, vector_preview=[0.1] * 8, vector_id="vec0"),
                quality_score=0.99,
            )
        ]

        with self.assertLogs("app.services.pp2_multiview_pipeline", level="WARNING") as captured:
            result = self.pipeline._run_pp2_phase2_gemini_sync(
                per_view_results=per_view,
                canonical_label_by_index={0: "Wallet"},
                crop_by_index={0: Image.new("RGB", (8, 8), color="brown")},
                selected_indices=[0],
                item_id="item-capacity",
                request_id="req-capacity",
            )

        self.assertEqual(result["status"], "error")
        self.assertEqual(result["provider_status"], "INSUFFICIENT_SYSTEM_MEMORY")
        self.assertTrue(result["expected_capacity_failure"])
        self.assertIn("elapsed_ms", result)
        self.assertTrue(any("PP2_PHASE2_GEMINI_CAPACITY" in line for line in captured.output))
        self.assertFalse(any("PP2_PHASE2_GEMINI_ERROR" in line for line in captured.output))

    def test_apply_gemini_view_enrichment_updates_view_description_and_details(self):
        per_view = [
            PP2PerViewResult(
                view_index=0,
                filename="view0.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Wallet", confidence=0.95),
                extraction=PP2PerViewExtraction(
                    caption="front",
                    detailed_description="A brown wallet.",
                    ocr_text="BRANDX",
                    grounded_features={"color": "brown", "features": ["logo"]},
                    extraction_confidence=1.0,
                    raw={"color_vqa": "brown"},
                ),
                embedding=PP2PerViewEmbedding(dim=16, vector_preview=[0.1] * 8, vector_id="vec0"),
                quality_score=0.99,
            )
        ]

        self.pipeline._apply_gemini_view_enrichment(
            per_view_results=per_view,
            gemini_evidence_by_index={
                0: {
                    "status": "success",
                    "final_description": "A brown wallet with a visible logo and card slots.",
                    "detailed_description": "A brown wallet with a visible logo on the front and card slots inside.",
                    "color": "brown",
                    "category_details": {
                        "features": ["logo", "card slots"],
                        "defects": [],
                        "attachments": [],
                    },
                    "evidence_used": {
                        "caption": ["wallet"],
                        "ocr": ["BRANDX"],
                        "grounding": ["logo", "card slots"],
                        "color": ["florence_vqa_color"],
                        "key_count": [],
                    },
                    "unsupported_claims": ["zipper compartment not visible"],
                }
            },
        )

        self.assertIn("card slots", per_view[0].extraction.detailed_description.lower())
        self.assertIn("card slots", per_view[0].extraction.grounded_features["features"])
        self.assertEqual(per_view[0].extraction.raw["gemini"]["status"], "success")
        self.assertEqual(per_view[0].extraction.raw["smart_description"]["unsupported_claims"], ["zipper compartment not visible"])

    def test_run_gemini_for_views_parallel_isolates_timeouts(self):
        def fake_analyze_pp2_view(evidence_json, crop_image=None):
            label = evidence_json.get("canonical_label")
            if label == "Wallet":
                time.sleep(1.2)
                return {"status": "accepted", "pp2_view_status": "success", "final_description": "late"}
            return {
                "status": "accepted",
                "pp2_view_status": "success",
                "final_description": "fast",
                "detailed_description": "A helmet with white writing.",
                "category_details": {"features": ["white writing"], "defects": [], "attachments": []},
            }

        self.gemini.analyze_pp2_view.side_effect = fake_analyze_pp2_view

        per_view = [
            PP2PerViewResult(
                view_index=0,
                filename="view0.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Wallet", confidence=0.95),
                extraction=PP2PerViewExtraction(
                    caption="front",
                    detailed_description="A brown wallet.",
                    ocr_text="BRANDX",
                    grounded_features={"color": "brown", "features": ["logo"]},
                    extraction_confidence=1.0,
                    raw={"color_vqa": "brown"},
                ),
                embedding=PP2PerViewEmbedding(dim=16, vector_preview=[0.1] * 8, vector_id="vec0"),
                quality_score=0.99,
            ),
            PP2PerViewResult(
                view_index=1,
                filename="view1.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Helmet", confidence=0.95),
                extraction=PP2PerViewExtraction(
                    caption="helmet",
                    detailed_description="A black helmet.",
                    ocr_text="ACTIVE",
                    grounded_features={"color": "black", "features": ["logo"]},
                    extraction_confidence=1.0,
                    raw={"color_vqa": "black"},
                ),
                embedding=PP2PerViewEmbedding(dim=16, vector_preview=[0.1] * 8, vector_id="vec1"),
                quality_score=0.97,
            ),
        ]

        outputs = self.pipeline._run_gemini_for_views_parallel(
            indices=[0, 1],
            per_view_results=per_view,
            crop_by_index={
                0: Image.new("RGB", (8, 8), color="brown"),
                1: Image.new("RGB", (8, 8), color="black"),
            },
            canonical_label_by_index={0: "Wallet", 1: "Helmet"},
            timeout_s=1,
            request_id="req-timeout",
            item_id="item-timeout",
        )

        self.assertEqual(outputs[0]["status"], "timeout")
        self.assertEqual(outputs[1]["status"], "success")
        self.assertEqual(outputs[1]["final_description"], "fast")

    def test_pp2_timing_log_includes_reasoner_breakdown(self):
        with self.assertLogs("app.services.pp2_multiview_pipeline", level="INFO") as captured:
            self.pipeline._log_pp2_timing_summary(
                request_id="req-log",
                item_id="item-log",
                total_ms=987.65,
                per_view_ms=[100.0, 140.0],
                verify_ms=80.0,
                florence_stage1_total_ms=240.0,
                florence_detail_ms=75.0,
                storage_ms=25.0,
                early_exit_pair=None,
                profile="balanced",
                gemini_enabled=True,
                reasoner_view_outputs={
                    0: {"elapsed_ms": 110.5},
                    1: {
                        "elapsed_ms": 90.0,
                        "reasoning_meta": {"provider": "gemini", "selected_model": "gemini-2.5-flash"},
                    },
                },
                phase2_result={
                    "status": "accepted",
                    "elapsed_ms": 45.25,
                    "reasoning_meta": {"provider": "gemini", "selected_model": "gemini-2.5-flash"},
                },
            )

        timing_lines = [line for line in captured.output if "PP2_TIMING" in line]
        self.assertEqual(len(timing_lines), 1)
        timing_line = timing_lines[0]
        self.assertIn("florence_stage1_total_ms=240.00", timing_line)
        self.assertIn("florence_detail_ms=75.00", timing_line)
        self.assertIn("reasoner_label=gemini-2.5-flash", timing_line)
        self.assertIn("reasoner_view_total_ms=200.50", timing_line)
        self.assertIn("reasoner_view_avg_ms=100.25", timing_line)
        self.assertIn("reasoner_phase2_ms=45.25", timing_line)
        self.assertIn("reasoner_total_ms=245.75", timing_line)

    def test_phase2_apply_persists_reasoning_meta(self):
        fused = SimpleNamespace(
            category="Helmet",
            caption="A black helmet.",
            detailed_description="A black helmet with a clear visor.",
            detailed_description_source="best_view_evidence_composer",
            description_word_count={"final_description": 4, "detailed_description": 7},
            description_evidence_used={"summary": ["pp2"], "detailed": ["pp2"]},
            description_filters_applied=["pp2"],
            merged_ocr_tokens=["ACTIVE", "GENERATION"],
            attributes={"features": ["clear visor", "white writing"], "attachments": ["chin strap"]},
            defects=["surface scratches"],
            color="black",
        )

        applied = self.pipeline._apply_phase2_gemini_result_to_fused(
            fused=fused,
            phase2_result={
                "status": "accepted",
                "final_description": (
                    "A black helmet with a clear visor and white writing on the shell. "
                    "The chin strap is visible on one side and the chin vent is clearly defined. "
                    "Surface scratches are visible near the lower edge. "
                    'Visible text includes "ACTIVE". The rear shell also shows minor scuffing near the lower rim.'
                ),
                "color": "black",
                "reasoning_meta": {
                    "selected_model": "gemini-2.5-flash",
                    "failover_reason": "quota_limit",
                    "model_attempts": [
                        {"model": "models/gemini-3.1-flash-lite-preview", "status": "quota_error"},
                        {"model": "gemini-2.5-flash", "status": "success"},
                    ],
                },
            },
            timeout_s=4,
        )

        self.assertTrue(applied)
        self.assertEqual(fused.attributes["phase2_gemini_reasoning"]["selected_model"], "gemini-2.5-flash")

    def test_phase2_timeout_falls_back_to_native_pp2_details(self):
        fused = SimpleNamespace(
            detailed_description="PP2 native helmet description.",
            detailed_description_source="best_view_evidence_composer",
            description_word_count={"final_description": 4, "detailed_description": 4},
            description_evidence_used={"summary": ["pp2"], "detailed": ["pp2"]},
            description_filters_applied=["pp2"],
            merged_ocr_tokens=["ACTIVE", "GENERATION"],
            attributes={"features": ["clear visor"], "attachments": ["chin strap"]},
            defects=["surface scratches"],
            color="black",
        )

        applied = self.pipeline._apply_phase2_gemini_result_to_fused(
            fused=fused,
            phase2_result={"status": "timeout"},
            timeout_s=4,
        )

        self.assertFalse(applied)
        self.assertEqual(fused.detailed_description, "PP2 native helmet description.")
        self.assertEqual(fused.detailed_description_source, "best_view_evidence_composer")
        self.assertEqual(fused.attributes["phase2_gemini"]["status"], "timeout")
        self.assertEqual(fused.attributes["phase2_gemini"]["fallback"], "pp2_native_fused")

    def test_phase2_no_change_keeps_native_pp2_details(self):
        fused = SimpleNamespace(
            category="Helmet",
            caption="A black helmet.",
            detailed_description=(
                "A black helmet with a clear visor. Visible features include white writing and chin strap. "
                "Visible defects include surface scratches."
            ),
            detailed_description_source="best_view_evidence_composer",
            description_word_count={"final_description": 18, "detailed_description": 18},
            description_evidence_used={"summary": ["pp2"], "detailed": ["pp2"]},
            description_filters_applied=["pp2"],
            merged_ocr_tokens=["ACTIVE", "GENERATION"],
            attributes={"features": ["clear visor", "white writing"], "attachments": ["chin strap"]},
            defects=["surface scratches"],
            color="black",
        )

        applied = self.pipeline._apply_phase2_gemini_result_to_fused(
            fused=fused,
            phase2_result={
                "status": "accepted",
                "final_description": "A black helmet.",
                "color": "black",
            },
            timeout_s=4,
        )

        self.assertFalse(applied)
        self.assertIn("clear visor", fused.detailed_description.lower())
        self.assertEqual(fused.attributes["phase2_gemini"]["status"], "below_min_words")
        self.assertEqual(fused.attributes["phase2_gemini"]["fallback"], "pp2_native_fused")

    def test_phase2_too_short_rejected_by_min_word_gate(self):
        fused = SimpleNamespace(
            category="Helmet",
            caption="A black helmet.",
            detailed_description=(
                "A black helmet with a clear visor. Visible features include white writing and chin strap. "
                "Visible defects include surface scratches."
            ),
            detailed_description_source="best_view_evidence_composer",
            description_word_count={"final_description": 4, "detailed_description": 18},
            description_evidence_used={"summary": ["pp2"], "detailed": ["pp2"]},
            description_filters_applied=["pp2"],
            merged_ocr_tokens=["ACTIVE", "GENERATION"],
            attributes={"features": ["clear visor", "white writing"], "attachments": ["chin strap"]},
            defects=["surface scratches"],
            color="black",
        )

        applied = self.pipeline._apply_phase2_gemini_result_to_fused(
            fused=fused,
            phase2_result={
                "status": "accepted",
                "final_description": "A black helmet with visor.",
                "color": "black",
            },
            timeout_s=4,
        )

        self.assertFalse(applied)
        self.assertEqual(fused.attributes["phase2_gemini"]["status"], "below_min_words")

    def test_phase2_shorter_fact_rich_description_can_replace_generic_native_fusion(self):
        fused = SimpleNamespace(
            category="Helmet",
            caption="A black helmet.",
            detailed_description="A black helmet.",
            detailed_description_source="best_view_evidence_composer",
            description_word_count={"final_description": 4, "detailed_description": 3},
            description_evidence_used={"summary": ["pp2"], "detailed": ["pp2"]},
            description_filters_applied=["pp2"],
            merged_ocr_tokens=["CS", "832", "CAMY", "SMART"],
            attributes={"features": ["clear visor", "red and white logo"], "attachments": ["chin strap"]},
            defects=["visor scratch"],
            color="black",
        )

        applied = self.pipeline._apply_phase2_gemini_result_to_fused(
            fused=fused,
            phase2_result={
                "status": "accepted",
                "final_description": (
                    'A black helmet with a clear visor, chin strap, and red and white logo. '
                    'Visible text includes "832". The visor has visible scratch marks.'
                ),
                "color": "black",
            },
            timeout_s=4,
        )

        self.assertTrue(applied)
        self.assertIn("832", fused.detailed_description)
        self.assertIn("visor", fused.detailed_description.lower())
        self.assertEqual(fused.attributes["phase2_gemini"]["status"], "accepted")

    def test_phase2_rejects_unsupported_claims(self):
        fused = SimpleNamespace(
            category="Wallet",
            caption="A brown wallet.",
            detailed_description="A brown wallet with a visible logo and wrist strap.",
            detailed_description_source="best_view_evidence_composer",
            description_word_count={"final_description": 4, "detailed_description": 10},
            description_evidence_used={"summary": ["pp2"], "detailed": ["pp2"]},
            description_filters_applied=["pp2"],
            merged_ocr_tokens=["BRANDX"],
            attributes={"features": ["logo"], "attachments": ["wrist strap"]},
            defects=[],
            color="brown",
        )

        applied = self.pipeline._apply_phase2_gemini_result_to_fused(
            fused=fused,
            phase2_result={
                "status": "accepted",
                "final_description": (
                    'A brown wallet with a visible logo and a wrist strap on one side. '
                    'It has a zipper compartment and hidden cards that are not actually visible in the verified views. '
                    'Visible text includes "BRANDX".'
                ),
                "color": "brown",
            },
            timeout_s=4,
        )

        self.assertTrue(applied)
        self.assertEqual(fused.attributes["phase2_gemini"]["status"], "accepted")
        self.assertNotIn("zipper compartment", fused.detailed_description.lower())
        self.assertIn("wrist strap", fused.detailed_description.lower())

    def test_phase2_equal_fact_coverage_can_win_with_modestly_richer_grounded_detail(self):
        fused = SimpleNamespace(
            category="Helmet",
            caption="A black helmet.",
            detailed_description="A black helmet with a clear visor.",
            detailed_description_source="best_view_evidence_composer",
            description_word_count={"final_description": 7, "detailed_description": 7},
            description_evidence_used={"summary": ["pp2"], "detailed": ["pp2"]},
            description_filters_applied=["pp2"],
            merged_ocr_tokens=["ACTIVE", "GENERATION"],
            attributes={"features": ["clear visor"], "attachments": ["chin strap"]},
            defects=["surface scratches"],
            color="black",
        )

        applied = self.pipeline._apply_phase2_gemini_result_to_fused(
            fused=fused,
            phase2_result={
                "status": "accepted",
                "final_description": (
                    "A black helmet with a clear visor and white writing on the shell. "
                    "The chin strap is visible on one side and the chin vent is clearly defined. "
                    "Surface scratches are visible near the lower edge. "
                    'Visible text includes "ACTIVE". The rear shell also shows minor scuffing near the lower rim.'
                ),
                "color": "black",
            },
            timeout_s=4,
        )

        self.assertTrue(applied)
        self.assertIn("chin strap", fused.detailed_description.lower())
        self.assertEqual(fused.attributes["phase2_gemini"]["status"], "accepted")
        self.assertEqual(fused.description_word_count["final_description"], len(fused.caption.split()))

    def test_phase2_apply_dedupes_near_duplicate_identity_sentences(self):
        fused = SimpleNamespace(
            category="Helmet",
            caption="A black helmet.",
            detailed_description="A black helmet.",
            detailed_description_source="best_view_evidence_composer",
            description_word_count={"final_description": 4, "detailed_description": 3},
            description_evidence_used={"summary": ["pp2"], "detailed": ["pp2"]},
            description_filters_applied=["pp2"],
            merged_ocr_tokens=[],
            attributes={"features": ["clear visor", "chin strap"], "attachments": [], "defects": []},
            defects=["surface scratches"],
            color="black",
        )

        applied = self.pipeline._apply_phase2_gemini_result_to_fused(
            fused=fused,
            phase2_result={
                "status": "accepted",
                "final_description": (
                    "A black helmet with a clear visor. "
                    "A black helmet with a chin strap. "
                    "A black helmet with surface scratches."
                ),
                "color": "black",
            },
            timeout_s=4,
        )

        self.assertTrue(applied)
        self.assertEqual(fused.detailed_description.lower().count("a black helmet"), 1)
        self.assertIn("clear visor", fused.detailed_description.lower())
        self.assertIn("chin strap", fused.detailed_description.lower())
        self.assertIn("surface scratches", fused.detailed_description.lower())

class TestMultiViewFusionAllViewDescriptions(unittest.TestCase):
    def setUp(self):
        self.fusion = MultiViewFusionService()

    def test_fuse_uses_all_view_descriptions_without_leaking_sensitive_wallet_text(self):
        per_view = [
            PP2PerViewResult(
                view_index=0,
                filename="front.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Wallet", confidence=0.96),
                extraction=PP2PerViewExtraction(
                    caption="wallet front",
                    detailed_description="A brown wallet with a visible front logo and edge wear.",
                    ocr_text="BRANDX",
                    grounded_features={"color": "brown", "features": ["front logo"], "defects": ["edge wear"]},
                    extraction_confidence=1.0,
                    raw={
                        "smart_description": {
                            "status": "success",
                            "detailed_description": "A brown wallet with a visible front logo and edge wear.",
                            "final_description": "A brown wallet with a visible front logo.",
                        }
                    },
                ),
                embedding=PP2PerViewEmbedding(dim=4, vector_preview=[0.1, 0.2, 0.3, 0.4], vector_id="vec0"),
                quality_score=0.99,
            ),
            PP2PerViewResult(
                view_index=1,
                filename="inside.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Wallet", confidence=0.95),
                extraction=PP2PerViewExtraction(
                    caption="wallet inside",
                    detailed_description='A brown wallet with multiple card slots inside. Visible text includes "123456".',
                    ocr_text="123456",
                    grounded_features={"color": "brown", "features": ["card slots"]},
                    extraction_confidence=1.0,
                    raw={
                        "smart_description": {
                            "status": "success",
                            "detailed_description": 'A brown wallet with multiple card slots inside. Visible text includes "123456".',
                            "final_description": "A brown wallet with multiple card slots inside.",
                        }
                    },
                ),
                embedding=PP2PerViewEmbedding(dim=4, vector_preview=[0.1, 0.2, 0.3, 0.4], vector_id="vec1"),
                quality_score=0.97,
            ),
        ]

        fused = self.fusion.fuse(
            per_view=per_view,
            vectors=[np.ones(4, dtype=np.float32), np.ones(4, dtype=np.float32)],
            item_id="wallet-1",
            used_view_indices=[0, 1],
        )

        self.assertEqual(fused.detailed_description_source, "all_view_evidence_composer")
        self.assertIn("front logo", fused.detailed_description.lower())
        self.assertIn("card slots", fused.detailed_description.lower())
        self.assertNotIn("123456", fused.detailed_description)
        self.assertEqual(fused.attributes["description_contributor_view_indices"], [0, 1])

    def test_fuse_unifies_repeated_identity_sentences_from_multiple_views(self):
        per_view = [
            PP2PerViewResult(
                view_index=0,
                filename="front.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Wallet", confidence=0.96),
                extraction=PP2PerViewExtraction(
                    caption="wallet front",
                    detailed_description="A brown wallet with a visible front logo.",
                    ocr_text="BRANDX",
                    grounded_features={"color": "brown", "features": ["front logo"]},
                    extraction_confidence=1.0,
                    raw={"smart_description": {"status": "success", "detailed_description": "A brown wallet with a visible front logo."}},
                ),
                embedding=PP2PerViewEmbedding(dim=4, vector_preview=[0.1, 0.2, 0.3, 0.4], vector_id="vec0"),
                quality_score=0.99,
            ),
            PP2PerViewResult(
                view_index=1,
                filename="inside.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Wallet", confidence=0.95),
                extraction=PP2PerViewExtraction(
                    caption="wallet inside",
                    detailed_description="A brown wallet with multiple card slots.",
                    ocr_text="",
                    grounded_features={"color": "brown", "features": ["card slots"]},
                    extraction_confidence=1.0,
                    raw={"smart_description": {"status": "success", "detailed_description": "A brown wallet with multiple card slots."}},
                ),
                embedding=PP2PerViewEmbedding(dim=4, vector_preview=[0.1, 0.2, 0.3, 0.4], vector_id="vec1"),
                quality_score=0.97,
            ),
            PP2PerViewResult(
                view_index=2,
                filename="edge.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Wallet", confidence=0.94),
                extraction=PP2PerViewExtraction(
                    caption="wallet edge",
                    detailed_description="A brown wallet with edge wear.",
                    ocr_text="",
                    grounded_features={"color": "brown", "defects": ["edge wear"]},
                    extraction_confidence=1.0,
                    raw={"smart_description": {"status": "success", "detailed_description": "A brown wallet with edge wear."}},
                ),
                embedding=PP2PerViewEmbedding(dim=4, vector_preview=[0.1, 0.2, 0.3, 0.4], vector_id="vec2"),
                quality_score=0.96,
            ),
        ]

        fused = self.fusion.fuse(
            per_view=per_view,
            vectors=[np.ones(4, dtype=np.float32), np.ones(4, dtype=np.float32), np.ones(4, dtype=np.float32)],
            item_id="wallet-duplicate",
            used_view_indices=[0, 1, 2],
        )

        self.assertEqual(fused.detailed_description.lower().count("a brown wallet"), 1)
        self.assertIn("front logo", fused.detailed_description.lower())
        self.assertIn("card slots", fused.detailed_description.lower())
        self.assertIn("edge wear", fused.detailed_description.lower())

    def test_fuse_falls_back_when_only_one_public_view_description_survives(self):
        per_view = [
            PP2PerViewResult(
                view_index=0,
                filename="front.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Wallet", confidence=0.96),
                extraction=PP2PerViewExtraction(
                    caption="wallet front",
                    detailed_description="A brown wallet with a front logo.",
                    ocr_text="BRANDX",
                    grounded_features={"color": "brown", "features": ["front logo"]},
                    extraction_confidence=1.0,
                    raw={"smart_description": {"status": "success", "detailed_description": "A brown wallet with a front logo."}},
                ),
                embedding=PP2PerViewEmbedding(dim=4, vector_preview=[0.1, 0.2, 0.3, 0.4], vector_id="vec0"),
                quality_score=0.99,
            ),
            PP2PerViewResult(
                view_index=1,
                filename="inside.jpg",
                detection=PP2PerViewDetection(bbox=(0.0, 0.0, 10.0, 10.0), cls_name="Wallet", confidence=0.95),
                extraction=PP2PerViewExtraction(
                    caption="wallet inside",
                    detailed_description='Visible text includes "999999".',
                    ocr_text="999999",
                    grounded_features={"color": "brown", "features": ["card slots"]},
                    extraction_confidence=1.0,
                    raw={"smart_description": {"status": "success", "detailed_description": 'Visible text includes "999999".'}},
                ),
                embedding=PP2PerViewEmbedding(dim=4, vector_preview=[0.1, 0.2, 0.3, 0.4], vector_id="vec1"),
                quality_score=0.97,
            ),
        ]

        fused = self.fusion.fuse(
            per_view=per_view,
            vectors=[np.ones(4, dtype=np.float32), np.ones(4, dtype=np.float32)],
            item_id="wallet-2",
            used_view_indices=[0, 1],
        )

        self.assertEqual(fused.detailed_description_source, "best_view_evidence_composer")
        self.assertIn("front logo", fused.detailed_description.lower())
        self.assertNotIn("999999", fused.detailed_description)


class TestGeminiReasonerPhase2ResponseNormalization(unittest.TestCase):
    def test_phase2_prompt_requires_one_unified_description(self):
        self.assertIn("single unified item description", PHASE2_PP2_SYSTEM_INSTRUCTION.lower())
        self.assertIn("do not repeat", PHASE2_PP2_SYSTEM_INSTRUCTION.lower())

    def test_normalize_phase2_response_coerces_schema_fields(self):
        normalized = GeminiReasoner.normalize_phase2_response(
            {
                "status": "accepted",
                "message": "ok",
                "label": "Wallet",
                "color": "brown",
                "final_description": (
                    'A brown wallet with a visible logo. It also includes a strap attached. '
                    'Visible wear includes edge wear. Visible text includes "BRANDX".'
                ),
                "category_details": {
                    "features": ["logo", None],
                    "defects": ["edge wear"],
                    "attachments": ["strap attached"],
                },
                "key_count": None,
                "tags": ["wallet", 123],
                "evidence_used": {
                    "color_source": "florence_vqa_color",
                    "feature_sources": ["grounded_features"],
                    "defect_sources": ["grounded_defects"],
                    "attachment_sources": ["grounded_attachments"],
                    "ocr_source": "ocr_text",
                },
            }
        )

        self.assertEqual(normalized["status"], "accepted")
        self.assertEqual(normalized["category_details"]["features"], ["logo"])
        self.assertEqual(normalized["tags"], ["wallet", "123"])

    def test_normalize_phase2_response_rejects_non_object_payload(self):
        normalized = GeminiReasoner.normalize_phase2_response(["bad"])
        self.assertEqual(normalized["status"], "rejected")
        self.assertIsNone(normalized["final_description"])

    def test_normalize_phase1_response_coerces_schema_fields(self):
        normalized = GeminiReasoner.normalize_phase1_response(
            {
                "status": "accepted",
                "label": "Wallet",
                "color": "brown",
                "final_description": "A brown wallet with a logo.",
                "detailed_description": "A brown wallet with a visible logo and edge wear.",
                "category_details": {
                    "features": ["logo", None],
                    "defects": ["edge wear"],
                    "attachments": ["wrist strap"],
                },
                "key_count": None,
                "evidence_used": {
                    "caption": ["wallet"],
                    "ocr": ["BRANDX"],
                    "grounding": ["logo"],
                    "color": ["florence_vqa_color"],
                    "key_count": [],
                },
                "unsupported_claims": ["coin pouch not visible"],
                "label_change_reason": None,
            },
            fallback_label="Wallet",
            fallback_color="brown",
        )

        self.assertEqual(normalized["status"], "accepted")
        self.assertEqual(normalized["category_details"]["features"], ["logo"])
        self.assertEqual(normalized["evidence_used"]["ocr"], ["BRANDX"])
        self.assertEqual(normalized["unsupported_claims"], ["coin pouch not visible"])

    def test_model_validation_raises_when_model_unavailable(self):
        reasoner = GeminiReasoner(model_name="models/gemini-3.1-flash-lite-preview")

        class FakeError(Exception):
            def __init__(self):
                super().__init__("404 NOT_FOUND")
                self.status_code = 404

        reasoner._client = SimpleNamespace(
            models=SimpleNamespace(
                get=lambda model=None: (_ for _ in ()).throw(FakeError())
            )
        )

        with self.assertRaises(GeminiFatalError):
            reasoner._ensure_model_available("models/gemini-3.1-flash-lite-preview")

    def test_pp2_generate_config_uses_thinking_level_for_gemini3(self):
        reasoner = GeminiReasoner(pp2_model_name="models/gemini-3.1-flash-lite-preview")
        original_google = sys.modules.get("google")
        original_google_genai = sys.modules.get("google.genai")
        fake_types = SimpleNamespace(
            ThinkingConfig=lambda **kwargs: SimpleNamespace(**kwargs),
            GenerateContentConfig=lambda **kwargs: SimpleNamespace(**kwargs),
        )
        sys.modules["google"] = SimpleNamespace(genai=SimpleNamespace(types=fake_types))
        sys.modules["google.genai"] = SimpleNamespace(types=fake_types)
        try:
            config = reasoner._build_pp2_generate_config()
        finally:
            if original_google is None:
                del sys.modules["google"]
            else:
                sys.modules["google"] = original_google
            if original_google_genai is None:
                del sys.modules["google.genai"]
            else:
                sys.modules["google.genai"] = original_google_genai

        self.assertEqual(getattr(config.thinkingConfig, "thinkingLevel", None), "medium")
        self.assertIsNone(getattr(config.thinkingConfig, "thinkingBudget", None))
        self.assertEqual(getattr(config, "response_mime_type", None), "application/json")
        self.assertEqual(getattr(config, "response_json_schema", None), PHASE2_PP2_RESPONSE_SCHEMA)
        self.assertIsNone(getattr(config, "responseSchema", None))

    def test_pp2_generate_config_uses_thinking_budget_for_non_gemini3(self):
        reasoner = GeminiReasoner(pp2_model_name="gemini-2.5-flash")
        original_google = sys.modules.get("google")
        original_google_genai = sys.modules.get("google.genai")
        fake_types = SimpleNamespace(
            ThinkingConfig=lambda **kwargs: SimpleNamespace(**kwargs),
            GenerateContentConfig=lambda **kwargs: SimpleNamespace(**kwargs),
        )
        sys.modules["google"] = SimpleNamespace(genai=SimpleNamespace(types=fake_types))
        sys.modules["google.genai"] = SimpleNamespace(types=fake_types)
        try:
            config = reasoner._build_pp2_generate_config()
        finally:
            if original_google is None:
                del sys.modules["google"]
            else:
                sys.modules["google"] = original_google
            if original_google_genai is None:
                del sys.modules["google.genai"]
            else:
                sys.modules["google.genai"] = original_google_genai

        self.assertEqual(getattr(config.thinkingConfig, "thinkingBudget", None), 256)
        self.assertIsNone(getattr(config.thinkingConfig, "thinkingLevel", None))
        self.assertEqual(getattr(config, "response_mime_type", None), "application/json")
        self.assertEqual(getattr(config, "response_json_schema", None), PHASE2_PP2_RESPONSE_SCHEMA)
        self.assertIsNone(getattr(config, "responseSchema", None))

    def test_pp1_generate_config_uses_response_json_schema(self):
        reasoner = GeminiReasoner(model_name="models/gemini-3.1-flash-lite-preview")
        original_google = sys.modules.get("google")
        original_google_genai = sys.modules.get("google.genai")
        fake_types = SimpleNamespace(
            ThinkingConfig=lambda **kwargs: SimpleNamespace(**kwargs),
            GenerateContentConfig=lambda **kwargs: SimpleNamespace(**kwargs),
        )
        sys.modules["google"] = SimpleNamespace(genai=SimpleNamespace(types=fake_types))
        sys.modules["google.genai"] = SimpleNamespace(types=fake_types)
        try:
            config = reasoner._build_pp1_generate_config()
        finally:
            if original_google is None:
                del sys.modules["google"]
            else:
                sys.modules["google"] = original_google
            if original_google_genai is None:
                del sys.modules["google.genai"]
            else:
                sys.modules["google.genai"] = original_google_genai

        self.assertEqual(getattr(config.thinkingConfig, "thinkingLevel", None), "low")
        self.assertEqual(getattr(config, "response_mime_type", None), "application/json")
        self.assertEqual(getattr(config, "response_json_schema", None), PHASE1_PP1_RESPONSE_SCHEMA)
        self.assertIsNone(getattr(config, "responseSchema", None))

    def test_pp1_config_serializes_with_response_json_schema(self):
        from google.genai import models

        reasoner = GeminiReasoner(model_name="models/gemini-3.1-flash-lite-preview")
        config = reasoner._build_pp1_generate_config()
        payload = models._GenerateContentConfig_to_mldev(None, config)

        self.assertEqual(payload["responseMimeType"], "application/json")
        self.assertIn("responseJsonSchema", payload)
        self.assertNotIn("responseSchema", payload)

    def test_pp2_config_serializes_with_response_json_schema(self):
        from google.genai import models

        reasoner = GeminiReasoner(pp2_model_name="models/gemini-3.1-flash-lite-preview")
        config = reasoner._build_pp2_generate_config()
        payload = models._GenerateContentConfig_to_mldev(None, config)

        self.assertEqual(payload["responseMimeType"], "application/json")
        self.assertIn("responseJsonSchema", payload)
        self.assertNotIn("responseSchema", payload)

    def test_quota_error_retries_on_fallback_model(self):
        reasoner = GeminiReasoner(model_name="models/gemini-3.1-flash-lite-preview")
        calls = []

        def fake_generate_text_once(prompt, images=None, config=None, model_name=None, image_first=False):
            calls.append(model_name)
            if model_name == "models/gemini-3.1-flash-lite-preview":
                raise GeminiQuotaError("quota", status_code=429, provider_status="RESOURCE_EXHAUSTED")
            return '{"status":"accepted"}'

        reasoner._generate_text_once = fake_generate_text_once
        text = reasoner._generate_text(
            "prompt",
            model_name="models/gemini-3.1-flash-lite-preview",
            fallback_model_name="gemini-2.5-flash",
        )
        meta = reasoner.consume_last_request_meta()

        self.assertEqual(text, '{"status":"accepted"}')
        self.assertEqual(calls, ["models/gemini-3.1-flash-lite-preview", "gemini-2.5-flash"])
        self.assertEqual(meta["selected_model"], "gemini-2.5-flash")
        self.assertEqual(meta["failover_reason"], "quota_limit")

    def test_unavailable_transient_fails_over_to_fallback_model(self):
        reasoner = GeminiReasoner(model_name="models/gemini-3.1-flash-lite-preview")
        calls = []

        def fake_generate_text_once(prompt, images=None, config=None, model_name=None, image_first=False):
            calls.append(model_name)
            if model_name == "models/gemini-3.1-flash-lite-preview":
                raise GeminiTransientError("temporary", status_code=503, provider_status="UNAVAILABLE")
            return '{"status":"accepted"}'

        reasoner._generate_text_once = fake_generate_text_once

        text = reasoner._generate_text(
            "prompt",
            model_name="models/gemini-3.1-flash-lite-preview",
            fallback_model_name="gemini-2.5-flash",
        )
        meta = reasoner.consume_last_request_meta()

        self.assertEqual(text, '{"status":"accepted"}')
        self.assertEqual(calls, ["models/gemini-3.1-flash-lite-preview", "gemini-2.5-flash"])
        self.assertEqual(meta["selected_model"], "gemini-2.5-flash")
        self.assertEqual(meta["failover_reason"], "transient_unavailable")

    def test_quota_error_with_unavailable_fallback_preserves_attempt_metadata(self):
        reasoner = GeminiReasoner(model_name="models/gemini-3.1-flash-lite-preview")

        def fake_generate_text_once(prompt, images=None, config=None, model_name=None, image_first=False):
            if model_name == "models/gemini-3.1-flash-lite-preview":
                raise GeminiQuotaError("quota", status_code=429, provider_status="RESOURCE_EXHAUSTED")
            raise GeminiFatalError("fallback unavailable", status_code=404, provider_status="NOT_FOUND")

        reasoner._generate_text_once = fake_generate_text_once

        with self.assertRaises(GeminiFatalError):
            reasoner._generate_text(
                "prompt",
                model_name="models/gemini-3.1-flash-lite-preview",
                fallback_model_name="gemini-2.5-flash",
            )

        meta = reasoner.consume_last_request_meta()
        self.assertEqual(meta["failover_reason"], "quota_limit")
        self.assertEqual(meta["model_attempts"][0]["status"], "quota_error")
        self.assertEqual(meta["model_attempts"][-1]["status"], "fatal_error")


class TestUnifiedPipelineDescriptionValidation(unittest.TestCase):
    def test_pp1_validation_strips_scene_and_unsupported_ocr_claims(self):
        validated = UnifiedPipeline._validate_description_with_evidence(
            candidate=(
                'A brown wallet with a logo. It is sitting on a wooden table. '
                'Visible text includes "BRANDX". Visible text includes "FAKE123".'
            ),
            label="Wallet",
            color="brown",
            category_details={"features": ["logo"], "defects": [], "attachments": []},
            key_count=None,
            ocr_text="BRANDX",
        )

        self.assertIn("A brown wallet with a logo.", validated["description"])
        self.assertIn('"BRANDX"', validated["description"])
        self.assertNotIn("wooden table", validated["description"])
        self.assertNotIn("FAKE123", validated["description"])


class TestHintScoringNegativeKeywords(unittest.TestCase):
    """Tests for the negative-keyword penalty in _infer_canonical_hint_with_signals."""

    def setUp(self):
        self.pipeline = MultiViewPipeline(
            yolo=MagicMock(),
            florence=MagicMock(),
            dino=MagicMock(),
            verifier=MagicMock(),
            fusion=MagicMock(),
            faiss=MagicMock(),
        )

    def test_helmet_beats_smartphone_with_hallucinated_features(self):
        """Exact scenario from the bug: caption says 'helmet', OCR says 'HELMET',
        but grounding hallucinates smartphone features (camera, home button, screen).
        With negative keywords + reduced feature weight, Helmet should win."""
        hint, signals = self.pipeline._infer_canonical_hint_with_signals(
            caption="The helmet has a screw attached on the right side and surface scratches",
            ocr_text="H.H.CO . HELMET . 2024 . SAFETY FIRST",
            grounded_features={
                "features": ["camera module", "home button"],
                "defects": ["screen scratches"],
            },
        )
        self.assertEqual(hint, "Helmet")
        self.assertTrue(signals["caption_hit"])
        self.assertTrue(signals["ocr_hit"])

    def test_smartphone_negative_penalty_from_helmet_caption(self):
        """When caption contains 'helmet', Smart Phone score gets penalized via
        its negative keyword list (which now includes 'helmet')."""
        hint, signals = self.pipeline._infer_canonical_hint_with_signals(
            caption="a blue helmet on a table",
            ocr_text="",
            grounded_features={},
        )
        # 'helmet' in caption → Helmet gets +1, Smart Phone gets negative penalty
        self.assertEqual(hint, "Helmet")

    def test_smartphone_wins_when_evidence_is_genuine(self):
        """Smart Phone should still win when evidence genuinely points to a phone."""
        hint, signals = self.pipeline._infer_canonical_hint_with_signals(
            caption="a black smartphone with a cracked screen",
            ocr_text="SAMSUNG GALAXY",
            grounded_features={"features": ["camera module", "home button"]},
        )
        self.assertEqual(hint, "Smart Phone")
        self.assertTrue(signals["caption_hit"])

    def test_feature_weight_reduced(self):
        """Feature-only evidence should not overpower caption evidence
        because feature weight is now 1 (not 2)."""
        hint, _ = self.pipeline._infer_canonical_hint_with_signals(
            caption="a helmet on a shelf",
            ocr_text="",
            grounded_features={"features": ["camera module", "home button", "screen"]},
        )
        # caption: helmet=+1; features: phone-related keywords score at weight 1 each
        # But Smart Phone now has negative penalty from "helmet" in caption (-2)
        self.assertEqual(hint, "Helmet")

    def test_no_evidence_returns_none(self):
        """When there's no recognizable evidence, hint should be None."""
        hint, signals = self.pipeline._infer_canonical_hint_with_signals(
            caption="a random object on a desk",
            ocr_text="",
            grounded_features={},
        )
        self.assertIsNone(hint)
        self.assertFalse(signals["caption_hit"])

    def test_hard_hat_triggers_helmet_hint(self):
        """Caption 'hard hat' should produce a Helmet hint now that
        'hard hat' is in CATEGORY_KEYWORDS["Helmet"]."""
        hint, signals = self.pipeline._infer_canonical_hint_with_signals(
            caption="A blue hard hat with the name Allianz on it",
            ocr_text="",
            grounded_features={},
        )
        self.assertEqual(hint, "Helmet")
        self.assertTrue(signals["caption_hit"])

    def test_safety_helmet_triggers_helmet_hint(self):
        """'safety helmet' alias should also produce a Helmet hint."""
        hint, signals = self.pipeline._infer_canonical_hint_with_signals(
            caption="a yellow safety helmet on a table",
            ocr_text="",
            grounded_features={},
        )
        self.assertEqual(hint, "Helmet")

    def test_hat_negative_no_longer_blocks_hard_hat(self):
        """The generic 'hat' negative keyword was replaced with specific
        hat variants, so 'hard hat' should NOT receive a negative penalty."""
        hint, signals = self.pipeline._infer_canonical_hint_with_signals(
            caption="a blue hard hat on a shelf",
            ocr_text="HELMET SAFETY FIRST",
            grounded_features={},
        )
        self.assertEqual(hint, "Helmet")
        self.assertTrue(signals["ocr_hit"])


class TestHintStrongOverrideBroadened(unittest.TestCase):
    """Verify that hint_strong_override fires regardless of YOLO fallback strategy."""

    def setUp(self):
        self.pipeline = MultiViewPipeline(
            yolo=MagicMock(),
            florence=MagicMock(),
            dino=MagicMock(),
            verifier=MagicMock(),
            fusion=MagicMock(),
            faiss=MagicMock(),
        )

    def test_dual_signal_overrides_non_strict_majority(self):
        """When YOLO gives a non-strict-majority result but one view has
        both caption AND OCR for a different label, hint_strong_override
        should fire (previously required strict_majority)."""
        # 2 views: YOLO says Earbuds for view0, Smart Phone for view1
        per_view_detections = [
            [SimpleNamespace(label="Earbuds - Earbuds case", confidence=0.97)],
            [SimpleNamespace(label="Smart Phone", confidence=0.94)],
        ]
        # View 0 has Helmet hint with both caption and OCR signals
        canonical_hints = ["Helmet", None]
        hint_signals = [
            {"caption_hit": True, "ocr_hit": True, "feature_hit": False},
            {"caption_hit": False, "ocr_hit": False, "feature_hit": False},
        ]
        label, strategy, votes = self.pipeline._choose_consensus_label_with_hints(
            per_view_detections, canonical_hints, hint_signals,
        )
        self.assertEqual(label, "Helmet")
        self.assertEqual(strategy, "hint_strong_override")

    def test_dual_signal_overrides_strict_majority(self):
        """Original behaviour preserved: hint_strong_override still fires
        when YOLO has strict_majority."""
        per_view_detections = [
            [SimpleNamespace(label="Earbuds - Earbuds case", confidence=0.97)],
            [SimpleNamespace(label="Earbuds - Earbuds case", confidence=0.90)],
        ]
        canonical_hints = ["Helmet", None]
        hint_signals = [
            {"caption_hit": True, "ocr_hit": True, "feature_hit": False},
            {"caption_hit": False, "ocr_hit": False, "feature_hit": False},
        ]
        label, strategy, votes = self.pipeline._choose_consensus_label_with_hints(
            per_view_detections, canonical_hints, hint_signals,
        )
        self.assertEqual(label, "Helmet")
        self.assertEqual(strategy, "hint_strong_override")


class TestWeakTextEvidenceEmptyCaption(unittest.TestCase):
    """Fix 1: empty caption should always count as weak,
    regardless of OCR content."""

    def setUp(self):
        self.pipeline = MultiViewPipeline(
            yolo=MagicMock(),
            florence=MagicMock(),
            dino=MagicMock(),
            verifier=MagicMock(),
            fusion=MagicMock(),
            faiss=MagicMock(),
        )

    def test_empty_caption_rich_ocr_is_weak(self):
        """Empty caption + multi-char OCR (brand name) must be weak."""
        result = MultiViewPipeline._is_weak_text_evidence("", "Baeleberry")
        self.assertTrue(result)

    def test_empty_caption_empty_ocr_is_weak(self):
        result = MultiViewPipeline._is_weak_text_evidence("", "")
        self.assertTrue(result)

    def test_empty_caption_single_char_ocr_is_weak(self):
        result = MultiViewPipeline._is_weak_text_evidence("", "0")
        self.assertTrue(result)

    def test_nonempty_caption_rich_ocr_not_weak(self):
        """When caption has enough words AND OCR is rich, not weak."""
        result = MultiViewPipeline._is_weak_text_evidence(
            "A black leather wallet sitting on a table", "Baeleberry"
        )
        self.assertFalse(result)

    def test_short_caption_weak_ocr_still_weak(self):
        """Short caption (below threshold) + weak OCR = still weak."""
        result = MultiViewPipeline._is_weak_text_evidence("wallet", "")
        self.assertTrue(result)


class TestOCRSubstringFallback(unittest.TestCase):
    """Tests for the OCR substring fallback in _infer_canonical_hint_with_signals.
    When word-boundary regex fails (OCR concatenation), a plain substring
    check is used for keywords >= 3 chars."""

    def setUp(self):
        self.pipeline = MultiViewPipeline(
            yolo=MagicMock(),
            florence=MagicMock(),
            dino=MagicMock(),
            verifier=MagicMock(),
            fusion=MagicMock(),
            faiss=MagicMock(),
        )

    def test_student_id_from_concatenated_ocr(self):
        """OCR 'FutureSTUDENT IDDANANJAYA' has 'student id' concatenated —
        word boundary fails but substring fallback should match."""
        hint, signals = self.pipeline._infer_canonical_hint_with_signals(
            caption="",
            ocr_text="FutureSTUDENT IDDANANJAYA",
            grounded_features={},
        )
        self.assertEqual(hint, "Student ID")
        self.assertTrue(signals["ocr_hit"])

    def test_nic_from_concatenated_ocr(self):
        """OCR '00NIC No' has 'nic' concatenated with digits —
        substring fallback should match."""
        hint, signals = self.pipeline._infer_canonical_hint_with_signals(
            caption="",
            ocr_text="00NIC No",
            grounded_features={},
        )
        self.assertEqual(hint, "Student ID")
        self.assertTrue(signals["ocr_hit"])

    def test_identity_card_from_concatenated_ocr(self):
        """OCR 'NATIONAL IDENTITY CARDcoma' has concatenated 'card' —
        substring should still match 'identity card'."""
        hint, signals = self.pipeline._infer_canonical_hint_with_signals(
            caption="",
            ocr_text="NATIONAL IDENTITY CARDcoma",
            grounded_features={},
        )
        self.assertEqual(hint, "NIC / National ID Card")
        self.assertTrue(signals["ocr_hit"])

    def test_short_keyword_not_substring_matched(self):
        """Keywords shorter than 3 chars should NOT use substring fallback
        to avoid false positives."""
        # "id" is only 2 chars — should not trigger substring fallback
        hint, _ = self.pipeline._infer_canonical_hint_with_signals(
            caption="",
            ocr_text="ABIDEFG",
            grounded_features={},
        )
        # Should not match Student ID from "id" substring in "ABIDEFG"
        self.assertNotEqual(hint, "Student ID")

    def test_word_boundary_still_preferred(self):
        """When word-boundary regex matches, it should still work correctly."""
        hint, signals = self.pipeline._infer_canonical_hint_with_signals(
            caption="",
            ocr_text="STUDENT ID 2024",
            grounded_features={},
        )
        self.assertEqual(hint, "Student ID")
        self.assertTrue(signals["ocr_hit"])


class TestHintOverrideNoConsensus(unittest.TestCase):
    """Tests for hint_override firing when YOLO has no_consensus
    (all detections below confidence floor)."""

    def setUp(self):
        self.pipeline = MultiViewPipeline(
            yolo=MagicMock(),
            florence=MagicMock(),
            dino=MagicMock(),
            verifier=MagicMock(),
            fusion=MagicMock(),
            faiss=MagicMock(),
        )

    def test_hint_override_with_no_consensus(self):
        """When YOLO returns no viable detections (no_consensus) but
        Florence hints exist, hint_override should fire."""
        # Empty per_view_detections → _choose_consensus_label returns (None, "no_consensus")
        per_view_detections = [[], []]
        canonical_hints = ["Student ID", None]
        hint_signals = [
            {"caption_hit": True, "ocr_hit": False, "feature_hit": False},
            {"caption_hit": False, "ocr_hit": False, "feature_hit": False},
        ]
        label, strategy, votes = self.pipeline._choose_consensus_label_with_hints(
            per_view_detections, canonical_hints, hint_signals,
        )
        self.assertEqual(label, "Student ID")
        self.assertEqual(strategy, "hint_override")

    def test_hint_override_with_no_consensus_multiple_hints(self):
        """When both views have the same hint and no YOLO detections,
        hint_majority should fire (>= 2 votes)."""
        per_view_detections = [[], []]
        canonical_hints = ["Student ID", "Student ID"]
        hint_signals = [
            {"caption_hit": True, "ocr_hit": True, "feature_hit": False},
            {"caption_hit": True, "ocr_hit": True, "feature_hit": False},
        ]
        label, strategy, votes = self.pipeline._choose_consensus_label_with_hints(
            per_view_detections, canonical_hints, hint_signals,
        )
        self.assertEqual(label, "Student ID")
        self.assertEqual(strategy, "hint_majority")

    def test_coverage_conf_fallback_still_allows_override(self):
        """The existing coverage_conf_fallback hint_override path
        must still work after the change."""
        per_view_detections = [
            [SimpleNamespace(label="Wallet", confidence=0.50)],
            [SimpleNamespace(label="Smart Phone", confidence=0.45)],
        ]
        canonical_hints = ["Student ID", None]
        hint_signals = [
            {"caption_hit": True, "ocr_hit": False, "feature_hit": False},
            {"caption_hit": False, "ocr_hit": False, "feature_hit": False},
        ]
        label, strategy, votes = self.pipeline._choose_consensus_label_with_hints(
            per_view_detections, canonical_hints, hint_signals,
        )
        self.assertEqual(label, "Student ID")
        self.assertEqual(strategy, "hint_override")

    def test_strict_majority_blocks_single_hint_override(self):
        """When YOLO has strict_majority, a single hint without dual
        caption+ocr signals should NOT override (only hint_strong_override
        or hint_majority can override strict_majority)."""
        per_view_detections = [
            [SimpleNamespace(label="Wallet", confidence=0.90)],
            [SimpleNamespace(label="Wallet", confidence=0.85)],
        ]
        canonical_hints = ["Student ID", None]
        hint_signals = [
            {"caption_hit": True, "ocr_hit": False, "feature_hit": False},
            {"caption_hit": False, "ocr_hit": False, "feature_hit": False},
        ]
        label, strategy, votes = self.pipeline._choose_consensus_label_with_hints(
            per_view_detections, canonical_hints, hint_signals,
        )
        # Single caption-only hint should not override strict_majority
        self.assertEqual(label, "Wallet")
        self.assertEqual(strategy, "strict_majority")


class TestHintTiebreakWithYOLOMatch(unittest.TestCase):
    """Tests for hint_tiebreak when hint matches a YOLO detection."""

    def setUp(self):
        self.pipeline = MultiViewPipeline(
            yolo=MagicMock(),
            florence=MagicMock(),
            dino=MagicMock(),
            verifier=MagicMock(),
            fusion=MagicMock(),
            faiss=MagicMock(),
        )

    def test_hint_tiebreak_when_hint_in_yolo_detections(self):
        """When YOLO has no strict majority but the hint label appears
        among YOLO detections, hint_tiebreak should fire."""
        per_view_detections = [
            [SimpleNamespace(label="Helmet", confidence=0.60)],
            [SimpleNamespace(label="Smart Phone", confidence=0.70)],
        ]
        canonical_hints = ["Helmet", None]
        hint_signals = [
            {"caption_hit": True, "ocr_hit": False, "feature_hit": False},
            {"caption_hit": False, "ocr_hit": False, "feature_hit": False},
        ]
        label, strategy, votes = self.pipeline._choose_consensus_label_with_hints(
            per_view_detections, canonical_hints, hint_signals,
        )
        self.assertEqual(label, "Helmet")
        self.assertEqual(strategy, "hint_tiebreak")


class TestODCaptionAdoptedRefinement(unittest.TestCase):
    """When OD caption is adopted (original extraction had empty caption),
    _needs_pass_caption_refinement should still treat the view as weak
    so Stage 2 detail runs."""

    def setUp(self):
        self.pipeline = MultiViewPipeline(
            yolo=MagicMock(),
            florence=MagicMock(),
            dino=MagicMock(),
            verifier=MagicMock(),
            fusion=MagicMock(),
            faiss=MagicMock(),
        )

    @staticmethod
    def _make_view(caption: str, ocr: str, raw: dict = None) -> SimpleNamespace:
        extraction = SimpleNamespace(
            caption=caption,
            ocr_text=ocr,
            grounded_features={},
            raw=raw or {},
        )
        return SimpleNamespace(extraction=extraction)

    def test_od_adopted_view_treated_as_weak(self):
        """View with OD-adopted caption should be treated as weak
        even though the current caption is rich."""
        views = [
            self._make_view("", "", raw={}),  # View 0: genuinely empty
            self._make_view(
                "A black leather wallet sitting on a brown table",
                "Baeleberry",
                raw={"od_caption_adopted": True},
            ),  # View 1: rich caption but was adopted from OD
        ]
        result = self.pipeline._needs_pass_caption_refinement(views, [0, 1])
        self.assertTrue(result, "Both views should be considered weak — Stage 2 should run")

    def test_genuine_rich_caption_blocks_refinement(self):
        """View with genuine (non-adopted) rich caption should block refinement."""
        views = [
            self._make_view("", "", raw={}),
            self._make_view(
                "A black leather wallet sitting on a brown table",
                "Baeleberry",
                raw={},  # No od_caption_adopted flag
            ),
        ]
        result = self.pipeline._needs_pass_caption_refinement(views, [0, 1])
        self.assertFalse(result, "Genuine rich caption should block Stage 2")

    def test_all_od_adopted_triggers_refinement(self):
        """When ALL views have OD-adopted captions, refinement should trigger."""
        views = [
            self._make_view("A wallet on a desk", "Brand", raw={"od_caption_adopted": True}),
            self._make_view("A leather wallet", "Logo", raw={"od_caption_adopted": True}),
        ]
        result = self.pipeline._needs_pass_caption_refinement(views, [0, 1])
        self.assertTrue(result)

    def test_mixed_od_adopted_and_genuine_weak(self):
        """OD-adopted view + genuinely weak view → all weak → refinement triggers."""
        views = [
            self._make_view("wallet", "", raw={}),  # genuinely weak (short caption, no OCR)
            self._make_view("A big item on a table", "X", raw={"od_caption_adopted": True}),
        ]
        result = self.pipeline._needs_pass_caption_refinement(views, [0, 1])
        self.assertTrue(result)


class TestSmartPhoneFrontBackFailurePath(unittest.TestCase):
    def setUp(self):
        self.pipeline = MultiViewPipeline(
            yolo=MagicMock(),
            florence=MagicMock(),
            dino=MagicMock(),
            verifier=MagicMock(),
            fusion=MagicMock(),
            faiss=MagicMock(),
        )

    @staticmethod
    def _make_view(view_index: int) -> PP2PerViewResult:
        return PP2PerViewResult(
            view_index=view_index,
            filename=f"view_{view_index}.jpg",
            detection=PP2PerViewDetection(bbox=(0, 0, 10, 10), cls_name="Smart Phone", confidence=0.9),
            extraction=PP2PerViewExtraction(caption="", ocr_text="", grounded_features={}, raw={}),
            embedding=PP2PerViewEmbedding(dim=2, vector_preview=[1.0, 0.0], vector_id=f"v{view_index}"),
            quality_score=0.9,
        )

    def test_failed_phone_candidate_reruns_once_after_targeted_detail(self):
        verification = PP2VerificationResult(
            mode="two_view",
            cosine_sim_matrix=[[1.0, 0.2], [0.2, 1.0]],
            faiss_sim_matrix=[[1.0, 0.2], [0.2, 1.0]],
            geometric_scores={
                "0-1": {
                    "smartphone_front_back_retryable": True,
                    "smartphone_front_back_candidate": True,
                    "smartphone_front_back_evidence_ready": False,
                }
            },
            passed=False,
            failure_reasons=["initial fail"],
            used_views=[0, 1],
            dropped_views=[],
        )
        rerun_verification = PP2VerificationResult(
            mode="two_view",
            cosine_sim_matrix=[[1.0, 0.2], [0.2, 1.0]],
            faiss_sim_matrix=[[1.0, 0.2], [0.2, 1.0]],
            geometric_scores={
                "0-1": {
                    "smartphone_front_back_retryable": False,
                    "smartphone_front_back_candidate": True,
                    "smartphone_front_back_evidence_ready": True,
                }
            },
            passed=True,
            failure_reasons=["rescued"],
            used_views=[0, 1],
            dropped_views=[],
        )
        self.pipeline.florence.analyze_ocr_first.side_effect = [
            {"caption": "front side", "ocr_text": "Home to unlock", "grounded_features": {}, "raw": {}},
            {"caption": "back side", "ocr_text": "", "grounded_features": {"features": ["camera module"]}, "raw": {}},
        ]
        self.pipeline.verifier.verify.return_value = rerun_verification

        updated_verification, detail_ms, rerun_verify_ms, rerun_performed = self.pipeline._rerun_smartphone_front_back_rescue_if_needed(
            verification=verification,
            per_view_results=[self._make_view(0), self._make_view(1)],
            vectors_np=[],
            crops=["c0", "c1"],
            crop_by_index={0: "c0", 1: "c1"},
            used_views=[0, 1],
            dropped_views=[],
            decision_indices=[0, 1],
            consensus_label="Smart Phone",
            canonical_label_by_index={0: "Smart Phone", 1: "Smart Phone"},
            embedding_variants_by_index={},
            trace_request_id="req-1",
            item_id="item-1",
            canonical_hint_by_index={0: "Smart Phone", 1: "Smart Phone"},
        )

        self.assertTrue(rerun_performed)
        self.assertTrue(updated_verification.passed)
        self.assertGreaterEqual(detail_ms, 0.0)
        self.assertGreaterEqual(rerun_verify_ms, 0.0)
        self.assertEqual(self.pipeline.florence.analyze_ocr_first.call_count, 2)
        self.assertEqual(self.pipeline.verifier.verify.call_count, 1)

    def test_failure_detail_targets_only_used_pair(self):
        detail_targets, detail_reason, mark_non_targets_skipped = self.pipeline._resolve_detail_targets(
            verification_passed=False,
            verification_used_views=[0, 2],
            fallback_used_views=[0, 2],
            force_grounding=False,
            early_exit_pair=None,
            pass_caption_refinement=False,
            total_views=3,
        )

        self.assertEqual(detail_targets, {0, 2})
        self.assertEqual(detail_reason, "verification_failed_used_pair")
        self.assertTrue(mark_non_targets_skipped)


if __name__ == "__main__":
    unittest.main()
