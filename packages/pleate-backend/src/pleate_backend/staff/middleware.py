from django.http import JsonResponse
from django.urls import NoReverseMatch, reverse
from django.utils.translation import gettext as _

from pleate_backend.core.utils import client_ip


class BanMiddleware:
    """
    Answers 403 ``banned`` to clients whose IP falls in an active ``Ban``.
    The health check is never blocked. Reads a cached list, so a warm request
    costs no database query.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self._health = None

    def _is_health(self, path: str) -> bool:
        if self._health is None:
            try:
                self._health = reverse("health")
            except NoReverseMatch:
                self._health = ""
        return path == self._health if self._health else path.rstrip("/").endswith("/health")

    def __call__(self, request):
        from .bans import is_banned

        if not self._is_health(request.path_info) and is_banned(client_ip(request)):
            return JsonResponse(
                {
                    "error": {
                        "status": 403,
                        "code": "banned",
                        "message": _("Access from your network has been blocked."),
                    }
                },
                status=403,
            )
        return self.get_response(request)
