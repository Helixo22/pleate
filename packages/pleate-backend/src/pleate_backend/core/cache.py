"""
Caching helpers on top of Django's cache (configure Redis with
``pleate_backend.settings.redis(url)``).

    from pleate_backend.core.cache import cached, invalidate

    @cached("plans", ttl=300)
    def load_plans(): ...

    @cached(lambda user: f"dashboard:{user.pk}", ttl=60)
    def dashboard(user): ...

    invalidate("plans")

``ETagMixin`` adds conditional GET to any DRF view: the response carries an
ETag and a matching ``If-None-Match`` gets a 304 with no body.
"""

import functools
import hashlib
import json

from django.core.cache import cache
from rest_framework import status
from rest_framework.response import Response

_PREFIX = "pl:cache:"
_MISS = object()


def cached(key, ttl: int = 300):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            name = key(*args, **kwargs) if callable(key) else key
            full = _PREFIX + name
            try:
                value = cache.get(full, _MISS)
            except Exception:  # noqa: BLE001
                return func(*args, **kwargs)
            if value is not _MISS:
                return value
            value = func(*args, **kwargs)
            try:
                cache.set(full, value, ttl)
            except Exception:  # noqa: BLE001
                pass
            return value

        wrapper.invalidate = lambda *a, **kw: invalidate(key(*a, **kw) if callable(key) else key)
        return wrapper

    return decorator


def invalidate(name: str) -> None:
    try:
        cache.delete(_PREFIX + name)
    except Exception:  # noqa: BLE001
        pass


def etag_for(data) -> str:
    raw = json.dumps(data, sort_keys=True, default=str).encode()
    return '"' + hashlib.sha256(raw).hexdigest()[:32] + '"'


class ETagMixin:
    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if (
            request.method in ("GET", "HEAD")
            and isinstance(response, Response)
            and response.status_code == 200
        ):
            tag = etag_for(response.data)
            if tag in [t.strip() for t in request.headers.get("If-None-Match", "").split(",")]:
                not_modified = Response(status=status.HTTP_304_NOT_MODIFIED)
                not_modified["ETag"] = tag
                return super().finalize_response(request, not_modified, *args, **kwargs)
            response["ETag"] = tag
            response.setdefault("Cache-Control", "private, no-cache")
        return response
