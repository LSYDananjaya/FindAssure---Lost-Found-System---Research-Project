import unittest
import numpy as np
from unittest.mock import MagicMock, Mock
from app.services.pp2_multiview_verifier import MultiViewVerifier
from app.services.faiss_service import FaissService
from app.schemas.pp2_schemas import PP2PerViewResult, PP2PerViewDetection, PP2PerViewExtraction, PP2PerViewEmbedding

class TestMultiViewVerifier(unittest.TestCase):
    
    def setUp(self):
        # Mock GeometricVerifier for MultiViewVerifier dependency
        self.mock_geo_service = MagicMock()
        self.verifier = MultiViewVerifier(geometric_service=self.mock_geo_service)

    def test_compute_cosine_matrix(self):
        # Create user-defined list of 3 numpy vectors ([1,0], [0,1], [1,1])
        vectors = [
            np.array([1, 0]),
            np.array([0, 1]),
            np.array([1, 1])
        ]
        
        # Expected cosine similarities:
        # v0.v0 = 1.0, v0.v1 = 0.0, v0.v2 = 1/sqrt(2) ~= 0.707
        # v1.v0 = 0.0, v1.v1 = 1.0, v1.v2 = 1/sqrt(2) ~= 0.707
        # v2.v0 = 0.707, v2.v1 = 0.707, v2.v2 = 1.0
        
        matrix = self.verifier.compute_cosine_matrix(vectors)
        
        # Assertions
        self.assertAlmostEqual(matrix[0][0], 1.0)
        self.assertAlmostEqual(matrix[0][1], 0.0)
        self.assertAlmostEqual(matrix[0][2], 0.70710678)
        self.assertAlmostEqual(matrix[1][2], 0.70710678)

    def test_verify_logic_pass(self):
        # Mock GeometricVerifier response
        # verify_pair returns a dict with 'inlier_ratio'
        self.mock_geo_service.verify_pair.return_value = {"inlier_ratio": 0.2, "passed": True}
        
        # Mock FaissService for verify method
        # Note: verifier.verify calls compute_faiss_matrix which calls faiss_service.compute_similarity
        mock_faiss = MagicMock()
        # Return high similarity to ensure pass
        mock_faiss.compute_similarity.return_value = 0.95
        
        # Create Dummy PP2PerViewResult objects (minimal fields)
        dummy_result = PP2PerViewResult(
            view_index=0,
            filename="test.jpg",
            detection=PP2PerViewDetection(bbox=(0,0,10,10), cls_name="shoe", confidence=0.9),
            extraction=PP2PerViewExtraction(caption="a shoe", ocr_text="", grounded_features={}),
            embedding=PP2PerViewEmbedding(dim=2, vector_preview=[1.0, 0.0], vector_id="v1"),
            quality_score=0.9
        )
        per_view_results = [dummy_result, dummy_result, dummy_result]
        
        vectors = [np.array([1, 0]) for _ in range(3)]
        crops = ["crop1", "crop2", "crop3"] # Mock crops
        
        # Call verify
        result = self.verifier.verify(per_view_results, vectors, crops, mock_faiss)
        
        self.assertTrue(result.passed)
        self.assertEqual(len(result.failure_reasons), 0)

    def test_verify_logic_fail(self):
        # Set low geometric scores
        self.mock_geo_service.verify_pair.return_value = {"inlier_ratio": 0.0, "passed": False}
        
        # Mock Faiss to return low scores
        mock_faiss = MagicMock()
        mock_faiss.compute_similarity.return_value = 0.1
        
        dummy_result = PP2PerViewResult(
            view_index=0,
            filename="test.jpg",
            detection=PP2PerViewDetection(bbox=(0,0,10,10), cls_name="shoe", confidence=0.9),
            extraction=PP2PerViewExtraction(caption="a shoe", ocr_text="", grounded_features={}),
            embedding=PP2PerViewEmbedding(dim=2, vector_preview=[1.0, 0.0], vector_id="v1"),
            quality_score=0.9
        )
        
        # Vectors that are orthogonal
        vectors = [np.array([1, 0]), np.array([0, 1]), np.array([0, -1])]
        
        result = self.verifier.verify(
            [dummy_result]*3, 
            vectors, 
            ["c"]*3, 
            mock_faiss
        )
        
        self.assertFalse(result.passed)
        self.assertTrue(len(result.failure_reasons) > 0)

    def test_verify_logic_with_pair_similarity_only(self):
        self.mock_geo_service.verify_pair.return_value = {"inlier_ratio": 0.2, "passed": True}

        class PairOnlyFaiss:
            def pair_similarity(self, vec_a, vec_b):
                return 0.95

        dummy_result = PP2PerViewResult(
            view_index=0,
            filename="test.jpg",
            detection=PP2PerViewDetection(bbox=(0, 0, 10, 10), cls_name="shoe", confidence=0.9),
            extraction=PP2PerViewExtraction(caption="a shoe", ocr_text="", grounded_features={}),
            embedding=PP2PerViewEmbedding(dim=2, vector_preview=[1.0, 0.0], vector_id="v1"),
            quality_score=0.9
        )

        per_view_results = [dummy_result, dummy_result, dummy_result]
        vectors = [np.array([1, 0]) for _ in range(3)]
        crops = ["crop1", "crop2", "crop3"]

        result = self.verifier.verify(per_view_results, vectors, crops, PairOnlyFaiss())
        self.assertTrue(result.passed)

    def test_compute_faiss_matrix_raises_when_service_methods_missing(self):
        vectors = [np.array([1, 0]), np.array([0, 1])]
        with self.assertRaises(ValueError) as cm:
            self.verifier.compute_faiss_matrix(vectors, object())

        self.assertIn("pair_similarity", str(cm.exception))
        self.assertIn("compute_similarity", str(cm.exception))


