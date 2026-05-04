"""BiFI similarity scorer for face and mesh feature streams.

Module overview:
- Measures frame-to-frame consistency with cosine similarity.
- Combines face and behavior confidence with explicit weights.
- Converts the final score into truthful, uncertain, or suspicious labels.
"""

import numpy as np
from scipy.spatial.distance import cosine

class BiFIScorer:
    """Score consistency across face and mesh vectors for a single video."""

    def similarity(self, v1, v2):
        if v1 is None or v2 is None:
            return 0.0
        try:
            return 1.0 - cosine(v1, v2)
        except:
            return 0.0

    def classify(self, score):
        if score >= 0.80:
            return "truthful"
        elif score >= 0.55:
            return "uncertain"
        else:
            return "suspicious"

    def score_single_video(self, face_vecs, mesh_vecs):
        """Fuse face and behavior vector stability into one compact result."""
        def avg_sim(vectors):
            sims = []
            for i in range(len(vectors) - 1):
                sims.append(self.similarity(vectors[i], vectors[i+1]))
            return float(np.mean(sims)) if sims else 0.0

        face_score = avg_sim(face_vecs)
        behavior_score = avg_sim(mesh_vecs)

        overall = (0.7 * face_score) + (0.3 * behavior_score)
        label = self.classify(overall)

        return {
            "face_confidence": round(face_score, 3),
            "behavior_confidence": round(behavior_score, 3),
            "overall": round(overall, 3),
            "label": label
        }

    def score_all(self, feature_list):
        return {"videos": feature_list}
