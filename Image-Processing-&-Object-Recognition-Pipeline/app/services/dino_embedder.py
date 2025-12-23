"""
DINOv2 embedder for image vectors.

- Uses facebook/dinov2-base by default.
- Returns:
  - raw embedding (768d) and
  - a deterministic projected 128d vector (for storage / indexing).

Why projection?
- You asked for vector_128d; in production you'd ideally train a projection head
  or use PCA fitted on your dataset. This deterministic random projection is a
  pragmatic placeholder that is stable across runs.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Tuple

import numpy as np
from PIL import Image


class DINOEmbedder:
    def __init__(
        self,
        model_name: str = "facebook/dinov2-base",
        device: str = "cuda",
        projection_dim: int = 128,
        projection_seed: int = 42,
    ) -> None:
        self.model_name = model_name
        
        import torch
        if device == "cuda" and not torch.cuda.is_available():
            print("Warning: CUDA requested but not available. Falling back to CPU.")
            self.device = "cpu"
        else:
            self.device = device

        self.projection_dim = projection_dim
        self.projection_seed = projection_seed

        self._processor = None
        self._model = None
        self._proj = None  # np.ndarray (D x projection_dim)

    def load_model(self) -> None:
        if self._model is not None and self._processor is not None:
            return
        from transformers import AutoImageProcessor, AutoModel  # type: ignore
        import torch  # type: ignore

        self._processor = AutoImageProcessor.from_pretrained(self.model_name)
        self._model = AutoModel.from_pretrained(self.model_name)
        if self.device:
            self._model.to(self.device)
        self._model.eval()

    def _projection(self, in_dim: int) -> np.ndarray:
        if self._proj is None or self._proj.shape[0] != in_dim:
            rng = np.random.default_rng(self.projection_seed)
            # Random Gaussian projection, scaled.
            proj = rng.normal(size=(in_dim, self.projection_dim)).astype(np.float32)
            proj /= np.sqrt(in_dim)
            self._proj = proj
        return self._proj

    def embed_768(self, image: Image.Image) -> np.ndarray:
        self.load_model()
        assert self._processor is not None and self._model is not None

        import torch  # type: ignore

        inputs = self._processor(images=image, return_tensors="pt")
        if self.device:
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self._model(**inputs)
            # DINOv2 returns last_hidden_state: [B, N, D]
            # Use CLS token (index 0).
            vec = outputs.last_hidden_state[:, 0, :].detach().cpu().numpy()[0]
        return vec.astype(np.float32)

    def embed_128(self, image: Image.Image) -> np.ndarray:
        v = self.embed_768(image)
        proj = self._projection(v.shape[0])
        v128 = v @ proj
        return v128.astype(np.float32)

    @staticmethod
    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        # normalize for cosine similarity (this is mathematical normalization, not "logic shortcuts")
        na = np.linalg.norm(a) + 1e-12
        nb = np.linalg.norm(b) + 1e-12
        return float(np.dot(a, b) / (na * nb))