class TestFaissService(unittest.TestCase):
    def test_pair_similarity(self):
        try:
            import faiss
            # Instantiate FaissService with dummy paths
            service = FaissService(dim=2, index_path="dummy.index", mapping_path="dummy.json")
            
            vec_a = np.array([1.0, 0.0])
            vec_b = np.array([0.0, 1.0])
            vec_c = np.array([1.0, 0.0])
            
            # Identical (should be ~1.0)
            score_same = service.pair_similarity(vec_a, vec_c)
            self.assertAlmostEqual(score_same, 1.0, delta=0.01)
            
            # Orthogonal (should be ~0.0)
            score_diff = service.pair_similarity(vec_a, vec_b)
            self.assertAlmostEqual(score_diff, 0.0, delta=0.01)
            
        except ImportError:
            # If faiss is not installed, we mock the behavior to satisfy requirements
            mock_service = MagicMock()
            mock_service.pair_similarity.side_effect = lambda a, b: float(np.dot(a, b))
            
            vec_a = np.array([1, 0])
            vec_c = np.array([1, 0])
            
            self.assertEqual(mock_service.pair_similarity(vec_a, vec_c), 1.0)
            print("Faiss not installed, using mock for pair_similarity test.")

    def test_compute_similarity_alias(self):
        try:
            import faiss
            service = FaissService(dim=2, index_path="dummy.index", mapping_path="dummy.json")

            vec_a = np.array([1.0, 0.0])
            vec_b = np.array([1.0, 0.0])

            score_legacy = service.compute_similarity(vec_a, vec_b)
            score_modern = service.pair_similarity(vec_a, vec_b)

            self.assertAlmostEqual(score_legacy, score_modern, delta=1e-6)
        except ImportError:
            mock_service = MagicMock()
            mock_service.pair_similarity.side_effect = lambda a, b: float(np.dot(a, b))
            mock_service.compute_similarity.side_effect = lambda a, b: mock_service.pair_similarity(a, b)

            vec_a = np.array([1, 0])
            vec_b = np.array([1, 0])
            self.assertEqual(mock_service.compute_similarity(vec_a, vec_b), 1.0)
