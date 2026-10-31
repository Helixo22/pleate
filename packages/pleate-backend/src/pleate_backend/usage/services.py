from django.apps import apps
from django.utils.translation import gettext as _

from pleate_backend.core.cache import cached
from pleate_backend.core.conf import pleate_settings

CACHE_SECONDS = 30


def _installed(name: str) -> bool:
    return apps.is_installed(f"pleate_backend.{name}")


@cached(lambda user: f"usage:{user.pk}", ttl=CACHE_SECONDS)
def _numbers(user) -> dict:
    """One query per item, cached: ``{"plan", "items": [(id, used, limit, unit)]}``."""
    items = []
    if _installed("files"):
        from pleate_backend.files.services import usage

        items.append(("storage", usage(user), pleate_settings.FILES["USER_QUOTA"], "bytes"))
    if _installed("ai_chat"):
        from pleate_backend.ai_chat.services import usage_today

        limit = pleate_settings.AI["DAILY_TOKEN_LIMIT"] or None
        items.append(("ai_tokens", usage_today(user).total_tokens, limit, "tokens"))
    if _installed("apikeys"):
        from pleate_backend.apikeys.services import MAX_ACTIVE_KEYS, active_keys

        items.append(("api_keys", active_keys(user).count(), MAX_ACTIVE_KEYS, "keys"))
    if _installed("webhooks"):
        from pleate_backend.webhooks.models import Endpoint
        from pleate_backend.webhooks.services import MAX_ENDPOINTS

        items.append(
            ("webhooks", Endpoint.objects.filter(owner_id=user.pk).count(), MAX_ENDPOINTS, "endpoints")
        )
    plan = None
    if _installed("billing"):
        from pleate_backend.billing.services import current_plan_id

        plan = current_plan_id(user)
    return {"plan": plan, "items": items}


def labels() -> dict:
    # Outside the cache, so each request gets its own language.
    return {
        "storage": _("Storage"),
        "ai_tokens": _("AI tokens today"),
        "api_keys": _("API keys"),
        "webhooks": _("Webhook endpoints"),
    }


def usage_summary(user) -> dict:
    numbers = _numbers(user)
    names = labels()
    return {
        "plan": numbers["plan"],
        "items": [
            {"id": id_, "label": names[id_], "used": used, "limit": limit, "unit": unit}
            for id_, used, limit, unit in numbers["items"]
        ],
    }
