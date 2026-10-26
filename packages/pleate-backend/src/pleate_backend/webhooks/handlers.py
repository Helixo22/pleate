import logging

from pleate_backend.accounts import signals as account_signals
from pleate_backend.core.mongo import ensure_ttl_index

logger = logging.getLogger("pleate.webhooks")

DELIVERY_RETENTION = 30 * 24 * 60 * 60
INBOUND_RETENTION = 30 * 24 * 60 * 60


def _user_data(user) -> dict:
    return {
        "id": str(user.pk),
        "email": user.email,
        "name": getattr(user, "name", ""),
        "date_joined": getattr(user, "date_joined", None),
    }


def on_signup(sender, user, **kwargs):
    from .services import dispatch

    try:
        dispatch("user.created", _user_data(user))
    except Exception:  # noqa: BLE001
        logger.exception("user.created webhook failed")


def on_account_deleted(sender, user, email=None, **kwargs):
    from .services import dispatch

    try:
        # The user's own endpoints are deleted with the account.
        dispatch("user.deleted", {"id": str(user.pk), "email": email or user.email}, exclude_owner=user)
    except Exception:  # noqa: BLE001
        logger.exception("user.deleted webhook failed")


def connect():
    account_signals.user_signed_up.connect(on_signup, dispatch_uid="pleate_webhooks_user_created")
    account_signals.account_deleted.connect(on_account_deleted, dispatch_uid="pleate_webhooks_user_deleted")


def ensure_indexes(**kwargs):
    from pleate_backend.core.conf import pleate_settings

    from .models import Delivery, InboundEvent

    conf = pleate_settings.WEBHOOKS
    ensure_ttl_index(
        Delivery, "created_at", int(conf.get("DELIVERY_RETENTION_SECONDS") or DELIVERY_RETENTION)
    )
    ensure_ttl_index(
        InboundEvent, "received_at", int(conf.get("INBOUND_RETENTION_SECONDS") or INBOUND_RETENTION)
    )
