"""
Names of the events endpoints can subscribe to.

    from pleate_backend.webhooks.registry import register_event
    register_event("invoice.paid", "An invoice was paid.")

Projects can also list them in ``PLEATE["WEBHOOKS"]["EVENTS"]`` as names or
``{"name": ..., "description": ...}`` dicts.
"""

from django.utils.translation import gettext_lazy as _

from pleate_backend.core.conf import pleate_settings

_events: dict = {}


def register_event(name: str, description="") -> None:
    _events[name] = description


def events() -> list[dict]:
    """``[{"name", "description"}]`` sorted by name, settings included."""
    merged = dict(_events)
    for item in pleate_settings.WEBHOOKS.get("EVENTS") or []:
        if isinstance(item, dict):
            merged[item["name"]] = item.get("description", "")
        else:
            merged.setdefault(str(item), "")
    return [{"name": name, "description": str(desc)} for name, desc in sorted(merged.items())]


def is_registered(name: str) -> bool:
    return any(item["name"] == name for item in events())


register_event("ping", _("Sent by the test button to check an endpoint."))
register_event("user.created", _("A user signed up."))
register_event("user.deleted", _("A user deleted their account."))
