import os
import threading
from typing import Any, Dict, List, Tuple

from dotenv import load_dotenv
from faster_whisper import WhisperModel

load_dotenv()

_model_lock = threading.Lock()
_model_instance: WhisperModel | None = None
_model_config: Tuple[str, str, str] | None = None


def _resolve_device() -> str:
    device = os.getenv("WHISPER_DEVICE", "auto").strip().lower()
    if device in {"cuda", "cpu"}:
        return device
    try:
        import torch
        return "cuda" if torch.cuda.is_available() else "cpu"
    except Exception:
        return "cpu"


def _resolve_compute_type(device: str) -> str:
    compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "").strip().lower()
    if compute_type:
        return compute_type
    return "float16" if device == "cuda" else "int8"


def _get_model() -> tuple[WhisperModel, str, str]:
    global _model_instance, _model_config

    model_name = os.getenv("WHISPER_MODEL", "small").strip() or "small"
    device = _resolve_device()
    compute_type = _resolve_compute_type(device)
    desired_config = (model_name, device, compute_type)

    with _model_lock:
        if _model_instance is not None and _model_config == desired_config:
            return _model_instance, device, compute_type

        last_error: Exception | None = None
        candidates = [desired_config]
        if device == "cuda":
            candidates.append((model_name, "cpu", "int8"))

        for candidate_model, candidate_device, candidate_compute_type in candidates:
            try:
                _model_instance = WhisperModel(
                    candidate_model,
                    device=candidate_device,
                    compute_type=candidate_compute_type,
                )
                _model_config = (candidate_model, candidate_device, candidate_compute_type)
                return _model_instance, candidate_device, candidate_compute_type
            except Exception as exc:
                last_error = exc

        raise RuntimeError(f"Failed to initialize faster-whisper model: {last_error}")


def transcribe_audio(audio_path: str, with_word_timestamps: bool = False) -> Dict[str, Any]:
    model, device, compute_type = _get_model()
    segments_iter, info = model.transcribe(
        audio_path,
        language="en",
        beam_size=int(os.getenv("WHISPER_BEAM_SIZE", "3")),
        word_timestamps=with_word_timestamps,
        condition_on_previous_text=False,
        vad_filter=True,
    )
    segments = list(segments_iter)
    text = " ".join((segment.text or "").strip() for segment in segments).strip()

    normalized_segments: List[Dict[str, Any]] = []
    for segment in segments:
        words = []
        if with_word_timestamps and getattr(segment, "words", None):
            words = [
                {
                    "word": getattr(word, "word", "") or "",
                    "start": float(getattr(word, "start", 0.0) or 0.0),
                    "end": float(getattr(word, "end", 0.0) or 0.0),
                    "probability": float(getattr(word, "probability", 0.0) or 0.0),
                }
                for word in segment.words
            ]

        normalized_segments.append({
            "start": float(getattr(segment, "start", 0.0) or 0.0),
            "end": float(getattr(segment, "end", 0.0) or 0.0),
            "text": (getattr(segment, "text", "") or "").strip(),
            "avg_logprob": float(getattr(segment, "avg_logprob", 0.0) or 0.0),
            "no_speech_prob": float(getattr(segment, "no_speech_prob", 0.0) or 0.0),
            "words": words,
        })

    return {
        "text": text,
        "segments": normalized_segments,
        "language": getattr(info, "language", None),
        "language_probability": float(getattr(info, "language_probability", 0.0) or 0.0),
        "model_device": device,
        "model_compute_type": compute_type,
        "model_name": os.getenv("WHISPER_MODEL", "small").strip() or "small",
    }
