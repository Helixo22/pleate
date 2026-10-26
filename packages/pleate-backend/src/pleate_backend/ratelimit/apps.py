from django.apps import AppConfig


class RateLimitConfig(AppConfig):
    name = "pleate_backend.ratelimit"
    label = "pleate_ratelimit"
    verbose_name = "pleate rate limiting"
