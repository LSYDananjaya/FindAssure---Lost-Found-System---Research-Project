"""Process-local GPU serialization helpers."""

from __future__ import annotations

from contextlib import contextmanager
import logging
import threading
import time
from typing import Iterator

logger = logging.getLogger(__name__)

# Global, process-wide GPU gate shared by all service threads.
# The pipeline can run OCR, captioning, and embedding work in parallel threads,
# but most local GPU deployments behave better when heavyweight inference calls
# are serialized at this boundary.
GPU_SEMAPHORE = threading.Semaphore(1)


@contextmanager
def gpu_inference_guard(op_name: str, component: str) -> Iterator[None]:
    """Serialize GPU inference for one operation and log wait/hold timing."""
    comp = str(component or "unknown")
    op = str(op_name or "unknown")
    wait_start = time.perf_counter()
    logger.debug("GPU_SEMAPHORE_WAIT component=%s op=%s", comp, op)

    # Acquire before entering the caller's inference block so queue time and
    # hold time can be measured separately in logs.
    GPU_SEMAPHORE.acquire()
    hold_start = time.perf_counter()
    queue_ms = (hold_start - wait_start) * 1000.0
    logger.debug(
        "GPU_SEMAPHORE_ACQUIRED component=%s op=%s queue_ms=%.2f",
        comp,
        op,
        queue_ms,
    )
    try:
        yield
    finally:
        # Always release the gate even when the protected inference call raises.
        hold_ms = (time.perf_counter() - hold_start) * 1000.0
        logger.debug(
            "GPU_SEMAPHORE_RELEASED component=%s op=%s hold_ms=%.2f",
            comp,
            op,
            hold_ms,
        )
        GPU_SEMAPHORE.release()
