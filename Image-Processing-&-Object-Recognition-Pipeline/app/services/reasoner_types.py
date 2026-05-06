"""Shared reasoner error types and protocol contracts."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Protocol, runtime_checkable

# These messages are part of the API-facing fallback contract. Keep them stable
# unless the frontend and tests are updated together.

RETRYABLE_UNAVAILABLE_MESSAGE = "Reasoning service temporarily unavailable. Please retry."
REASONING_FAILED_MESSAGE = "Reasoning failed."


class ReasonerServiceError(RuntimeError):
    def __init__(
        self,
        message: str,
        *,
        status_code: Optional[int] = None,
        provider_status: Optional[str] = None,
        retryable: bool = False,
        error_type: str = "reasoner_error",
    ) -> None:
        """Initialize a reasoner service error with provider and retry metadata."""
        super().__init__(message)
        self.status_code = status_code
        self.provider_status = provider_status
        self.retryable = retryable
        self.error_type = error_type

    def to_dict(self) -> Dict[str, Any]:
        """Serialize the error object into an API-friendly dictionary."""
        return {
            "type": self.error_type,
            "status_code": self.status_code,
            "retryable": self.retryable,
            "provider_status": self.provider_status,
            "message": str(self),
        }


class ReasonerTransientError(ReasonerServiceError):
    def __init__(
        self,
        message: str,
        *,
        status_code: Optional[int] = None,
        provider_status: Optional[str] = None,
    ) -> None:
        """Initialize a transient reasoner error that can be retried or bypassed."""
        super().__init__(
            message,
            status_code=status_code,
            provider_status=provider_status,
            retryable=True,
            error_type="reasoner_transient_error",
        )


class ReasonerQuotaError(ReasonerTransientError):
    def __init__(
        self,
        message: str,
        *,
        status_code: Optional[int] = None,
        provider_status: Optional[str] = None,
    ) -> None:
        """Initialize a quota-related transient reasoner error."""
        super().__init__(message, status_code=status_code, provider_status=provider_status)
        self.error_type = "reasoner_quota_error"


class ReasonerFatalError(ReasonerServiceError):
    def __init__(
        self,
        message: str,
        *,
        status_code: Optional[int] = None,
        provider_status: Optional[str] = None,
    ) -> None:
        """Initialize a fatal reasoner error that should stop fallback attempts."""
        super().__init__(
            message,
            status_code=status_code,
            provider_status=provider_status,
            retryable=False,
            error_type="reasoner_fatal_error",
        )


@runtime_checkable
class ReasonerProtocol(Protocol):
    def run_phase1(self, florence_evidence_json: Dict[str, Any], crop_image: Optional[Any] = None) -> Dict[str, Any]:
        """Run phase-1 reasoning over PP1 evidence."""
        ...

    def analyze_pp2_view(self, evidence_json: Dict[str, Any], crop_image: Optional[Any] = None) -> Dict[str, Any]:
        """Run per-view PP2 reasoning over one view evidence payload."""
        ...

    def confirm_pp2_view(self, evidence_json: Dict[str, Any], crop_image: Optional[Any] = None) -> Dict[str, Any]:
        """Confirm one PP2 view against provided evidence."""
        ...

    def run_phase2(
        self,
        evidence_bundle_json: Dict[str, Any],
        images: Optional[List[Any]] = None,
    ) -> Dict[str, Any]:
        """Run the PP2 phase-2 reasoning prompt and normalize the result."""
        ...

    def consume_last_request_meta(self) -> Dict[str, Any]:
        """Return and clear metadata for the most recent Gemini request."""
        ...
