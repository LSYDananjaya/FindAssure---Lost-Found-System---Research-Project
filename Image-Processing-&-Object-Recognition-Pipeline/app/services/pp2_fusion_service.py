import numpy as np
from typing import List, Dict, Any, Optional, Counter
from app.schemas.pp2_schemas import PP2PerViewResult, PP2FusedProfile

class MultiViewFusionService:
    def fuse(self, per_view: List[PP2PerViewResult], vectors: List[np.ndarray]) -> PP2FusedProfile:
        """
        Fuses results from multiple views into a single consistent profile.
        
        Args:
            per_view: List of results from each view (detection, extraction, quality, etc.)
            vectors: List of embedding vectors (numpy arrays) corresponding to the views.
            
        Returns:
            PP2FusedProfile: The consolidated item profile.
        """
        if not per_view:
            raise ValueError("Cannot fuse empty view list")

        # 1. Determine Best View
        # Rule: Highest quality_score; tie-breaker = highest detection confidence
        # We sort descending, so first element is best.
        sorted_views = sorted(
            per_view,
            key=lambda x: (x.quality_score, x.detection.confidence),
            reverse=True
        )
        best_view = sorted_views[0]
        per_view_map = {r.view_index: r for r in per_view}

        # 2. Merge OCR Tokens
        # Tokenize, normalize to uppercase, dedupe, keep tokens length >= 3
        ocr_tokens = set()
        for res in per_view:
            text = res.extraction.ocr_text or ""
            # Simple whitespace tokenization
            raw_tokens = text.upper().split()
            for t in raw_tokens:
                clean_t = t.strip()
                if len(clean_t) >= 3:
                    ocr_tokens.add(clean_t)
        merged_ocr_tokens = sorted(list(ocr_tokens))

        # 3. Caption
        # Keep best view caption; store others in attributes["captions"]
        main_caption = best_view.extraction.caption
        all_captions = {
            f"view_{r.view_index}": r.extraction.caption 
            for r in per_view 
            if r.extraction.caption
        }

        # 4. Attributes Merging
        # Merge grounded_features dict keys
        merged_attributes = {}
        conflicts = {}
        
        # Collect all keys from all views' grounded_features
        all_keys = set()
        for r in per_view:
            if r.extraction.grounded_features:
                all_keys.update(r.extraction.grounded_features.keys())

        for key in all_keys:
            # Collect values for this key from all views (ignore None)
            values = []
            for r in per_view:
                val = r.extraction.grounded_features.get(key)
                if val is not None:
                    values.append(val)
            
            # Deduplicate values
            # (Using string representation for unhashable types if necessary, though simplistic set works for primitives)
            try:
                unique_values = sorted(list(set(values)))
            except TypeError:
                 # Fallback for unhashable types (like lists/dicts), store strict list
                 unique_values = values

            if not unique_values:
                continue
            
            if len(unique_values) == 1:
                merged_attributes[key] = unique_values[0]
            else:
                # Conflict found
                merged_attributes[key] = unique_values
                conflicts[key] = "Conflicting values found across views"

        merged_attributes["conflicts"] = conflicts
        merged_attributes["captions"] = all_captions

        # 5. Top-Level Fields (Brand, Color, Category)
        # Rule: Majority vote across non-null values; if no majority, pick best_view value and mark conflict
        
        categories = [r.detection.cls_name for r in per_view if r.detection.cls_name]
        # Try to find brand/color in grounded_features if not explicit elsewhere:
        brands = [r.extraction.grounded_features.get("brand") for r in per_view if r.extraction.grounded_features.get("brand")]
        colors = [r.extraction.grounded_features.get("color") for r in per_view if r.extraction.grounded_features.get("color")]

        final_category = self._resolve_majority_vote(categories, best_view.detection.cls_name, "category", merged_attributes)
        
        best_brand = best_view.extraction.grounded_features.get("brand")
        final_brand = self._resolve_majority_vote(brands, best_brand, "brand", merged_attributes)
        
        best_color = best_view.extraction.grounded_features.get("color")
        final_color = self._resolve_majority_vote(colors, best_color, "color", merged_attributes)

        # 6. Defects
        # Union of defects lists
        all_defects = set()
        for r in per_view:
            # check both top level (if exists in per-view extract) or inside grounded_features
            defects_list = r.extraction.grounded_features.get("defects", [])
            if isinstance(defects_list, list):
                for d in defects_list:
                    if isinstance(d, str):
                        all_defects.add(d)
        sorted_defects = sorted(list(all_defects))

        # 7. Fused Embedding
        # L2-normalize each vector -> average -> renormalize
        fused_embedding_id = "placeholder" # As per requirement
        
        # Calculation (even if we only return ID, the logic is requested)
        if vectors:
            # Ensure vectors are floating point
            vec_array = np.array(vectors, dtype=float)
            
            # L2 Normalize input vectors
            # axis=1 for [N, D] array
            norms = np.linalg.norm(vec_array, axis=1, keepdims=True)
            # Avoid divide by zero
            normalized_vecs = vec_array / (norms + 1e-9)
            
            # Average
            avg_vec = np.mean(normalized_vecs, axis=0)
            
            # Renormalize result
            final_norm = np.linalg.norm(avg_vec)
            final_vec = avg_vec / (final_norm + 1e-9)
            
            # In a real system, we would store `final_vec` here using Storage/Faiss Service
            # e.g., fused_embedding_id = storage_service.save_vector(final_vec)
            fused_embedding_id = "pending_storage"

        return PP2FusedProfile(
            category=final_category,
            brand=final_brand,
            color=final_color,
            caption=main_caption,
            merged_ocr_tokens=merged_ocr_tokens,
            attributes=merged_attributes,
            defects=sorted_defects,
            best_view_index=best_view.view_index,
            fused_embedding_id=fused_embedding_id
        )

    def _resolve_majority_vote(self, values: List[str], best_value: Optional[str], field_name: str, attributes: Dict) -> Optional[str]:
        """
        Helper to resolve majority vote.
        - values: list of non-null candidates
        - best_value: fallback value from best view
        - field_name: name for conflict logging
        - attributes: dict to append conflict info to
        """
        if not values:
            return best_value

        counts = Counter(values)
        total = len(values)
        
        # Check for strict majority (> 50%)
        # Or simple plurality? Prompt says "majority vote". Usually means > 50%.
        # Prompt: "if no majority, pick best_view value"
        # 3 items: Needs 2 matches.
        
        most_common = counts.most_common(1)
        if not most_common:
            return best_value
            
        winner, count = most_common[0]
        
        # Strict majority check
        if count > (total / 2):
            return winner
        else:
            # No majority
            # Mark conflict
            conflict_entry = attributes.get("conflicts", {})
            conflict_entry[field_name] = f"No majority. Candidates: {dict(counts)}. Picked best view: {best_value}"
            attributes["conflicts"] = conflict_entry
            return best_value
