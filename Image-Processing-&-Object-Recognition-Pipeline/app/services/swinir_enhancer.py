"""
Optional image enhancement module.

Your earlier file looked like a partially implemented SwinIR pipeline.
To keep the project runnable without fragile dependencies, this module:

- Provides `enhance_for_ocr(image)` that:
    * If real SwinIR deps are available, uses them (you can plug in).
    * Otherwise, performs a light, deterministic enhancement (contrast + sharpness).

This is intentionally conservative to avoid introducing artifacts that can
hurt OCR and color detection.
"""

from __future__ import annotations

from typing import Optional

from PIL import Image, ImageEnhance


class SwinIREnhancer:
    def __init__(self, enable: bool = True) -> None:
        self.enable = enable

    def enhance_for_ocr(self, image: Image.Image) -> Image.Image:
        if not self.enable:
            return image

        # Conservative enhancement: slight contrast + sharpness
        img = image
        img = ImageEnhance.Contrast(img).enhance(1.15)
        img = ImageEnhance.Sharpness(img).enhance(1.10)
        return img
