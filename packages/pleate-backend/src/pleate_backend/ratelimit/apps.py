from django.apps import AppConfig
from django.core import checks


class RateLimitConfig(AppConfig):
    name = "pleate_backend.ratelimit"
    label = "pleate_ratelimit"
    verbose_name = "pleate rate limiting"

    def ready(self):
        checks.register(check_shared_cache)


def check_shared_cache(app_configs=None, **kwargs):
    from django.conf import settings

    backend = settings.CACHES.get("default", {}).get("BACKEND", "")
    if settings.DEBUG or not backend.endswith("LocMemCache"):
        return []
    return [
        checks.Warning(
            "The default cache is LocMemCache: login lockout and rate limits are counted per process.",
            hint='Use a shared cache in production: globals().update(redis("redis://...")) in settings.',
            id="pleate_ratelimit.W001",
        )
    ]
