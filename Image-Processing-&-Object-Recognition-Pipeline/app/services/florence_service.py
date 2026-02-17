"""
Florence-2 service wrapper.

Responsibilities:
- caption(image, detailed=True) -> str
- analyze_crop(crop, canonical_label=None) -> dict:
    {
      "caption": str,
      "ocr_text": str,
      "color_vqa": str | None,
      "grounded_features": list[str],
      "grounded_defects": list[str],
      "grounded_attachments": list[str],
      "key_count": int | None,
      "raw": dict
    }

Notes:
- Loads model from local path: app/models/florence2-base-ft/
- Fails fast if model path is missing.
- Uses CATEGORY_SPECS for grounding candidates.
- For PP2, list-style grounded fields are normalized in the pipeline into
  a strict dict-based `grounded_features` contract.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
import os
import re
import logging
import time

from PIL import Image

from app.domain.category_specs import canonicalize_label, CATEGORY_SPECS
from app.config.settings import settings

logger = logging.getLogger(__name__)


@dataclass
class Detection:
    label: str
    confidence: float
    bbox: Tuple[int, int, int, int]  # x1,y1,x2,y2


def _safe_str(x: Any) -> str:
    if x is None:
        return ""
    if isinstance(x, str):
        return x
    try:
        return str(x)
    except Exception:
        return ""


def _dedup_phrases(items: List[str]) -> List[str]:
    out: List[str] = []
    seen = set()
    for it in items or []:
        s = " ".join(it.strip().split())
        if not s:
            continue
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(s)
    return out


def _normalize_grounding_candidates(candidates: List[str]) -> List[str]:
    """
    Splits combined strings (e.g. "scratch. dent") and normalizes phrases.
    """
    out = []
    for c in candidates:
        # Split by common delimiters
        parts = re.split(r'[.,;|]', c)
        for p in parts:
            s = p.strip()
            if s:
                out.append(s)
    # Dedup case-insensitive
    seen = set()
    final = []
    for x in out:
        k = x.lower()
        if k not in seen:
            seen.add(k)
            final.append(x)
    return final


def _chunk_list(items: List[str], chunk_size: int = 25) -> List[List[str]]:
    return [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]


def _caption_mentions_person(text: str) -> bool:
    """True if text mentions person-related words."""
    if not text:
        return False
    keywords = {"person", "hand", "finger", "skin", "holding", "man", "woman", "boy", "girl", "human"}
    text_lower = text.lower()
    words = set(re.findall(r"\b\w+\b", text_lower))
    return bool(keywords & words)


def _caption_mentions_demographics(text: str) -> bool:
    """True if text mentions demographics or skin tone."""
    if not text:
        return False
    text_lower = text.lower()
    patterns = [
        r"person is (white|black|asian|brown)",
        r"skin tone",
        r"race",
        r"gender",
        r"ethnicity"
    ]
    for p in patterns:
        if re.search(p, text_lower):
            return True
    return False


def _sanitize_caption(text: str) -> Tuple[str, List[str]]:
    """
    Splits caption into sentences and drops those mentioning person/hand/skin.
    Returns (sanitized_text, removed_sentences).
    """
    if not text:
        return "", []
    
    # Split by . ! ? but keep delimiters. Simple split by . is often enough for Florence.
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    kept = []
    removed = []
    
    for s in sentences:
        if _caption_mentions_person(s) or _caption_mentions_demographics(s):
            removed.append(s)
        else:
            kept.append(s)
            
    return " ".join(kept).strip(), removed


def _is_generic_caption(text: str) -> bool:
    """
    Returns True if caption is too short or matches generic patterns.
    """
    if not text:
        return True
    
    # 1. Length check (< 10 words)
    words = text.split()
    if len(words) < 10:
        return True
        
    text_lower = text.lower()
    
    # 2. Generic patterns check
    intros = ["in this picture", "in this image", "we can see", "this picture shows", "there is", "an image of", "a photo of"]
    clean_text = text_lower
    for intro in intros:
        if clean_text.startswith(intro):
            clean_text = clean_text[len(intro):].strip()
            
    # If remainder is very short (< 4 words), it's generic (e.g. "a bag", "an object")
    if len(clean_text.split()) < 4:
        return True
    
    # Check for specific generic phrases
    generic_phrases = ["a bag", "an object", "a person"]
    for phrase in generic_phrases:
        if phrase in clean_text and len(clean_text.split()) <= len(phrase.split()) + 2:
             return True
             
    return False


class FlorenceService:
    def __init__(
        self,
        model_path: str = "app/models/florence2-base-ft/",
        device: str = "cuda",
        torch_dtype: str = "auto",
        max_new_tokens: int = 512,
    ) -> None:
        self.model_path = model_path
        
        import torch
        if device == "cuda" and not torch.cuda.is_available():
            print("Warning: CUDA requested but not available. Falling back to CPU.")
            self.device = "cpu"
        else:
            self.device = device

        self.torch_dtype = torch_dtype
        self.max_new_tokens = max_new_tokens
        self.fast_max_new_tokens = settings.FLORENCE_FAST_MAX_NEW_TOKENS
        self.fast_num_beams = settings.FLORENCE_FAST_NUM_BEAMS
        self.perf_profile = str(settings.PERF_PROFILE).lower()

        self._processor = None
        self._model = None

    # ----------------------------
    # Model loading / core runner
    # ----------------------------
    def load_model(self) -> None:
        if self._model is not None and self._processor is not None:
            return

        if not os.path.exists(self.model_path):
            raise RuntimeError(f"Florence model not found at {self.model_path}. Please ensure weights are present locally.")

        from transformers import AutoModelForCausalLM, AutoProcessor, dynamic_module_utils  # type: ignore
        import torch  # type: ignore
        from unittest.mock import patch

        # Workaround for flash_attn dependency on Windows
        original_check_imports = dynamic_module_utils.check_imports

        def custom_check_imports(filename):
            try:
                return original_check_imports(filename)
            except ImportError as e:
                if "flash_attn" in str(e):
                    return []
                raise e

        kwargs = {"trust_remote_code": True, "local_files_only": True}
        
        try:
            with patch("transformers.dynamic_module_utils.check_imports", side_effect=custom_check_imports):
                self._processor = AutoProcessor.from_pretrained(self.model_path, **kwargs)
        except Exception as e:
             raise RuntimeError(f"Failed to load Florence processor from {self.model_path}: {e}")

        # dtype
        if self.torch_dtype == "auto":
            model_kwargs = {"trust_remote_code": True, "local_files_only": True}
        else:
            dtype = getattr(torch, self.torch_dtype)
            model_kwargs = {"trust_remote_code": True, "torch_dtype": dtype, "local_files_only": True}
        
        # Use SDPA attention if available (PyTorch 2.0+) to avoid flash_attn dependency
        if hasattr(torch.nn.functional, "scaled_dot_product_attention"):
             model_kwargs["attn_implementation"] = "sdpa"
        else:
             model_kwargs["attn_implementation"] = "eager"

        try:
            with patch("transformers.dynamic_module_utils.check_imports", side_effect=custom_check_imports):
                self._model = AutoModelForCausalLM.from_pretrained(self.model_path, **model_kwargs)
        except Exception as e:
            # Fallback: try without attn_implementation if it fails (some older transformers versions)
            if "attn_implementation" in model_kwargs:
                del model_kwargs["attn_implementation"]
                try:
                    with patch("transformers.dynamic_module_utils.check_imports", side_effect=custom_check_imports):
                        self._model = AutoModelForCausalLM.from_pretrained(self.model_path, **model_kwargs)
                except Exception as e2:
                    raise RuntimeError(f"Failed to load Florence model from {self.model_path}: {e2}")
            else:
                raise RuntimeError(f"Failed to load Florence model from {self.model_path}: {e}")

        if self.device:
            self._model.to(self.device)
        self._model.eval()

    def _run_task(
        self,
        image: Image.Image,
        task: str,
        text: Optional[str] = None,
        profile: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run a Florence task and return post-processed JSON when possible.

        task examples (commonly used with Florence-2):
          "<CAPTION>", "<DETAILED_CAPTION>", "<OCR>", "<VQA>"
        """
        self.load_model()
        assert self._processor is not None and self._model is not None

        import torch  # type: ignore

        prompt = task if text is None else f"{task} {text}"
        inputs = self._processor(text=prompt, images=image, return_tensors="pt")

        if self.device:
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

        profile_key = (profile or self.perf_profile or "balanced").lower()
        if profile_key == "fast":
            max_tokens = self.fast_max_new_tokens
            num_beams = self.fast_num_beams
        else:
            max_tokens = self.max_new_tokens
            num_beams = 3

        with torch.no_grad():
            generated_ids = self._model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                num_beams=num_beams,
                do_sample=False,
            )

        generated_text = self._processor.batch_decode(generated_ids, skip_special_tokens=False)[0]

        # Try Florence's post-process helper. If it fails, return raw text.
        try:
            out = self._processor.post_process_generation(
                generated_text,
                task=task,
                image_size=(image.width, image.height),
            )
            if isinstance(out, dict):
                out["_raw_text"] = generated_text
                out["_task"] = task
                return out
            return {"_raw_text": generated_text, "_task": task, "result": out}
        except Exception:
            return {"_raw_text": generated_text, "_task": task}

    # ----------------------------
    # Public API
    # ----------------------------
    def detect_objects(self, image: Image.Image) -> List[Detection]:
        """
        Runs Florence-2 Object Detection (<OD>) and maps results to allowed labels.
        NOTE: Not used in PP1 (UnifiedPipeline), which uses YOLOv8m.
        """
        try:
            # Run <OD> task
            out = self._run_task(image, "<OD>")
            
            # Parse result. Florence <OD> returns:
            # {'<OD>': {'bboxes': [[x1, y1, x2, y2], ...], 'labels': ['label1', ...], 'polygons': ...}}
            # or sometimes just the dict directly if post-processing worked.
            
            data = out.get("<OD>") or out.get("OD")
            if not data or not isinstance(data, dict):
                # Fallback check if it's in 'result' key
                data = out.get("result", {}).get("<OD>")
                
            if not data:
                return []

            bboxes = data.get("bboxes", [])
            labels = data.get("labels", [])
            
            detections: List[Detection] = []
            
            for box, label_raw in zip(bboxes, labels):
                # Florence labels are often lower case or slightly different.
                canonical = canonicalize_label(label_raw)
                if not canonical:
                    continue
                
                # Florence bboxes are [x1, y1, x2, y2]
                x1, y1, x2, y2 = [int(c) for c in box]
                
                # Florence doesn't give confidence scores for OD in the standard output,
                # so we assign a default high confidence since it detected it.
                # Or we could try to extract it if we used a different task, but <OD> is standard.
                conf = 0.9 
                
                detections.append(Detection(
                    label=canonical,
                    confidence=conf,
                    bbox=(x1, y1, x2, y2)
                ))
                
            return detections
            
        except Exception as e:
            print(f"Florence detection error: {e}")
            return []

    def caption(self, image: Image.Image, detailed: bool = True, profile: Optional[str] = None) -> str:
        # Try multiple levels of detail if requested
        tasks = ["<MORE_DETAILED_CAPTION>", "<DETAILED_CAPTION>", "<CAPTION>"] if detailed else ["<CAPTION>"]
        
        for task in tasks:
            try:
                out = self._run_task(image, task, profile=profile)
                # Check standard keys
                for k in (task, "caption", "CAPTION", "DETAILED_CAPTION", "MORE_DETAILED_CAPTION"):
                    if k in out and isinstance(out[k], str) and out[k].strip():
                        return out[k].strip()
                
                # Fallback: raw text
                raw = out.get("_raw_text", "")
                s = _safe_str(raw).strip()
                if s:
                    return s
            except Exception:
                continue
                
        return ""

    def vqa(self, image: Image.Image, question: str, profile: Optional[str] = None) -> str:
        """
        VQA task. Returns a plain short answer string.
        """
        try:
            out = self._run_task(image, "<VQA>", question, profile=profile)
            # Different Florence revs return different keys.
            # Try common patterns.
            for k in ("answer", "vqa", "VQA", "<VQA>"):
                val = out.get(k)
                if isinstance(val, str) and val.strip():
                    return val.strip()
                if isinstance(val, list) and val:
                    # sometimes list of answers
                    s = _safe_str(val[0]).strip()
                    if s:
                        return s
            # last resort: parse raw text (often contains "Answer:" or similar)
            raw = _safe_str(out.get("_raw_text", ""))
            m = re.search(r"(?i)answer\s*:\s*([^\n<]+)", raw)
            if m:
                return m.group(1).strip()
            return raw.strip()
        except Exception:
            return ""

    def ocr(self, image: Image.Image, profile: Optional[str] = None) -> str:
        """
        OCR task. Returns plain concatenated text. If OCR task unsupported, returns "".
        """
        try:
            out = self._run_task(image, "<OCR>", profile=profile)
            # Some variants return {"text": "..."} or a list of lines.
            for k in ("text", "ocr", "<OCR>"):
                val = out.get(k)
                if isinstance(val, str):
                    return val.strip()
                if isinstance(val, list):
                    parts = [_safe_str(x).strip() for x in val]
                    parts = [p for p in parts if p]
                    return "\n".join(parts).strip()

            # Sometimes OCR returns tokens with boxes:
            # {"tokens": [{"text": "..."} ...]}
            tokens = out.get("tokens")
            if isinstance(tokens, list):
                parts = []
                for t in tokens:
                    if isinstance(t, dict) and "text" in t:
                        parts.append(_safe_str(t["text"]).strip())
                parts = [p for p in parts if p]
                return "\n".join(parts).strip()

            return ""
        except Exception:
            return ""

    def ground_phrases(self, image: Image.Image, text: str, profile: Optional[str] = None) -> Dict[str, Any]:
        """
        Runs Phrase Grounding task (<CAPTION_TO_PHRASE_GROUNDING>).
        'text' should be a comma-separated list of phrases or a sentence.
        """
        # Florence-2 expects the task token and the text input
        return self._run_task(image, "<CAPTION_TO_PHRASE_GROUNDING>", text, profile=profile)

    @staticmethod
    def _resize_for_lite(image: Image.Image, max_side: int = 512) -> Image.Image:
        if not isinstance(image, Image.Image):
            return image
        w, h = image.size
        if w <= 0 or h <= 0:
            return image
        longest = max(w, h)
        if longest <= max_side:
            return image

        scale = float(max_side) / float(longest)
        new_w = max(1, int(round(w * scale)))
        new_h = max(1, int(round(h * scale)))
        return image.resize((new_w, new_h), Image.BILINEAR)

    @staticmethod
    def _run_with_timeout(fn, timeout_ms: int, *args, **kwargs):
        timeout_sec = max(1, int(timeout_ms)) / 1000.0
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(fn, *args, **kwargs)
            try:
                return future.result(timeout=timeout_sec)
            except FuturesTimeoutError as exc:
                raise TimeoutError(f"Operation exceeded timeout of {timeout_ms} ms") from exc

    def _analyze_crop_lite_core(self, crop: Image.Image, profile_key: str) -> Dict[str, Any]:
        lite_prompt = (
            "Return only what you can see about the main object. "
            "Use one short factual sentence. If unsure, return empty."
        )
        guided_caption = self.vqa(crop, lite_prompt, profile=profile_key).strip()
        sanitized_guided, _ = _sanitize_caption(guided_caption)

        fallback_caption = ""
        if not sanitized_guided:
            fallback_caption_raw = self.caption(crop, detailed=False, profile=profile_key)
            sanitized_fallback, _ = _sanitize_caption(fallback_caption_raw)
            fallback_caption = sanitized_fallback.strip()

        caption_candidate = sanitized_guided.strip() or fallback_caption
        if caption_candidate:
            first_sentence = re.split(r"(?<=[.!?])\s+", caption_candidate.strip())[0].strip()
            final_caption = first_sentence
        else:
            final_caption = ""

        ocr_text = self.ocr(crop, profile=profile_key)
        color_q = (
            "What is the primary color of the object? "
            "Answer with a short phrase or 'unknown'."
        )
        color_vqa = self.vqa(crop, color_q, profile=profile_key).strip() or None
        if color_vqa and color_vqa.lower() == "unknown":
            color_vqa = None

        return {
            "caption": final_caption,
            "ocr_text": ocr_text,
            "color_vqa": color_vqa,
            "grounded_features": [],
            "grounded_defects": [],
            "grounded_attachments": [],
            "key_count": None,
            "raw": {
                "caption_source": "lite_caption",
                "guided_caption": guided_caption,
                "lite_prompt": lite_prompt,
            },
        }

    def analyze_crop(
        self,
        crop: Image.Image,
        canonical_label: Optional[str] = None,
        profile: Optional[str] = None,
        mode: str = "full",
    ) -> Dict[str, Any]:
        """
        Evidence extraction on a crop.

        1. Caption (Detailed) AND Guided VQA (Object-only).
           - Select best sanitized caption.
        2. OCR
        3. Color VQA (Specific Prompt)
        4. Key Count VQA (if label == "Key")
        5. Phrase Grounding (Features, Defects, Attachments) - Split calls.
        6. Defects VQA (Extra evidence).
        """
        profile_key = (profile or self.perf_profile or "balanced").lower()
        mode_key = str(mode or "full").lower().strip()

        if mode_key == "lite":
            lite_start = time.perf_counter()
            timeout_ms = int(getattr(settings, "FLORENCE_LITE_TIMEOUT_MS", 3000))
            try:
                resized_crop = self._resize_for_lite(crop, max_side=512)
                lite_out = self._run_with_timeout(
                    self._analyze_crop_lite_core,
                    timeout_ms,
                    resized_crop,
                    profile_key,
                )
                if not isinstance(lite_out, dict):
                    raise RuntimeError("Lite output must be a dict")

                raw = lite_out.get("raw", {})
                if not isinstance(raw, dict):
                    raw = {}
                timings = raw.get("timings", {})
                if not isinstance(timings, dict):
                    timings = {}
                timings["lite_ms"] = round((time.perf_counter() - lite_start) * 1000.0, 2)
                raw["timings"] = timings
                raw.setdefault("caption_source", "lite_caption")
                lite_out["raw"] = raw
                return lite_out
            except TimeoutError as exc:
                return {
                    "caption": "",
                    "ocr_text": "",
                    "color_vqa": None,
                    "grounded_features": [],
                    "grounded_defects": [],
                    "grounded_attachments": [],
                    "key_count": None,
                    "raw": {
                        "caption_source": "lite_caption",
                        "error": {"type": "timeout", "message": str(exc)},
                        "timings": {
                            "lite_ms": round((time.perf_counter() - lite_start) * 1000.0, 2),
                        },
                    },
                }
            except Exception as exc:
                return {
                    "caption": "",
                    "ocr_text": "",
                    "color_vqa": None,
                    "grounded_features": [],
                    "grounded_defects": [],
                    "grounded_attachments": [],
                    "key_count": None,
                    "raw": {
                        "caption_source": "lite_caption",
                        "error": {"type": "error", "message": str(exc)},
                        "timings": {
                            "lite_ms": round((time.perf_counter() - lite_start) * 1000.0, 2),
                        },
                    },
                }

        # 1. Captioning Strategy
        # Always run both detailed caption and guided VQA to get best object description
        
        # A) Detailed Caption
        raw_caption = self.caption(crop, detailed=(profile_key != "fast"), profile=profile_key)
        sanitized_caption, _ = _sanitize_caption(raw_caption)
        
        # B) Guided VQA (Object-only)
        guide_prompt = (
            "Describe ONLY the main object (ignore the person/hand and background) in 2–4 sentences. "
            "Include: object type, material (if visible), primary color/shade, shape, any logos/text (if visible), "
            "any attachments/accessories (only separate add-ons like a metal ring, lanyard, tag, or remote fob — if clearly visible), and any visible wear/defects "
            "(scratches, dents, cracks, stains, rust, bends). If something is not visible, say 'not visible'. "
            "Do NOT mention the person, hand, skin, gender, or race. Do NOT guess. Do NOT treat holes/slots/built-in parts as attachments."
        )
        guided_val = self.vqa(crop, guide_prompt, profile=profile_key) if profile_key != "fast" else ""
        sanitized_guided, _ = _sanitize_caption(guided_val)
        
        # Selection Logic: Prefer guided if it's substantial, else fallback to sanitized caption
        # Guided is usually better for "object only" constraint.
        if len(sanitized_guided.split()) >= 5:
            final_caption = sanitized_guided
            caption_source = "guided_vqa"
        elif len(sanitized_caption.split()) >= 5:
            final_caption = sanitized_caption
            caption_source = "detailed_caption"
        else:
            # Both failed to produce good text, use whatever we have
            final_caption = sanitized_guided if len(sanitized_guided) > len(sanitized_caption) else sanitized_caption
            caption_source = "fallback"

        # 2. OCR
        ocr_text = self.ocr(crop, profile=profile_key)

        # 3. Color VQA
        color_q = (
            "What is the primary color of the OBJECT (not the background)? "
            "Answer with a short phrase including shade/tone if visible (e.g., 'dark gray', 'navy blue', 'matte black'). "
            "If unsure, answer 'unknown'."
        )
        color_vqa = self.vqa(crop, color_q, profile=profile_key).strip() or None
        if color_vqa and color_vqa.lower() == "unknown":
            color_vqa = None

        # 4. Key Count (Conditional)
        key_count: Optional[int] = None
        if canonical_label == "Key":
            kc_q = "How many separate keys are visible in this image? Answer with a single integer."
            kc_ans = self.vqa(crop, kc_q, profile=profile_key)
            m = re.search(r"\\b(\\d+)\\b", kc_ans)
            if m:
                try:
                    key_count = int(m.group(1))
                except Exception:
                    key_count = 1
            else:
                key_count = 1

        spec_key = canonicalize_label(canonical_label) if canonical_label else None

        # Fast profile: keep only core extraction fields and feature grounding.
        if profile_key == "fast":
            grounded_features: List[str] = []
            raw_grounding_labels: List[str] = []

            if spec_key and spec_key in CATEGORY_SPECS:
                specs = CATEGORY_SPECS[spec_key]
                normalized = _normalize_grounding_candidates(specs.get("features", []))
                if normalized:
                    chunks = _chunk_list(normalized, chunk_size=25)
                    found_items = set()
                    for chunk in chunks:
                        prompt_text = ", ".join(chunk)
                        g_out = self.ground_phrases(crop, prompt_text, profile=profile_key)
                        g_data = g_out.get("<CAPTION_TO_PHRASE_GROUNDING>") or g_out.get("result", {}).get("<CAPTION_TO_PHRASE_GROUNDING>")
                        if g_data and "labels" in g_data:
                            detected_labels = [l.strip().lower() for l in g_data["labels"]]
                            raw_grounding_labels.extend(g_data["labels"])
                            for cand in chunk:
                                if cand.lower() in detected_labels:
                                    found_items.add(cand)
                    grounded_features = list(found_items)

            raw_fast: Dict[str, Any] = {
                "caption": final_caption,
                "caption_primary": raw_caption,
                "caption_guided": guided_val,
                "caption_source": caption_source,
                "ocr": ocr_text,
                "color_vqa": color_vqa,
                "defects_vqa": "None",
                "grounding_raw": {
                    "labels": raw_grounding_labels
                },
                "attachment_vqa_checks": [],
            }

            return {
                "caption": final_caption,
                "ocr_text": ocr_text,
                "color_vqa": color_vqa,
                "grounded_features": grounded_features,
                "grounded_defects": [],
                "grounded_attachments": [],
                "key_count": key_count,
                "raw": raw_fast,
            }

        # 5. Grounding (Features, Defects, Attachments)
        grounded_features = []
        grounded_defects = []
        grounded_attachments = []
        
        raw_grounding_labels = []
        attachment_vqa_checks = []

        if spec_key and spec_key in CATEGORY_SPECS:
            specs = CATEGORY_SPECS[spec_key]
            
            # Helper to run grounding on a list of candidates
            def run_grounding_for_list(candidates: List[str]) -> List[str]:
                normalized = _normalize_grounding_candidates(candidates)
                if not normalized:
                    return []
                
                found_items = set()
                # Chunk to avoid context limits
                chunks = _chunk_list(normalized, chunk_size=25)
                
                for chunk in chunks:
                    # Use comma separation for list of phrases
                    prompt_text = ", ".join(chunk)
                    g_out = self.ground_phrases(crop, prompt_text, profile=profile_key)
                    
                    # Parse result
                    g_data = g_out.get("<CAPTION_TO_PHRASE_GROUNDING>") or g_out.get("result", {}).get("<CAPTION_TO_PHRASE_GROUNDING>")
                    
                    if g_data and "labels" in g_data:
                        # Florence returns labels found. We match them back to our candidates.
                        # Match case-insensitive.
                        detected_labels = [l.strip().lower() for l in g_data["labels"]]
                        raw_grounding_labels.extend(g_data["labels"])
                        
                        for cand in chunk:
                            if cand.lower() in detected_labels:
                                found_items.add(cand)
                                
                return list(found_items)

            # Run separately
            grounded_features = run_grounding_for_list(specs.get("features", []))
            grounded_defects = run_grounding_for_list(specs.get("defects", []))
            
            # Attachments with extra validation
            raw_grounded_attachments = run_grounding_for_list(specs.get("attachments", []))
            
            # Validate attachments with VQA
            for att in raw_grounded_attachments:
                q = f"Is there a separate {att} physically attached to the main object? Answer yes or no."
                ans = self.vqa(crop, q, profile=profile_key).strip().lower()
                is_valid = ans.startswith("yes")
                
                attachment_vqa_checks.append({
                    "attachment": att,
                    "answer": ans,
                    "kept": is_valid
                })
                
                if is_valid:
                    grounded_attachments.append(att)

        # 6. Defects VQA (Extra Evidence)
        defects_vqa_q = "List any visible wear or damage on the object using short phrases (e.g., scratches, dents, rust, cracks, stains, bent). If none, answer 'none'."
        defects_vqa_ans = self.vqa(crop, defects_vqa_q, profile=profile_key)
        if defects_vqa_ans.lower() in ["none", "no", "n/a"]:
            defects_vqa_ans = "None"

        raw: Dict[str, Any] = {
            "caption": final_caption,
            "caption_primary": raw_caption,
            "caption_guided": guided_val,
            "caption_source": caption_source,
            "ocr": ocr_text,
            "color_vqa": color_vqa,
            "defects_vqa": defects_vqa_ans,
            "grounding_raw": {
                "labels": raw_grounding_labels
            },
            "attachment_vqa_checks": attachment_vqa_checks
        }

        return {
            "caption": final_caption,
            "ocr_text": ocr_text,
            "color_vqa": color_vqa,
            "grounded_features": grounded_features,
            "grounded_defects": grounded_defects,
            "grounded_attachments": grounded_attachments,
            "key_count": key_count,
            "raw": raw,
        }
