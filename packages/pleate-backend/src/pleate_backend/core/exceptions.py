"""
Uniform error format for every endpoint:

    {"error": {"status": 400, "code": "validation_error", "message": "...",
               "fields": {"email": [{"code": "invalid", "message": "..."}]}}}

``code`` values are stable and meant to be translated by the client.
"""

from django.core.exceptions import PermissionDenied
from django.http import Http404
from django.utils.translation import gettext_lazy as _
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


class ApiError(exceptions.APIException):
    """Raise with a stable code: ``raise ApiError("email_taken", _("..."), 409)``."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "error"
    default_detail = _("Something went wrong.")

    def __init__(self, code: str, message=None, status_code: int | None = None, extra: dict | None = None):
        super().__init__(message or self.default_detail, code)
        self.code = code
        self.extra = extra or {}
        if status_code:
            self.status_code = status_code


def _field_errors(detail) -> dict:
    out: dict = {}
    for field, errors in detail.items():
        if isinstance(errors, dict):
            for sub, value in _field_errors(errors).items():
                out[f"{field}.{sub}"] = value
            continue
        if not isinstance(errors, list):
            errors = [errors]
        items = []
        for err in errors:
            if isinstance(err, dict):
                for sub, value in _field_errors(err).items():
                    out[f"{field}.{sub}"] = value
                continue
            items.append({"code": getattr(err, "code", "invalid"), "message": str(err)})
        if items:
            out[field] = items
    return out


def exception_handler(exc, context):
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied()
    if isinstance(exc, exceptions.PermissionDenied) and str(exc.detail).startswith("CSRF Failed"):
        # DRF's own CSRF check: give it the same stable code as CsrfProtectedMixin.
        exc = exceptions.PermissionDenied(str(exc.detail), code="csrf_failed")

    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    body: dict = {"status": response.status_code}
    if isinstance(exc, ApiError):
        body.update(code=exc.code, message=str(exc.detail), **exc.extra)
    elif isinstance(exc, exceptions.ValidationError):
        detail = exc.detail
        if isinstance(detail, dict):
            non_field = detail.pop("non_field_errors", None) if "non_field_errors" in detail else None
            fields = _field_errors(detail)
            if non_field:
                first = non_field[0]
                body.update(code=getattr(first, "code", "invalid"), message=str(first))
            else:
                body.update(code="validation_error", message=str(_("Some fields are not valid.")))
            if fields:
                body["fields"] = fields
        else:
            first = detail[0] if isinstance(detail, list) and detail else detail
            body.update(code=getattr(first, "code", "invalid"), message=str(first))
    else:
        codes = exc.get_codes() if hasattr(exc, "get_codes") else "error"
        code = codes if isinstance(codes, str) else getattr(exc, "default_code", "error")
        body.update(code=code, message=str(exc.detail))
        if isinstance(exc, exceptions.Throttled) and exc.wait is not None:
            body["retry_after"] = int(exc.wait)

    response.data = {"error": body}
    return response


def error_response(code: str, message, status_code: int = 400, **extra) -> Response:
    return Response(
        {"error": {"status": status_code, "code": code, "message": str(message), **extra}}, status=status_code
    )
