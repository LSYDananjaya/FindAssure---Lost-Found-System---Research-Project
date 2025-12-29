"""
Qwen2.5-VL service wrapper (local model).

Public API (kept compatible with FlorenceService usage in UnifiedPipeline):
- caption(image, detailed=True) -> str
- vqa(image, question) -> str
- ocr(image) -> str
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

Key design goals:
- Evidence-locked lists: features/defects/attachments are selected ONLY from CATEGORY_SPECS candidates,
  and ONLY if clearly visible.
- Attachments semantics: attachment must be a separate physical add-on attached to the main object.
  Built-in parts (holes/slots/handles that are part of the object) are NOT attachments.
- Optional attachment verification pass: yes/no VQA per attachment to reduce hallucinations.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import os
import re
import json

from PIL import Image

from app.domain.category_specs import canonicalize_label, CATEGORY_SPECS
from app.config.model_paths import BASE_MODELS_DIR


# ----------------------------
# Small helpers (caption safety)
# ----------------------------

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
        s = " ".join(str(it).strip().split())
        if not s:
            continue
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(s)
    return out


def _caption_mentions_person(text: str) -> bool:
    if not text:
        return False
    keywords = {
        "person", "hand", "finger", "skin", "holding", "man", "woman", "boy", "girl", "human"
    }
    words = set(re.findall(r"\b\w+\b", text.lower()))
    return bool(keywords & words)


def _caption_mentions_demographics(text: str) -> bool:
    if not text:
        return False
    t = text.lower()
    patterns = [
        r"person is (white|black|asian|brown)",
        r"skin tone",
        r"race",
        r"gender",
        r"ethnicity",
    ]
    return any(re.search(p, t) for p in patterns)


def _sanitize_caption(text: str) -> Tuple[str, List[str]]:
    """
    Drops sentences that mention person/hand/skin/demographics.
    Returns (sanitized_text, removed_sentences).
    """
    if not text:
        return "", []

    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    kept, removed = [], []

    for s in sentences:
        if _caption_mentions_person(s) or _caption_mentions_demographics(s):
            removed.append(s)
        else:
            kept.append(s)

    return " ".join(kept).strip(), removed


def _extract_json_content(text: str) -> str:
    """
    Robust JSON extraction:
    - strips code fences
    - returns content between first '{' and last '}'
    """
    if not text:
        return ""
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.I)
    t = re.sub(r"\s*```$", "", t)
    start = t.find("{")
    end = t.rfind("}")
    if start != -1 and end != -1 and end > start:
        return t[start : end + 1]
    return t


def _normalize_candidates(items: List[str]) -> List[str]:
    """
    Defensive cleanup: sometimes a spec accidentally contains multi-phrases in one string.
    We split on '.' and ';' when it looks like a packed list, but keep original if splitting is unsafe.
    """
    out: List[str] = []
    for it in items or []:
        s = " ".join(str(it).strip().split())
        if not s:
            continue

        # If it contains multiple clauses separated by ". " or "; " and is long, split.
        if (". " in s or ";" in s) and len(s) > 40:
            parts = re.split(r"[.;]\s+", s)
            for p in parts:
                p2 = " ".join(p.strip().split())
                if p2:
                    out.append(p2)
        else:
            out.append(s)

    return _dedup_phrases(out)


# ----------------------------
# Qwen2.5-VL core service
# ----------------------------

class QwenVLService:
    def __init__(
        self,
        model_path: Optional[str] = None,
        device: str = "cuda",
        torch_dtype: str = "auto",
        max_new_tokens: int = 512,
        temperature: float = 0.0,
        attachment_verify: bool = True,
    ) -> None:
        """
        model_path:
          - If None: uses env QWEN_VL_MODEL_PATH, else defaults to "models/Qwen2.5-VL-3B-Instruct"
          - Must be a LOCAL folder containing the downloaded model.

        attachment_verify:
          - If True, runs an extra yes/no verification per selected attachment (reduces hallucinations).
        """
        self.model_path = (
            model_path
            or os.getenv("QWEN_VL_MODEL_PATH")
            or os.path.join(BASE_MODELS_DIR, "Qwen2.5-VL-3B-Instruct")
        )
        self.device = device
        self.torch_dtype = torch_dtype
        self.max_new_tokens = max_new_tokens
        self.temperature = temperature
        self.attachment_verify = attachment_verify

        self._processor = None
        self._model = None
        self._process_vision_info = None  # optional helper from qwen_vl_utils

    def load_model(self) -> None:
        if self._model is not None and self._processor is not None:
            return

        if not os.path.exists(self.model_path):
            abs_path = os.path.abspath(self.model_path)
            raise RuntimeError(
                f"Qwen2.5-VL model not found at '{self.model_path}' (Absolute: '{abs_path}'). "
                f"BASE_MODELS_DIR='{BASE_MODELS_DIR}'. "
                f"Set QWEN_VL_MODEL_PATH or update the path."
            )

        import torch  # type: ignore

        # Optional helper library used by official Qwen-VL examples
        try:
            from qwen_vl_utils import process_vision_info  # type: ignore
            self._process_vision_info = process_vision_info
        except Exception:
            self._process_vision_info = None

        from transformers import AutoProcessor  # type: ignore
        # Qwen2.5-VL usually exposes a specific class, but Auto* works with trust_remote_code.
        # If you prefer: from transformers import Qwen2_5_VLForConditionalGeneration
        try:
            from transformers import Qwen2_5_VLForConditionalGeneration  # type: ignore
            ModelCls = Qwen2_5_VLForConditionalGeneration
        except Exception:
            from transformers import AutoModelForCausalLM  # type: ignore
            ModelCls = AutoModelForCausalLM

        # Device sanity
        if self.device == "cuda" and not torch.cuda.is_available():
            print("Warning: CUDA requested but not available. Falling back to CPU.")
            self.device = "cpu"

        # Processor
        self._processor = AutoProcessor.from_pretrained(
            self.model_path,
            trust_remote_code=True,
            local_files_only=True,
        )

        # Model loading
        model_kwargs: Dict[str, Any] = {
            "trust_remote_code": True,
            "local_files_only": True,
        }

        if self.torch_dtype != "auto":
            model_kwargs["torch_dtype"] = getattr(torch, self.torch_dtype)

        # Prefer device_map auto when on CUDA; else load normally and .to(cpu)
        if self.device == "cuda":
            model_kwargs["device_map"] = "auto"

        self._model = ModelCls.from_pretrained(self.model_path, **model_kwargs)

        if self.device == "cpu":
            self._model.to("cpu")

        self._model.eval()

    def _generate(self, messages: List[Dict[str, Any]]) -> str:
        """
        messages format (Qwen chat template style):
        [
          {"role": "user", "content": [{"type":"image","image": <PIL>}, {"type":"text","text":"..."}]}
        ]
        """
        self.load_model()
        assert self._model is not None and self._processor is not None

        import torch  # type: ignore

        # Build text prompt using chat template
        try:
            prompt_text = self._processor.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True,
            )
        except Exception:
            # Fallback: no chat template
            # Keep only user text and ignore roles.
            user_texts = []
            for m in messages:
                for part in m.get("content", []):
                    if part.get("type") == "text":
                        user_texts.append(part.get("text", ""))
            prompt_text = "\n".join(user_texts).strip()

        # Extract vision inputs
        images = None
        videos = None
        if self._process_vision_info is not None:
            try:
                image_inputs, video_inputs = self._process_vision_info(messages)
                images, videos = image_inputs, video_inputs
            except Exception:
                images, videos = None, None

        # If helper isn’t available, attempt a best-effort direct extraction of PIL images
        if images is None:
            imgs: List[Image.Image] = []
            for m in messages:
                for part in m.get("content", []):
                    if part.get("type") == "image" and isinstance(part.get("image"), Image.Image):
                        imgs.append(part["image"])
            images = imgs if imgs else None

        inputs = self._processor(
            text=[prompt_text],
            images=images,
            videos=videos,
            padding=True,
            return_tensors="pt",
        )

        # Move tensors to model device
        model_device = getattr(self._model, "device", None)
        if model_device is None:
            model_device = torch.device("cpu")
        inputs = {k: v.to(model_device) for k, v in inputs.items() if hasattr(v, "to")}

        gen_kwargs: Dict[str, Any] = {
            "max_new_tokens": self.max_new_tokens,
            "do_sample": self.temperature > 0,
            "temperature": self.temperature if self.temperature > 0 else None,
        }
        # remove None keys
        gen_kwargs = {k: v for k, v in gen_kwargs.items() if v is not None}

        with torch.no_grad():
            out_ids = self._model.generate(**inputs, **gen_kwargs)

        # Decode
        try:
            text = self._processor.batch_decode(out_ids, skip_special_tokens=True)[0]
        except Exception:
            text = _safe_str(out_ids)

        return str(text).strip()

    # ----------------------------
    # Public API: caption / vqa / ocr
    # ----------------------------

    def vqa(self, image: Image.Image, question: str) -> str:
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": question},
                ],
            }
        ]
        return self._generate(messages)

    def caption(self, image: Image.Image, detailed: bool = True) -> str:
        prompt = (
            "Describe ONLY the main object (ignore person/hand/background) in 2–4 sentences. "
            "Include: object type, material (if visible), color/shade, shape, logos/text (if visible), "
            "attachments that are separate physical add-ons (if visible), and any visible wear/defects "
            "(scratches, dents, cracks, stains, rust, bends). "
            "If something is not visible, say 'not visible'. Do NOT guess."
        )
        if not detailed:
            prompt = "Describe ONLY the main object (ignore person/hand/background) in 1 sentence. Do NOT guess."
        return self.vqa(image, prompt)

    def ocr(self, image: Image.Image) -> str:
        prompt = (
            "Read all text visible ON the main object. "
            "Return ONLY the text, preserving spelling/case as best as possible. "
            "If no text is visible, return 'None'."
        )
        text = self.vqa(image, prompt)
        text = text.strip()
        if text.lower() in {"none", "no", "n/a", "null"}:
            return ""
        # Keep it single-line-ish
        return "\n".join([line.strip() for line in text.splitlines() if line.strip()]).strip()

    # ----------------------------
    # Evidence extraction helpers
    # ----------------------------

    def _color_vqa(self, image: Image.Image) -> Optional[str]:
        q = (
            "What is the primary color of the OBJECT (not background)? "
            "Answer with a short phrase including shade/tone if visible (e.g., 'dark gray', 'navy blue', 'matte black'). "
            "If unsure, answer 'unknown'."
        )
        ans = self.vqa(image, q).strip()
        if not ans or ans.lower() == "unknown":
            return None
        # normalize whitespace
        return " ".join(ans.split())

    def _key_count_vqa(self, image: Image.Image) -> int:
        q = "How many separate keys are visible in this image? Answer with a single integer."
        ans = self.vqa(image, q)
        m = re.search(r"\b(\d+)\b", ans)
        if m:
            try:
                return int(m.group(1))
            except Exception:
                return 1
        return 1

    def _select_from_candidates(
        self,
        image: Image.Image,
        label: str,
        feature_list: List[str],
        defect_list: List[str],
        attachment_list: List[str],
        ocr_text: str,
        color: Optional[str],
    ) -> Dict[str, List[str]]:
        """
        Single-call strict selector:
        - Must choose ONLY from candidate lists
        - Must be clearly visible
        - Attachments must be separate physical add-ons only
        Returns {"features":[...], "defects":[...], "attachments":[...]} (lists may be empty).
        """
        feature_list = _normalize_candidates(feature_list)
        defect_list = _normalize_candidates(defect_list)
        attachment_list = _normalize_candidates(attachment_list)

        prompt = f"""
