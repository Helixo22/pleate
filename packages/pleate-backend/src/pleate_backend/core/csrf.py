from django.middleware.csrf import CsrfViewMiddleware
from rest_framework import exceptions


class _Check(CsrfViewMiddleware):
    def _reject(self, request, reason):
        return reason


def _noop(request):
    return None


class CsrfProtectedMixin:
    """
    Enforces CSRF even for anonymous requests (DRF only does it for signed in
    users). Used by login, signup and the other cookie setting endpoints so a
    third party site cannot log a victim into an attacker account.
    """

    def initial(self, request, *args, **kwargs):
        raw = request._request
        if request.method not in ("GET", "HEAD", "OPTIONS", "TRACE") and not getattr(
            raw, "_dont_enforce_csrf_checks", False
        ):
            check = _Check(_noop)
            check.process_request(raw)
            reason = check.process_view(raw, None, (), {})
            if reason:
                raise exceptions.PermissionDenied(f"CSRF failed: {reason}", code="csrf_failed")
        super().initial(request, *args, **kwargs)
