from typing import List, Dict, Any, Optional, Tuple, Set
import numpy as np
import re
import logging
from sklearn.metrics.pairwise import cosine_similarity
from app.schemas.pp2_schemas import PP2PerViewResult, PP2VerificationResult
from app.services.pp2_geometric_verifier import GeometricVerifier
from app.config.settings import settings
from app.domain.category_specs import canonicalize_label

logger = logging.getLogger(__name__)


class MultiViewVerifier:
    # Legacy baseline threshold used as fallback when mode-specific thresholds are unset.
    LEGACY_BASE_THRESHOLD = settings.PP2_SIM_THRESHOLD
    STRICTER_TWO_VIEW_DELTA = 0.05
    TWO_VIEW_DECISION_PAIRS = 1
    TWO_VIEW_DECISION_VIEW_COUNT = 2
    THREE_VIEW_DECISION_VIEW_COUNT = 3
    THREE_VIEW_SALVAGE_REQUIRED_GEO_PASSES = 2

    GROUP_BAGS_GEOMETRY = "bags_geometry"
    GROUP_ANGLE_OCR = "angle_ocr"
    GROUP_CONSERVATIVE_OCR = "conservative_ocr"
    TWO_VIEW_NEAR_MISS_COS_DELTA = 0.08

    CATEGORY_MODE_THRESHOLDS: Dict[str, Dict[int, float]] = {
        "Helmet": {2: 0.60, 3: 0.55},
        "Smart Phone": {2: 0.65, 3: 0.60},
        "Laptop": {2: 0.65, 3: 0.60},
        "Wallet": {2: 0.70, 3: 0.65},
        "Handbag": {2: 0.70, 3: 0.65},
        "Backpack": {2: 0.70, 3: 0.65},
        "Key": {2: 0.75, 3: 0.70},
        "Student ID": {2: 0.75, 3: 0.70},
        "Laptop/Mobile chargers & cables": {2: 0.75, 3: 0.70},
    }
    CONSERVATIVE_FALLBACK_BY_VIEWS: Dict[int, float] = {2: 0.75, 3: 0.70}
    FALLBACK_THRESHOLD_ENTRY = "fallback_conservative"

    CATEGORY_GROUPS: Dict[str, Set[str]] = {
        GROUP_BAGS_GEOMETRY: {"Wallet", "Handbag", "Backpack"},
        GROUP_ANGLE_OCR: {"Helmet", "Smart Phone", "Laptop", "Earbuds - Earbuds case"},
        GROUP_CONSERVATIVE_OCR: {
            "Key",
            "Student ID",
            "Laptop/Mobile chargers & cables",
            "Headphone",
            "Power Bank",
        },
    }

    GROUP_NEAR_MISS_MARGIN: Dict[str, float] = {
        GROUP_BAGS_GEOMETRY: 0.03,
        GROUP_ANGLE_OCR: 0.05,
        GROUP_CONSERVATIVE_OCR: 0.02,
    }

    _URL_OR_DOMAIN_RE = re.compile(r"(?:\bHTTP\b|\bHTTPS\b|\bWWW\b|(?:^|[^\s])\.(?:COM|NET|LK|ORG|CO)\b)")
    _SPLIT_RE = re.compile(r"[\/\._-]+")
    _TECH_STOPWORDS = {"HTTP", "HTTPS", "WWW", "COM", "NET", "LK", "ORG", "CO"}
    _ALPHA_ONLY_RE = re.compile(r"^[A-Z]+$")

    def __init__(self, geometric_service: GeometricVerifier):
        self.geometric_service = geometric_service

    @staticmethod
    def _clamp01(value: float) -> float:
        return max(0.0, min(1.0, float(value)))

    def compute_cosine_matrix(self, vectors: List[np.ndarray]) -> List[List[float]]:
        """Computes NxN cosine similarity matrix for the provided vectors."""
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
        """Computes NxN similarity matrix using FaissService logic."""
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

        colors = []
        for res in per_view:
            c = res.extraction.grounded_features.get("color")
            if c:
                normalized = self._normalize_color(c)
                if normalized:
                    bucketed = self._bucket_color(normalized)
                    if bucketed:
                        colors.append(bucketed)

        if len(set(colors)) == 3:
            unique_colors = sorted(set(colors))
            issues.append(f"Inconsistent colors detected: {unique_colors}")

        return issues

    @classmethod
    def _resolve_mode_thresholds(cls, decision_view_count: int) -> Tuple[float, float, str]:
        """
        Resolve embedding/faiss thresholds by decision mode.
        Fallback behavior:
          - 3-view thresholds default to PP2_SIM_THRESHOLD
          - 2-view thresholds default to PP2_SIM_THRESHOLD + STRICTER_TWO_VIEW_DELTA
        """
        if decision_view_count == cls.TWO_VIEW_DECISION_VIEW_COUNT:
            base = float(cls.CONSERVATIVE_FALLBACK_BY_VIEWS.get(2, 0.75))
            return base, base, "two_view"
        if decision_view_count == cls.THREE_VIEW_DECISION_VIEW_COUNT:
            base = float(cls.CONSERVATIVE_FALLBACK_BY_VIEWS.get(3, 0.70))
            return base, base, "three_view"
        base = float(cls.CONSERVATIVE_FALLBACK_BY_VIEWS.get(3, 0.70))
        return base, base, "unsupported"

    @classmethod
    def _resolve_category_group(cls, category: Optional[str]) -> str:
        canonical = canonicalize_label(str(category or "")) or str(category or "").strip()
        for group, labels in cls.CATEGORY_GROUPS.items():
            if canonical in labels:
                return group
        return cls.GROUP_CONSERVATIVE_OCR

    @classmethod
    def get_thresholds(cls, category: Optional[str], n_views: int) -> Tuple[float, float, float, str]:
        canonical = canonicalize_label(str(category or "")) or str(category or "").strip()
        group = cls._resolve_category_group(canonical)
        margin = float(cls.GROUP_NEAR_MISS_MARGIN.get(group, 0.02))

        category_map = cls.CATEGORY_MODE_THRESHOLDS.get(canonical)
        if isinstance(category_map, dict) and n_views in category_map:
            cos_th = cls._clamp01(float(category_map[n_views]))
            threshold_entry = canonical
        else:
            cos_th = cls._clamp01(float(cls.CONSERVATIVE_FALLBACK_BY_VIEWS.get(n_views, 0.70)))
            threshold_entry = cls.FALLBACK_THRESHOLD_ENTRY

        # Keep FAISS gating aligned with cosine thresholds.
        faiss_th = cos_th
        return cos_th, faiss_th, margin, threshold_entry

    @staticmethod
    def _pair_has_any_ocr(
        per_view_results: List[PP2PerViewResult],
        i: int,
        j: int,
    ) -> bool:
        if i >= len(per_view_results) or j >= len(per_view_results):
            return False
        ocr_i = str(per_view_results[i].extraction.ocr_text or "").strip()
        ocr_j = str(per_view_results[j].extraction.ocr_text or "").strip()
        return bool(ocr_i or ocr_j)

    @staticmethod
    def _pair_matches_consensus_category(
        per_view_results: List[PP2PerViewResult],
        i: int,
        j: int,
        consensus_category: Optional[str],
    ) -> bool:
        if i >= len(per_view_results) or j >= len(per_view_results):
            return False
        consensus = canonicalize_label(str(consensus_category or "")) or str(consensus_category or "").strip()
        if not consensus:
            return False
        label_i = canonicalize_label(per_view_results[i].detection.cls_name)
        label_j = canonicalize_label(per_view_results[j].detection.cls_name)
        return bool(label_i and label_j and label_i == consensus and label_j == consensus)

    @classmethod
    def _looks_like_url_or_domain(cls, raw_token: str) -> bool:
        token = str(raw_token or "").upper()
        return bool(cls._URL_OR_DOMAIN_RE.search(token))

    @staticmethod
    def _strip_token_edges(token: str) -> str:
        return str(token or "").upper().strip(".,;:!?\"'()[]{}<>")

    @classmethod
    def _split_raw_chunk(cls, raw_chunk: str) -> List[str]:
        return [part for part in cls._SPLIT_RE.split(str(raw_chunk or "")) if part]

    @classmethod
    def _is_brand_like_token(cls, token: str) -> bool:
        t = str(token or "").upper()
        if not t or t in cls._TECH_STOPWORDS:
            return False
        if not cls._ALPHA_ONLY_RE.fullmatch(t):
            return False
        return 4 <= len(t) <= 20

    @classmethod
    def _collect_ocr_tokens(cls, text: Any) -> Set[str]:
        tokens: Set[str] = set()
        raw_chunks = str(text or "").split()
        for raw_chunk in raw_chunks:
            raw_upper = str(raw_chunk).upper()
            if cls._looks_like_url_or_domain(raw_upper):
                continue

            parts = cls._split_raw_chunk(raw_upper)
            if not parts:
                continue

            for part in parts:
                cleaned = cls._strip_token_edges(part)
                if not cleaned:
                    continue
                if cleaned in cls._TECH_STOPWORDS:
                    continue
                if len(cleaned) < 3:
                    continue
                if not any(ch.isalnum() for ch in cleaned):
                    continue
                tokens.add(cleaned)
        return tokens

    @staticmethod
    def _extract_brand(view: PP2PerViewResult) -> str:
        grounded = view.extraction.grounded_features if isinstance(view.extraction.grounded_features, dict) else {}
        raw_brand = grounded.get("brand")
        if raw_brand is None:
            return ""
        if isinstance(raw_brand, list):
            for candidate in raw_brand:
                value = str(candidate or "").strip().upper()
                if value:
                    return value
            return ""
        return str(raw_brand).strip().upper()

    def _pair_ocr_consistency(
        self,
        per_view_results: List[PP2PerViewResult],
        i: int,
        j: int,
    ) -> Dict[str, Any]:
        if i >= len(per_view_results) or j >= len(per_view_results):
            return {
                "brand_match": False,
                "shared_tokens": [],
                "angle_ocr_consistent": False,
                "conservative_strong_ocr": False,
            }

        vi = per_view_results[i]
        vj = per_view_results[j]

        brand_i = self._extract_brand(vi)
        brand_j = self._extract_brand(vj)
        brand_match = bool(brand_i and brand_j and brand_i == brand_j)

        tokens_i = self._collect_ocr_tokens(vi.extraction.ocr_text)
        tokens_j = self._collect_ocr_tokens(vj.extraction.ocr_text)
        shared_tokens = sorted(tokens_i.intersection(tokens_j))

        shared_brand_like = [t for t in shared_tokens if self._is_brand_like_token(t)]
        shared_alpha_num_len4 = [t for t in shared_tokens if t.isalnum() and len(t) >= 4]

        angle_ocr_consistent = bool(
            brand_match
            or len(shared_brand_like) >= 1
            or len(shared_tokens) >= 2
        )
        conservative_strong_ocr = bool(
            brand_match
            or len(shared_tokens) >= 2
            or len(shared_alpha_num_len4) >= 1
        )

        return {
            "brand_match": brand_match,
            "shared_tokens": shared_tokens,
            "angle_ocr_consistent": angle_ocr_consistent,
            "conservative_strong_ocr": conservative_strong_ocr,
        }

    @staticmethod
    def _cosine_pair(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        a = np.asarray(vec_a, dtype=np.float32).reshape(-1)
        b = np.asarray(vec_b, dtype=np.float32).reshape(-1)
        na = np.linalg.norm(a) + 1e-12
        nb = np.linalg.norm(b) + 1e-12
        return float(np.dot(a, b) / (na * nb))

    @staticmethod
    def _to_np(vec: Any) -> np.ndarray:
        return np.asarray(vec, dtype=np.float32).reshape(-1)

    def _prepare_embedding_variants(
        self,
        vectors: List[np.ndarray],
        embedding_variants_by_index: Optional[Dict[int, Dict[str, np.ndarray]]],
    ) -> Dict[int, Dict[str, np.ndarray]]:
        variants: Dict[int, Dict[str, np.ndarray]] = {}
        for idx, vec in enumerate(vectors):
            if isinstance(vec, np.ndarray) and vec.ndim == 1:
                # Preserve object identity for deterministic legacy FAISS test doubles.
                full_vec = vec
            else:
                full_vec = self._to_np(vec)
            variants[idx] = {"full": full_vec}

        if not isinstance(embedding_variants_by_index, dict):
            return variants

        for idx, variant_map in embedding_variants_by_index.items():
            if idx not in variants or not isinstance(variant_map, dict):
                continue

            full_dim = int(variants[idx]["full"].shape[0])
            for name, raw_vec in variant_map.items():
                if not isinstance(name, str):
                    continue
                np_vec = self._to_np(raw_vec)
                if int(np_vec.shape[0]) != full_dim:
                    continue
                variants[idx][name] = np_vec

            variants[idx]["full"] = variants[idx]["full"]

        return variants

    def _compute_pair_similarity_metrics(
        self,
        i: int,
        j: int,
        variants: Dict[int, Dict[str, np.ndarray]],
        faiss_service: Any,
    ) -> Dict[str, Any]:
        combo_order = [("full", "full"), ("center", "center"), ("full", "center"), ("center", "full")]
        best: Optional[Dict[str, Any]] = None
        best_rank = len(combo_order) + 1

        if i not in variants or j not in variants:
            return {
                "best_similarity_path": "full/full",
                "selected_cosine": 0.0,
                "selected_faiss": 0.0,
                "full_full_cosine": 0.0,
                "full_full_faiss": 0.0,
                "multi_crop_helped": False,
            }

        full_full_cos = self._cosine_pair(variants[i]["full"], variants[j]["full"])
        full_full_faiss = self._pair_sim(faiss_service, variants[i]["full"], variants[j]["full"])
        full_full = {
            "best_similarity_path": "full/full",
            "selected_cosine": float(full_full_cos),
            "selected_faiss": float(full_full_faiss),
            "full_full_cosine": float(full_full_cos),
            "full_full_faiss": float(full_full_faiss),
            "multi_crop_helped": False,
        }

        for rank, (left_name, right_name) in enumerate(combo_order):
            left_vec = variants[i].get(left_name)
            right_vec = variants[j].get(right_name)
            if left_vec is None or right_vec is None:
                continue

            c_score = float(self._cosine_pair(left_vec, right_vec))
            f_score = float(self._pair_sim(faiss_service, left_vec, right_vec))
            composite = min(c_score, f_score)
            record = {
                "best_similarity_path": f"{left_name}/{right_name}",
                "selected_cosine": c_score,
                "selected_faiss": f_score,
                "composite": composite,
                "full_full_cosine": float(full_full_cos),
                "full_full_faiss": float(full_full_faiss),
            }

            if best is None:
                best = record
                best_rank = rank
                continue

            current_best_comp = float(best.get("composite", -1.0))
            if composite > current_best_comp:
                best = record
                best_rank = rank
            elif composite == current_best_comp and rank < best_rank:
                best = record
                best_rank = rank

        selected = best or full_full
        selected_path = str(selected.get("best_similarity_path", "full/full"))
        selected_cos = float(selected.get("selected_cosine", 0.0))
        selected_faiss = float(selected.get("selected_faiss", 0.0))
        helped = selected_path != "full/full" and (
            selected_cos > full_full_cos or selected_faiss > full_full_faiss
        )
        return {
            "best_similarity_path": selected_path,
            "selected_cosine": selected_cos,
            "selected_faiss": selected_faiss,
            "full_full_cosine": float(full_full_cos),
            "full_full_faiss": float(full_full_faiss),
            "multi_crop_helped": bool(helped),
        }

    def select_best_pair(
        self,
        vectors: List[np.ndarray],
        faiss_service: Any,
        candidate_indices: Optional[List[int]] = None,
        embedding_variants_by_index: Optional[Dict[int, Dict[str, np.ndarray]]] = None,
    ) -> Tuple[Optional[Tuple[int, int]], Dict[str, float]]:
        n = len(vectors)
        if candidate_indices is None:
            indices = list(range(n))
        else:
            indices = sorted(
                {
                    int(idx)
                    for idx in candidate_indices
                    if isinstance(idx, int) and 0 <= int(idx) < n
                }
            )
        if len(indices) < 2:
            return None, {}

        variants = self._prepare_embedding_variants(vectors, embedding_variants_by_index)
        best_pair: Optional[Tuple[int, int]] = None
        best_score = float("-inf")
        pair_scores: Dict[str, float] = {}

        for i_pos in range(len(indices)):
            for j_pos in range(i_pos + 1, len(indices)):
                i = indices[i_pos]
                j = indices[j_pos]
                metrics = self._compute_pair_similarity_metrics(i, j, variants, faiss_service)
                score = float(metrics.get("selected_cosine", 0.0))
                key = f"{i}-{j}"
                pair_scores[key] = score

                if score > best_score:
                    best_score = score
                    best_pair = (i, j)
                elif score == best_score and best_pair is not None and (i, j) < best_pair:
                    best_pair = (i, j)

        return best_pair, pair_scores

    @staticmethod
    def _classify_pair_strength(
        cos_score: float,
        faiss_score: float,
        cos_th: float,
        faiss_th: float,
        margin: float,
    ) -> str:
        if cos_score >= cos_th and faiss_score >= faiss_th:
            return "strong"
        if cos_score >= (cos_th - margin) and faiss_score >= (faiss_th - margin):
            return "near_miss"
        return "weak"

    @staticmethod
    def _infer_category(
        per_view_results: List[PP2PerViewResult],
        decision_indices: List[int],
    ) -> Optional[str]:
        labels: List[str] = []
        for idx in decision_indices:
            if idx >= len(per_view_results):
                continue
            label = canonicalize_label(per_view_results[idx].detection.cls_name)
            if label:
                labels.append(label)
        if not labels:
            return None
        counts: Dict[str, int] = {}
        for label in labels:
            counts[label] = counts.get(label, 0) + 1
        ranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
        return ranked[0][0]

    def verify(
        self,
        per_view_results: List[PP2PerViewResult],
        vectors: List[np.ndarray],
        crops,  # List of PIL Images
        faiss_service: Any,
        eligible_indices: Optional[List[int]] = None,
        used_views_override: Optional[List[int]] = None,
        dropped_views: Optional[List[Dict[str, Any]]] = None,
        decision_category: Optional[str] = None,
        embedding_variants_by_index: Optional[Dict[int, Dict[str, np.ndarray]]] = None,
        request_id: Optional[str] = None,
        item_id: Optional[str] = None,
    ) -> PP2VerificationResult:
        n = len(vectors)
        all_pairs = [(i, j) for i in range(n) for j in range(i + 1, n)]

        if used_views_override is not None:
            decision_indices = sorted(
                {
                    int(idx)
                    for idx in used_views_override
                    if isinstance(idx, int) and 0 <= int(idx) < n
                }
            )
        elif eligible_indices is None:
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
        decision_view_count = len(decision_indices)

        inferred_category = self._infer_category(per_view_results, decision_indices)
        canonical_category = canonicalize_label(str(decision_category or "")) or inferred_category or str(decision_category or "").strip()
        group_label = self._resolve_category_group(canonical_category)
        cos_th, faiss_th, near_miss_margin, threshold_entry = self.get_thresholds(canonical_category, decision_view_count)
        _, _, mode_label = self._resolve_mode_thresholds(decision_view_count)
        mode_context = (
            f"mode={mode_label}, group={group_label}, threshold_entry={threshold_entry}, "
            f"cos>={cos_th:.2f}, faiss>={faiss_th:.2f}"
        )

        variants = self._prepare_embedding_variants(vectors, embedding_variants_by_index)
        cosine_mat = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
        faiss_mat = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
        pair_similarity_metrics: Dict[str, Dict[str, Any]] = {}

        for i, j in all_pairs:
            key = f"{i}-{j}"
            metrics = self._compute_pair_similarity_metrics(i, j, variants, faiss_service)
            strength = self._classify_pair_strength(
                metrics["selected_cosine"],
                metrics["selected_faiss"],
                cos_th,
                faiss_th,
                near_miss_margin,
            )
            metrics["pair_strength"] = strength
            pair_similarity_metrics[key] = metrics

            cosine_mat[i][j] = metrics["selected_cosine"]
            cosine_mat[j][i] = metrics["selected_cosine"]
            faiss_mat[i][j] = metrics["selected_faiss"]
            faiss_mat[j][i] = metrics["selected_faiss"]

        logger.debug(
            (
                "PP2_VERIFY_THRESHOLDS request_id=%s item_id=%s mode=%s eligible_count=%d category=%s group=%s "
                "threshold_entry=%s cos_th=%.4f faiss_th=%.4f margin=%.4f decision_pairs=%s used_views=%s dropped_count=%d"
            ),
            request_id,
            item_id,
            mode_label,
            decision_view_count,
            canonical_category,
            group_label,
            threshold_entry,
            cos_th,
            faiss_th,
            near_miss_margin,
            decision_pairs,
            decision_indices if len(decision_indices) == 2 else [],
            len(dropped_views or []),
        )

        geo_scores: Dict[str, Dict[str, Any]] = {}
        geometric_passed_decision_pairs: List[str] = []
        geometric_failed_decision_pairs: List[str] = []
        for i, j in all_pairs:
            key = f"{i}-{j}"
            if i >= len(crops) or j >= len(crops):
                result: Dict[str, Any] = {
                    "skipped": True,
                    "reason": "missing_crop",
                    "passed": False,
                }
            else:
                raw_result = self.geometric_service.verify_pair(crops[i], crops[j])
                result = dict(raw_result) if isinstance(raw_result, dict) else {"raw_result": raw_result, "passed": False}

            pair_metrics = pair_similarity_metrics.get(key, {})
            result.update(
                {
                    "best_similarity_path": pair_metrics.get("best_similarity_path", "full/full"),
                    "multi_crop_helped": pair_metrics.get("multi_crop_helped", False),
                    "selected_cosine": pair_metrics.get("selected_cosine", 0.0),
                    "selected_faiss": pair_metrics.get("selected_faiss", 0.0),
                    "full_full_cosine": pair_metrics.get("full_full_cosine", 0.0),
                    "full_full_faiss": pair_metrics.get("full_full_faiss", 0.0),
                    "pair_strength": pair_metrics.get("pair_strength", "weak"),
                }
            )
            geo_scores[key] = result

            if (i, j) in decision_pair_set:
                if bool(result.get("passed", False)):
                    geometric_passed_decision_pairs.append(key)
                else:
                    geometric_failed_decision_pairs.append(key)

        reasons: List[str] = []
        decision_pair_infos: Dict[str, Dict[str, Any]] = {}
        strong_pairs: List[str] = []
        near_miss_pairs: List[str] = []
        weak_pairs: List[str] = []

        for i, j in decision_pairs:
            key = f"{i}-{j}"
            metrics = pair_similarity_metrics.get(key, {})
            consistency = self._pair_ocr_consistency(per_view_results, i, j)

            info = {
                **metrics,
                **consistency,
            }
            decision_pair_infos[key] = info

            strength = str(info.get("pair_strength", "weak"))
            if strength == "strong":
                strong_pairs.append(key)
                continue
            if strength == "near_miss":
                near_miss_pairs.append(key)
            else:
                weak_pairs.append(key)

            reasons.append(
                (
                    f"Pair {key} {strength} (mode={mode_label}, group={group_label}, "
                    f"threshold_entry={threshold_entry}, "
                    f"cos={float(info.get('selected_cosine', 0.0)):.2f}, "
                    f"faiss={float(info.get('selected_faiss', 0.0)):.2f}, "
                    f"thresholds=cos>={cos_th:.2f}/faiss>={faiss_th:.2f}, margin={near_miss_margin:.2f}, "
                    f"path={info.get('best_similarity_path', 'full/full')}, "
                    f"full_full_cos={float(info.get('full_full_cosine', 0.0)):.2f}, "
                    f"full_full_faiss={float(info.get('full_full_faiss', 0.0)):.2f}, "
                    f"multi_crop_helped={bool(info.get('multi_crop_helped', False))})."
                )
            )

        embedding_failed_pairs = near_miss_pairs + weak_pairs
        embedding_failures = len(embedding_failed_pairs)
        total_decision_pairs = len(decision_pairs)
        two_view_mode = decision_view_count == self.TWO_VIEW_DECISION_VIEW_COUNT
        three_view_mode = decision_view_count == self.THREE_VIEW_DECISION_VIEW_COUNT

        if embedding_failures > 0:
            reasons.append(
                f"Embedding consistency failures: {embedding_failures}/{total_decision_pairs} pairs "
                f"(failed: {', '.join(embedding_failed_pairs)})."
            )

        if total_decision_pairs == 0:
            passed = False
            reasons.append(
                "Insufficient eligible views for verification "
                f"(need at least 2, got {decision_view_count})."
            )
        elif two_view_mode:
            pair_key = decision_pairs[0]
            pair_name = f"{pair_key[0]}-{pair_key[1]}"
            pair_info = decision_pair_infos.get(pair_name, {})
            pair_strength = str(pair_info.get("pair_strength", "weak"))
            pair_cos = float(pair_info.get("selected_cosine", 0.0))
            near_miss_floor = cos_th - self.TWO_VIEW_NEAR_MISS_COS_DELTA
            labels_match_consensus = self._pair_matches_consensus_category(
                per_view_results,
                pair_key[0],
                pair_key[1],
                canonical_category,
            )
            has_any_ocr = self._pair_has_any_ocr(
                per_view_results,
                pair_key[0],
                pair_key[1],
            )

            if pair_strength == "strong":
                passed = True
            elif (
                pair_strength == "near_miss"
                and group_label == self.GROUP_ANGLE_OCR
                and bool(pair_info.get("angle_ocr_consistent", False))
            ):
                passed = True
                reasons.append(
                    "Salvaged: two-view near-miss accepted for angle_ocr group using OCR/brand consistency "
                    f"(pair={pair_name}, thresholds cos>={cos_th:.2f}, faiss>={faiss_th:.2f}, margin={near_miss_margin:.2f}, "
                    f"threshold_entry={threshold_entry})."
                )
            elif pair_cos >= near_miss_floor and labels_match_consensus and has_any_ocr:
                passed = True
                reasons.append(
                    "Salvaged: two-view near-miss cosine override accepted "
                    f"(pair={pair_name}, selected_cos={pair_cos:.2f}, required_cos>={near_miss_floor:.2f}, "
                    f"labels_match_consensus={labels_match_consensus}, has_any_ocr={has_any_ocr}, {mode_context})."
                )
            else:
                passed = False
                reasons.append(
                    "Not salvaged: two-view mode requires the eligible pair to pass strong thresholds "
                    f"({mode_context})."
                )
        elif three_view_mode:
            weak_count = len(weak_pairs)
            near_count = len(near_miss_pairs)
            strong_count = len(strong_pairs)

            if weak_count == 0 and near_count == 0:
                passed = True
            elif weak_count == 0 and near_count == 1 and strong_count == 2:
                near_pair = near_miss_pairs[0]
                near_info = decision_pair_infos.get(near_pair, {})
                if (
                    group_label == self.GROUP_CONSERVATIVE_OCR
                    and not bool(near_info.get("conservative_strong_ocr", False))
                ):
                    passed = False
                    reasons.append(
                        "Not salvaged: conservative_ocr group requires strong OCR/brand consistency for near-miss pair "
                        f"(pair={near_pair}, {mode_context})."
                    )
                else:
                    passed = True
                    reasons.append(
                        "Salvaged: three-view accepted with two strong pairs and one near-miss "
                        f"(near_miss_pair={near_pair}, group={group_label}, threshold_entry={threshold_entry})."
                    )
            elif weak_count == 1:
                weak_pair = weak_pairs[0]
                weak_info = decision_pair_infos.get(weak_pair, {})
                geo_pass_count = len(geometric_passed_decision_pairs)

                if group_label == self.GROUP_BAGS_GEOMETRY:
                    if geo_pass_count >= self.THREE_VIEW_SALVAGE_REQUIRED_GEO_PASSES:
                        passed = True
                        reasons.append(
                            "Salvaged: bags_geometry group accepted weak pair using geometric support "
                            f"(weak_pair={weak_pair}, geometric_passed_pairs={geometric_passed_decision_pairs})."
                        )
                    else:
                        passed = False
                        reasons.append(
                            "Not salvaged: bags_geometry group requires >=2 geometric passed pairs "
                            f"(got {geo_pass_count}, weak_pair={weak_pair}, {mode_context})."
                        )
                elif group_label == self.GROUP_ANGLE_OCR:
                    if bool(weak_info.get("angle_ocr_consistent", False)):
                        passed = True
                        reasons.append(
                            "Salvaged: angle_ocr group accepted weak pair using OCR/brand consistency "
                            f"(weak_pair={weak_pair}, geometric_ignored=true, threshold_entry={threshold_entry})."
                        )
                    else:
                        passed = False
                        reasons.append(
                            "Not salvaged: angle_ocr group requires OCR/brand consistency for weak pair "
                            f"(weak_pair={weak_pair}, {mode_context})."
                        )
                else:
                    if (
                        str(weak_info.get("pair_strength", "weak")) == "near_miss"
                        and bool(weak_info.get("conservative_strong_ocr", False))
                    ):
                        passed = True
                        reasons.append(
                            "Salvaged: conservative_ocr accepted near-miss weak pair due to strong OCR evidence "
                            f"(pair={weak_pair})."
                        )
                    else:
                        passed = False
                        reasons.append(
                            "Not salvaged: conservative_ocr group requires near-miss + strong OCR/brand consistency "
                            f"(weak_pair={weak_pair}, {mode_context})."
                        )
            else:
                passed = False
                reasons.append(
                    "Not salvaged: three-view mode does not allow salvage with 2+ weak pairs "
                    f"(weak_pairs={weak_pairs}, near_miss_pairs={near_miss_pairs}, {mode_context})."
                )
        else:
            passed = False
            reasons.append(
                "Unsupported verification mode: eligible view count must be 2 or 3, "
                f"got {decision_view_count} ({mode_context})."
            )

        semantic_issues = self.semantic_consistency_checks(per_view_results)
        if semantic_issues:
            reasons.extend(semantic_issues)

        logger.debug(
            "PP2_VERIFY_SUMMARY request_id=%s item_id=%s strong_pairs=%s near_miss_pairs=%s weak_pairs=%s used_views=%s dropped_count=%d passed=%s",
            request_id,
            item_id,
            strong_pairs,
            near_miss_pairs,
            weak_pairs,
            decision_indices if len(decision_indices) == 2 else [],
            len(dropped_views or []),
            passed,
        )

        used_views = decision_indices if len(decision_indices) == 2 else []
        normalized_dropped: List[Dict[str, Any]] = []
        seen_dropped = set()
        for entry in dropped_views or []:
            if not isinstance(entry, dict):
                continue
            idx_raw = entry.get("view_index")
            reason_raw = entry.get("reason")
            if not isinstance(idx_raw, int) or idx_raw < 0 or idx_raw >= n:
                reasons.append(f"Ignored dropped view metadata with invalid index: {idx_raw}.")
                continue
            if idx_raw in seen_dropped:
                continue
            if idx_raw in used_views:
                reasons.append(f"Ignored dropped view metadata overlapping used view index: {idx_raw}.")
                continue
            seen_dropped.add(idx_raw)
            normalized_dropped.append(
                {
                    "view_index": int(idx_raw),
                    "reason": str(reason_raw or "dropped"),
                }
            )

        return PP2VerificationResult(
            cosine_sim_matrix=cosine_mat,
            faiss_sim_matrix=faiss_mat,
            geometric_scores=geo_scores,
            passed=passed,
            failure_reasons=reasons,
            used_views=used_views,
            dropped_views=normalized_dropped,
        )
