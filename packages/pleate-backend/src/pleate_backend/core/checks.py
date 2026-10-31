from django.conf import settings
from django.core.checks import Tags, Warning, register

from .conf import pleate_settings


@register(Tags.compatibility)
def realtime_broker(app_configs, **kwargs):
    if settings.DEBUG or not pleate_settings.REALTIME["BACKEND"].endswith(".MemoryBroker"):
        return []
    return [
        Warning(
            "PLEATE['REALTIME'] uses the in-memory MemoryBroker with DEBUG off.",
            hint="SSE events and AI stop flags stay inside one process; use "
            "pleate_backend.core.realtime.RedisBroker with more than one process.",
            id="pleate_core.W001",
        )
    ]
