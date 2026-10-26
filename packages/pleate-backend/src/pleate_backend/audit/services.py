import datetime
import decimal
import logging
import uuid

from pleate_backend.core.logging import request_id_var
from pleate_backend.core.utils import client_ip, user_agent

from .context import get_current_request

logger = logging.getLogger("pleate.audit")

MASK = "********"
# A field or metadata key containing one of these is never stored in clear.
SENSITIVE = ("password", "secret", "token", "key_hash", "api_key", "otp", "credential", "private_key")


def is_sensitive(name: str) -> bool:
    lowered = str(name).lower()
    return any(part in lowered for part in SENSITIVE)


def to_json(value):
    """A JSON friendly copy of ``value`` (ObjectIds, dates and decimals become strings)."""
    if value is None or isinstance(value, bool | int | float | str):
        return value
    if isinstance(value, dict):
        return {str(k): to_json(v) for k, v in value.items()}
    if isinstance(value, list | tuple | set | frozenset):
        return [to_json(v) for v in value]
    if isinstance(value, datetime.datetime | datetime.date | datetime.time):
        return value.isoformat()
    if isinstance(value, decimal.Decimal | uuid.UUID):
        return str(value)
    if isinstance(value, bytes):
        return f"<{len(value)} bytes>"
    if hasattr(value, "pk") and hasattr(value, "_meta"):
        return str(value.pk)
    return str(value)


def mask(data: dict | None) -> dict:
    """Masks sensitive keys, recursively."""
    out = {}
    for key, value in (data or {}).items():
        if is_sensitive(key):
            out[key] = MASK
        elif isinstance(value, dict):
            out[key] = mask(value)
        else:
            out[key] = to_json(value)
    return out


def _mask_changes(changes: dict | None) -> dict:
    out = {}
    for field, pair in (changes or {}).items():
        before, after = (list(pair) + [None, None])[:2] if isinstance(pair, list | tuple) else (None, pair)
        if is_sensitive(field):
            out[field] = [MASK if before is not None else None, MASK if after is not None else None]
        else:
            out[field] = [to_json(before), to_json(after)]
    return out


def describe_target(target) -> tuple[str, str, str]:
    """``(target_type, target_id, target_repr)`` for a model instance or a tuple."""
    if target is None:
        return "", "", ""
    if isinstance(target, tuple | list):
        parts = [str(p) if p is not None else "" for p in target] + ["", "", ""]
        return parts[0][:100], parts[1][:64], parts[2][:200]
    meta = getattr(target, "_meta", None)
    if meta is not None:
        try:
            label = str(target)
        except Exception:  # noqa: BLE001
            label = ""
        return f"{meta.app_label}.{meta.model_name}", str(target.pk or ""), label[:200]
    return type(target).__name__[:100], "", str(target)[:200]


def log_activity(action: str, *, actor=None, target=None, changes=None, request=None, **metadata):
    """
    Records an activity entry. Never raises: a failure is logged and ``None``
    is returned, so auditing cannot break the request that triggered it.

    ``request`` defaults to the current request (``AuditContextMiddleware``),
    ``actor`` to its signed in user. ``target`` is a model instance or a
    ``(type, id, repr)`` tuple. Extra keyword arguments land in ``metadata``.
    Sensitive keys (password, secret, token...) are masked.
    """
    try:
        from .models import ActivityLog

        request = request if request is not None else get_current_request()
        if actor is None and request is not None:
            user = getattr(request, "user", None)
            if user is not None and getattr(user, "is_authenticated", False):
                actor = user
        if actor is not None and not getattr(actor, "pk", None):
            actor = None
        target_type, target_id, target_repr = describe_target(target)
        entry = ActivityLog(
            actor=actor,
            actor_email=metadata.pop("actor_email", None) or (getattr(actor, "email", "") or "")[:254],
            action=action[:100],
            target_type=target_type,
            target_id=target_id,
            target_repr=target_repr,
            changes=_mask_changes(changes),
            metadata=mask(metadata),
        )
        if request is not None:
            entry.ip = client_ip(request)[:45]
            entry.user_agent = user_agent(request)
            entry.request_id = (getattr(request, "request_id", None) or request_id_var.get() or "")[:64]
        else:
            entry.request_id = (request_id_var.get() or "")[:64]
        entry.save()
        return entry
    except Exception:  # noqa: BLE001
        logger.exception("could not record activity %s", action)
        return None
