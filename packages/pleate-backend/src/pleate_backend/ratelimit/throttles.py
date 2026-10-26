"""
DRF throttles backed by ``limits.hit``. They also publish the standard
``RateLimit-Limit``, ``RateLimit-Remaining`` and ``RateLimit-Reset`` headers
through ``RateLimitHeadersMiddleware``.

Rates come from ``REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]``. A view picks a
named scope with ``throttle_scope = "auth"`` and ``ScopedRateThrottle``.
"""

from rest_framework.settings import api_settings
from rest_framework.throttling import BaseThrottle

from pleate_backend.core.utils import client_ip

from . import limits

PERIODS = {"s": 1, "sec": 1, "m": 60, "min": 60, "h": 3600, "hour": 3600, "d": 86400, "day": 86400}


def parse_rate(rate: str) -> tuple[int, int]:
    num, period = rate.split("/")
    return int(num), PERIODS[period]


class _Throttle(BaseThrottle):
    scope: str | None = None
    fail_closed = False

    def get_scope(self, view):
        return self.scope

    def get_ident_key(self, request, view) -> str | None:
        raise NotImplementedError

    def allow_request(self, request, view):
        scope = self.get_scope(view)
        rate = api_settings.DEFAULT_THROTTLE_RATES.get(scope) if scope else None
        ident = self.get_ident_key(request, view) if rate else None
        if not rate or ident is None:
            return True
        limit, window = parse_rate(rate)
        key = f"{scope}:{ident}"
        allowed, self.wait_seconds = limits.hit(key, limit, window, fail_closed=self.fail_closed)
        info = {"limit": limit, "remaining": limits.remaining(key, limit, window), "reset": window}
        if not allowed:
            info.update(remaining=0, reset=self.wait_seconds)
        holder = getattr(request, "_request", request)
        previous = getattr(holder, "_pleate_ratelimit", None)
        if previous is None or info["remaining"] < previous["remaining"]:
            holder._pleate_ratelimit = info
        return allowed

    def wait(self):
        return getattr(self, "wait_seconds", None)


class AnonRateThrottle(_Throttle):
    scope = "anon"

    def get_ident_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return None
        return f"ip:{client_ip(request)}"


class UserRateThrottle(_Throttle):
    scope = "user"

    def get_ident_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"user:{request.user.pk}"
        return None


class ScopedRateThrottle(_Throttle):
    """Per view scope (``throttle_scope``), per user when signed in, else per IP."""

    def get_scope(self, view):
        return getattr(view, "throttle_scope", None)

    def get_ident_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return f"user:{request.user.pk}"
        return f"ip:{client_ip(request)}"


class StrictScopedRateThrottle(ScopedRateThrottle):
    """Same, but denies when the cache is down. For authentication endpoints."""

    fail_closed = True
