"""Async pre-analysis job storage.

Module overview: mobile users receive a task id immediately while PP1/PP2 continues in
the background. Redis is preferred for shared state, but the in-memory fallback
keeps local/demo runs working when Redis is unavailable.
"""

import json
import logging
import threading
import time
from typing import Any, Dict, Optional

from app.config.settings import settings
from app.core.redis_client import get_healthy_redis_client

logger = logging.getLogger(__name__)

_memory_jobs: Dict[str, Dict[str, Any]] = {}
_memory_lock = threading.Lock()
_redis_fallback_active = False


def _job_key(task_id: str) -> str:
    return f"pre-analysis-job:{task_id}"


def _ttl_seconds() -> int:
    value = int(getattr(settings, "PRE_ANALYSIS_JOB_TTL_S", 900))
    return value if value > 0 else 900


def _now_ms() -> int:
    return int(time.time() * 1000)


def _normalize_job_value(value: Any) -> Any:
    """Convert numpy/model values into JSON-safe job payload values."""

    if value is None or isinstance(value, (bool, int, float, str)):
        return value

    if isinstance(value, dict):
        return {str(key): _normalize_job_value(item) for key, item in value.items()}

    if isinstance(value, list):
        return [_normalize_job_value(item) for item in value]

    if isinstance(value, (tuple, set)):
        return [_normalize_job_value(item) for item in value]

    item_method = getattr(value, "item", None)
    if callable(item_method):
        try:
            return _normalize_job_value(item_method())
        except Exception:
            pass

    tolist_method = getattr(value, "tolist", None)
    if callable(tolist_method):
        try:
            return _normalize_job_value(tolist_method())
        except Exception:
            pass

    return str(value)


def _payload_updated_at_ms(payload: Optional[Dict[str, Any]]) -> int:
    if not isinstance(payload, dict):
        return -1
    value = payload.get("updatedAtMs")
    return int(value) if isinstance(value, int) else -1


def _log_redis_fallback(reason: Optional[str] = None) -> None:
    global _redis_fallback_active
    if _redis_fallback_active:
        return
    _redis_fallback_active = True
    if reason:
        logger.warning(
            "Pre-analysis job store falling back to in-memory storage because Redis is unavailable: %s",
            reason,
        )
    else:
        logger.warning(
            "Pre-analysis job store falling back to in-memory storage because Redis is unavailable."
        )


def _mark_redis_healthy() -> None:
    global _redis_fallback_active
    _redis_fallback_active = False


def _get_usable_redis_client():
    redis_client = get_healthy_redis_client()
    if redis_client is None:
        _log_redis_fallback()
        return None

    _mark_redis_healthy()
    return redis_client


def _save_memory_job(task_id: str, stored: Dict[str, Any], ttl: int) -> Dict[str, Any]:
    expires_at = time.time() + ttl
    with _memory_lock:
        _memory_jobs[task_id] = {
            "payload": stored,
            "expires_at": expires_at,
        }
    return stored


def _get_memory_job(task_id: str) -> Optional[Dict[str, Any]]:
    now = time.time()
    with _memory_lock:
        entry = _memory_jobs.get(task_id)
        if not entry:
            return None
        if entry["expires_at"] <= now:
            _memory_jobs.pop(task_id, None)
            return None
        return entry["payload"]


def save_job(task_id: str, payload: Dict[str, Any], ttl_s: Optional[int] = None) -> Dict[str, Any]:
    """Create the initial async job record in memory and Redis when available."""

    ttl = ttl_s or _ttl_seconds()
    stored = _normalize_job_value({
        **payload,
        "taskId": task_id,
        "updatedAtMs": _now_ms(),
    })

    _save_memory_job(task_id, stored, ttl)

    redis_client = _get_usable_redis_client()
    if redis_client is not None:
        try:
            redis_client.setex(_job_key(task_id), ttl, json.dumps(stored))
            return stored
        except Exception as exc:
            _log_redis_fallback(str(exc))

    return stored


def get_job(task_id: str) -> Optional[Dict[str, Any]]:
    memory_job = _get_memory_job(task_id)
    redis_job = None
    redis_client = _get_usable_redis_client()
    if redis_client is not None:
        try:
            raw = redis_client.get(_job_key(task_id))
            redis_job = json.loads(raw) if raw else None
        except Exception as exc:
            _log_redis_fallback(str(exc))

    if redis_job is None:
        return memory_job
    if memory_job is None:
        return redis_job

    return memory_job if _payload_updated_at_ms(memory_job) >= _payload_updated_at_ms(redis_job) else redis_job


def update_job(task_id: str, patch: Dict[str, Any], ttl_s: Optional[int] = None) -> Dict[str, Any]:
    current = get_job(task_id) or {"taskId": task_id}
    current.update(patch)
    return save_job(task_id, current, ttl_s=ttl_s)
