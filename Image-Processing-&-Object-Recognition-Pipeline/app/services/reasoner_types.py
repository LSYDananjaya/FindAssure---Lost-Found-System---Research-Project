from __future__ import annotations

from typing import Any, Dict, List, Optional, Protocol, runtime_checkable


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
        super().__init__(message)
        self.status_code = status_code
        self.provider_status = provider_status
        self.retryable = retryable
        self.error_type = error_type

    def to_dict(self) -> Dict[str, Any]:
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
        ...

    def analyze_pp2_view(self, evidence_json: Dict[str, Any], crop_image: Optional[Any] = None) -> Dict[str, Any]:
        ...

    def confirm_pp2_view(self, evidence_json: Dict[str, Any], crop_image: Optional[Any] = None) -> Dict[str, Any]:
        ...

    def run_phase2(
        self,
        evidence_bundle_json: Dict[str, Any],
        images: Optional[List[Any]] = None,
    ) -> Dict[str, Any]:
        ...

    def consume_last_request_meta(self) -> Dict[str, Any]:
        ...