You are a strict visual inspector.

Analyze ONLY the main object in the image crop (ignore background, people, hands).
Choose which items from the candidate lists are PRESENT and CLEARLY VISIBLE on the object.

CRITICAL RULES:
- You MUST use ONLY exact phrases from the candidate lists.
- If you are not 100% sure an item is visible, DO NOT include it.
- "attachments" means separate physical add-ons attached to the main object.
  Built-in parts (holes/slots/loops/handles that are part of the object) are NOT attachments.
- If OCR_TEXT is provided, treat it as visible text.

Return VALID JSON ONLY (no markdown), with exactly:
{{
  "features": [string],
  "defects": [string],
  "attachments": [string]
}}

CONTEXT:
LABEL: {label}
PRIMARY_COLOR: {color or "Unknown"}
OCR_TEXT: {ocr_text or "None"}

FEATURE_CANDIDATES (use exact phrases only):
{json.dumps(feature_list, ensure_ascii=False, indent=2)}

DEFECT_CANDIDATES (use exact phrases only):
{json.dumps(defect_list, ensure_ascii=False, indent=2)}

ATTACHMENT_CANDIDATES (separate add-ons only; exact phrases only):
{json.dumps(attachment_list, ensure_ascii=False, indent=2)}
""".strip()

        messages = [
            {"role": "user", "content": [{"type": "image", "image": image}, {"type": "text", "text": prompt}]}
        ]
        raw = self._generate(messages)
        cleaned = _extract_json_content(raw)

        try:
            data = json.loads(cleaned) if cleaned else {}
        except Exception:
            data = {}

        feats = data.get("features") if isinstance(data.get("features"), list) else []
        defs = data.get("defects") if isinstance(data.get("defects"), list) else []
        atts = data.get("attachments") if isinstance(data.get("attachments"), list) else []

        # Enforce exact membership + dedup
        feats = _dedup_phrases([x for x in feats if x in feature_list])
        defs = _dedup_phrases([x for x in defs if x in defect_list])
        atts = _dedup_phrases([x for x in atts if x in attachment_list])

        return {"features": feats, "defects": defs, "attachments": atts}

    def _verify_attachment_yesno(self, image: Image.Image, attachment_phrase: str) -> bool:
        """
        Second-pass verification to reduce hallucinations.
        """
        q = (
            f"Visually verify the image: Is there a separate physical '{attachment_phrase}' "
            f"attached to the main object? Answer only 'yes' or 'no'."
        )
        ans = self.vqa(image, q).strip().lower()
        return ans.startswith("y")

    # ----------------------------
    # Main: analyze_crop (compat)
    # ----------------------------

    def analyze_crop(self, crop: Image.Image, canonical_label: Optional[str] = None) -> Dict[str, Any]:
        """
        Evidence extraction on a crop.
        1) Caption (sanitized)
        2) OCR
        3) Color VQA
        4) Key count VQA (if label == "Key")
        5) Evidence-locked selection of features/defects/attachments from CATEGORY_SPECS candidates
        6) Optional attachment verify pass (yes/no per attachment)
        """
        # label normalization
        spec_key = canonicalize_label(canonical_label) if canonical_label else None

        # 1) Caption (with sanitize)
        caption_primary = self.caption(crop, detailed=True)
        caption_final, removed = _sanitize_caption(caption_primary)

        # if sanitize empties it, try a stricter prompt
        caption_guided = None
        if (not caption_final or len(caption_final.split()) < 5) or _caption_mentions_person(caption_primary):
            guided_prompt = (
                "Describe ONLY the main object (ignore person/hand/background) in 2–4 sentences. "
                "Include: object type, material (if visible), color/shade, shape, logos/text (if visible), "
                "and any visible wear/defects. If something is not visible, say 'not visible'. Do NOT guess."
            )
            guided = self.vqa(crop, guided_prompt)
            caption_guided = guided
            caption_final2, removed2 = _sanitize_caption(guided)
            if caption_final2:
                caption_final = caption_final2
                removed.extend(removed2)

        # 2) OCR
        ocr_text = self.ocr(crop)

        # 3) Color
        color_vqa = self._color_vqa(crop)

        # 4) Key count
        key_count: Optional[int] = None
        if spec_key == "Key":
            key_count = self._key_count_vqa(crop)

        # 5) Candidate selection (features/defects/attachments)
        grounded_features: List[str] = []
        grounded_defects: List[str] = []
        grounded_attachments: List[str] = []

        selector_raw: Dict[str, Any] = {}

        if spec_key and spec_key in CATEGORY_SPECS:
            specs = CATEGORY_SPECS.get(spec_key, {})
            f_list = specs.get("features", []) or []
            d_list = specs.get("defects", []) or []
            a_list = specs.get("attachments", []) or []

            selected = self._select_from_candidates(
                crop,
                label=spec_key,
                feature_list=f_list,
                defect_list=d_list,
                attachment_list=a_list,
                ocr_text=ocr_text,
                color=color_vqa,
            )

            grounded_features = selected["features"]
            grounded_defects = selected["defects"]
            grounded_attachments = selected["attachments"]
            selector_raw = {"selected_json": selected}

            # 6) Optional per-attachment verification
            if self.attachment_verify and grounded_attachments:
                verified: List[str] = []
                for att in grounded_attachments:
                    try:
                        if self._verify_attachment_yesno(crop, att):
                            verified.append(att)
                    except Exception:
                        # If verification fails, be conservative and drop it
                        continue
                grounded_attachments = verified
                selector_raw["attachment_verify"] = {"before": selected["attachments"], "after": verified}

        raw: Dict[str, Any] = {
            "caption_primary": caption_primary,
            "caption_guided": caption_guided,
            "caption_final": caption_final,
            "caption_removed_sentences": removed,
            "ocr_text": ocr_text,
            "color_vqa": color_vqa,
            "selector_raw": selector_raw,
            "model_path": self.model_path,
        }

        return {
            "caption": caption_final,
            "ocr_text": ocr_text,
            "color_vqa": color_vqa,
            "grounded_features": grounded_features,
            "grounded_defects": grounded_defects,
            "grounded_attachments": grounded_attachments,
            "key_count": key_count,
            "raw": raw,
        }
