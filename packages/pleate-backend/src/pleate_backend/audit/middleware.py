import logging

from pleate_backend.core.conf import pleate_settings

from .context import current_request

logger = logging.getLogger("pleate.audit")


class AuditContextMiddleware:
    """
    Remembers the current request for ``log_activity``. Goes right after
    ``AuthenticationMiddleware``. With ``AUDIT["LOG_READS"]`` it also records
    every successful API read made by a signed in user (``api.read``).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token = current_request.set(request)
        try:
            response = self.get_response(request)
            if (
                pleate_settings.AUDIT.get("LOG_READS")
                and request.method == "GET"
                and response.status_code < 400
            ):
                self._log_read(request, response)
            return response
        finally:
            current_request.reset(token)

    def _log_read(self, request, response):
        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated:
            return
        from .services import log_activity

        log_activity("api.read", request=request, path=request.path[:300], status=response.status_code)
