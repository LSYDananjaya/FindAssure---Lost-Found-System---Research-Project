from typing import List, Dict, Any, Optional
import numpy as np
import re
from sklearn.metrics.pairwise import cosine_similarity
from app.schemas.pp2_schemas import PP2PerViewResult, PP2VerificationResult
from app.services.pp2_geometric_verifier import GeometricVerifier
from app.config.settings import settings

class MultiViewVerifier:
    # Thresholds
    COSINE_PASS = settings.PP2_SIM_THRESHOLD
    FAISS_PASS = settings.PP2_SIM_THRESHOLD

    def __init__(self, geometric_service: GeometricVerifier):
        self.geometric_service = geometric_service

    def compute_cosine_matrix(self, vectors: List[np.ndarray]) -> List[List[float]]:
        """Computes 3x3 cosine similarity matrix."""
        # Convert list of 1D arrays to 2D array
        matrix = np.array(vectors)
        sims = cosine_similarity(matrix)
        return sims.tolist()

    def _pair_sim(self, faiss_service: Any, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """
        Resolve pairwise similarity from either modern or legacy FAISS service contracts.
        """
        pair_similarity = getattr(faiss_service, "pair_similarity", None)
        if callable(pair_similarity):
            return float(pair_similarity(vec_a, vec_b))

        compute_similarity = getattr(faiss_service, "compute_similarity", None)
        if callable(compute_similarity):
            return float(compute_similarity(vec_a, vec_b))

        raise ValueError(
            "FAISS service must implement 'pair_similarity(vec_a, vec_b)' "
            "or legacy 'compute_similarity(vec_a, vec_b)'."
        )

    def compute_faiss_matrix(self, vectors: List[np.ndarray], faiss_service: Any) -> List[List[float]]:
        """Computes 3x3 similarity matrix using FaissService logic."""
        n = len(vectors)
        matrix = [[0.0] * n for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i == j:
                    matrix[i][j] = 1.0
                else:
                    matrix[i][j] = self._pair_sim(faiss_service, vectors[i], vectors[j])
        return matrix

    @staticmethod
    def _normalize_color(s: str) -> str:
        if not isinstance(s, str):
            return ""
        normalized = s.lower().strip()
        normalized = normalized.replace("-", " ").replace("_", " ")
        normalized = normalized.replace("grey", "gray")
        normalized = re.sub(r"\s+", " ", normalized).strip()
        if normalized in {"", "unknown", "n/a", "none"}:
            return ""
        return normalized

    @staticmethod
    def _bucket_color(normalized: str) -> str:
        if not normalized:
            return ""
        if normalized in {"black", "dark gray", "charcoal"}:
            return "dark"
        return normalized

    def semantic_consistency_checks(self, per_view: List[PP2PerViewResult]) -> List[str]:
        """
        Checks for obvious contradictions in OCR or colors.
        """
        issues = []
        
        # 1. Color Consistency
        colors = []
        for res in per_view:
            c = res.extraction.grounded_features.get("color")
            if c:
                normalized = self._normalize_color(c)
                if normalized:
                    bucketed = self._bucket_color(normalized)
                    if bucketed:
                        colors.append(bucketed)
        
        # If we have 3 distinct colors detected, that's suspicious
        if len(set(colors)) == 3:
            unique_colors = sorted(set(colors))
            issues.append(f"Inconsistent colors detected: {unique_colors}")

        # 2. OCR Consistency (Basic)
        # Check if one view has a brand validation that contradicts another? 
        # For now, placeholder for deeper logic.
        
        return issues

    def verify(
        self, 
        per_view_results: List[PP2PerViewResult], 
        vectors: List[np.ndarray], 
        crops,  # List of PIL Images
        faiss_service: Any,
        eligible_indices: Optional[List[int]] = None,
    ) -> PP2VerificationResult:
        
        # 1. Similarity Matrices
        cosine_mat = self.compute_cosine_matrix(vectors)
        faiss_mat = self.compute_faiss_matrix(vectors, faiss_service)

        n = len(vectors)
        all_pairs = [(i, j) for i in range(n) for j in range(i + 1, n)]

        if eligible_indices is None:
            decision_indices = list(range(n))
        else:
            decision_indices = sorted(
                {
                    int(idx)
                    for idx in eligible_indices
                    if isinstance(idx, int) and 0 <= int(idx) < n
                }
            )

        decision_pairs = [
            (decision_indices[i], decision_indices[j])
            for i in range(len(decision_indices))
            for j in range(i + 1, len(decision_indices))
        ]
        decision_pair_set = set(decision_pairs)

        # 2. Geometric Verification on decision pairs only.
        geo_scores = {}
        geometric_passed_pairs: List[str] = []
        geometric_failed_pairs: List[str] = []
        
        for i, j in all_pairs:
            key = f"{i}-{j}"
            if (i, j) not in decision_pair_set:
                geo_scores[key] = {
                    "skipped": True,
                    "reason": "ineligible_view_pair",
                }
                continue

            if i >= len(crops) or j >= len(crops):
                result = {
                    "skipped": True,
                    "reason": "missing_crop",
                    "passed": False,
                }
                geo_scores[key] = result
                geometric_failed_pairs.append(key)
                continue

            result = self.geometric_service.verify_pair(crops[i], crops[j])
            geo_scores[key] = result

            if bool(result.get("passed", False)):
                geometric_passed_pairs.append(key)
            else:
                geometric_failed_pairs.append(key)

        # 3. Decision Logic
        reasons = []
        embedding_failed_pairs: List[str] = []
        embedding_failures = 0

        for i, j in decision_pairs:
            c_score = cosine_mat[i][j]
            f_score = faiss_mat[i][j]

            emb_ok = (c_score >= self.COSINE_PASS) and (f_score >= self.FAISS_PASS)
            if not emb_ok:
                reasons.append(f"Weak embedding similarity for view {i}-{j} (Cos: {c_score:.2f}, Faiss: {f_score:.2f})")
                embedding_failures += 1
                embedding_failed_pairs.append(f"{i}-{j}")

        total_decision_pairs = len(decision_pairs)
        if total_decision_pairs == 0:
            passed = False
            reasons.append(
                "Insufficient eligible views for verification "
                f"(need at least 2, got {len(decision_indices)})."
            )
        elif embedding_failures == 0:
            passed = True
        else:
            failed_pairs_text = ", ".join(embedding_failed_pairs)
            reasons.append(
                f"Embedding consistency failures: {embedding_failures}/{total_decision_pairs} pairs (failed: {failed_pairs_text})."
            )

            if total_decision_pairs == 3 and embedding_failures == 1 and len(geometric_passed_pairs) >= 2:
                passed = True
                reasons.append(
                    "Salvaged: failed_embedding_pairs="
                    f"[{', '.join(embedding_failed_pairs)}]; geometric_passed_pairs=[{', '.join(geometric_passed_pairs)}]."
                )
            else:
                passed = False
                if total_decision_pairs == 1:
                    reasons.append(
                        "Not salvaged: two-view mode requires the eligible pair to pass embedding thresholds."
                    )
                else:
                    reasons.append(
                        "Not salvaged: failed_embedding_pairs="
                        f"[{', '.join(embedding_failed_pairs)}]; geometric_passed_pairs=[{', '.join(geometric_passed_pairs)}]."
                    )

        # Semantic Checks
        semantic_issues = self.semantic_consistency_checks(per_view_results)
        if semantic_issues:
            reasons.extend(semantic_issues)
            # Dependent on strictness, semantic issues might just be warnings or hard fails.
            # Assuming warning for now unless asked strictly.

        return PP2VerificationResult(
            cosine_sim_matrix=cosine_mat,
            faiss_sim_matrix=faiss_mat,
            geometric_scores=geo_scores,
            passed=passed,
            failure_reasons=reasons
        )
