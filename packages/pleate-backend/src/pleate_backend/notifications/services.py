"""
Sending notifications from any app:

    from pleate_backend.notifications.services import notify
    notify(user, "billing.payment_failed", _("Payment failed"), body="...", url="/billing")

Channels come from ``channels`` when given, else the user's preference for the
kind, else their ``"*"`` preference, else ``PLEATE["NOTIFICATIONS"]["DEFAULT_CHANNELS"]``.
"""

import json
import logging

from django.utils import translation
from django.utils.translation import gettext as _

from pleate_backend.core.conf import frontend_url, pleate_settings
from pleate_backend.core.realtime import broker

from .models import Notification, Preference, PushSubscription

logger = logging.getLogger("pleate.notifications")


def user_channel(user) -> str:
    return f"user:{user.pk}"


def _conf() -> dict:
    return pleate_settings.NOTIFICATIONS


def available_channels() -> list[str]:
    return list(_conf()["CHANNELS"])


def stored_preferences(user) -> dict:
    pref = Preference.objects.filter(user=user).first()
    return dict(pref.channels) if pref else {}


def preferences_payload(user) -> dict:
    channels = stored_preferences(user)
    channels.setdefault("*", list(_conf()["DEFAULT_CHANNELS"]))
    return {"channels": channels, "available_channels": available_channels()}


def resolve_channels(user, kind: str) -> list[str]:
    prefs = stored_preferences(user)
    if kind in prefs:
        return list(prefs[kind])
    if "*" in prefs:
        return list(prefs["*"])
    return list(_conf()["DEFAULT_CHANNELS"])


def unread_count(user) -> int:
    return Notification.objects.filter(user=user, read_at__isnull=True).count()


def unread_event(user) -> dict:
    return {"type": "unread_count", "data": {"count": unread_count(user)}}


def publish_unread_count(user) -> None:
    broker().publish(user_channel(user), unread_event(user))


def serialize(notification: Notification) -> dict:
    from .serializers import NotificationSerializer

    return NotificationSerializer(notification).data


def absolute_url(url: str) -> str:
    if not url:
        return frontend_url("NOTIFICATIONS")
    if url.startswith("/"):
        return pleate_settings.FRONTEND_URL.rstrip("/") + url
    return url


def send_email_notification(user, title: str, body: str, url: str) -> None:
    from pleate_backend.emails import send_email

    if not user.email:
        return
    language = user.locale or None
    with translation.override(language or translation.get_language()):
        label = _("Open")
    send_email(
        "notification",
        user.email,
        {"title": title, "body": body, "action_url": absolute_url(url), "action_label": label},
        language,
    )


def push_configured() -> bool:
    conf = _conf()
    return bool(conf["VAPID_PUBLIC_KEY"] and conf["VAPID_PRIVATE_KEY"])


def send_push(user, payload: dict) -> int:
    """Sends to every browser of the user. Silent when VAPID keys or pywebpush are missing."""
    if not push_configured():
        return 0
    try:
        import pywebpush
    except ImportError:
        logger.warning("push notifications need pywebpush: pip install pleate-backend[push]")
        return 0
    conf = _conf()
    sent = 0
    for sub in PushSubscription.objects.filter(user=user):
        try:
            pywebpush.webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=json.dumps(payload, default=str),
                vapid_private_key=conf["VAPID_PRIVATE_KEY"],
                vapid_claims={"sub": conf["VAPID_SUBJECT"]},
                ttl=24 * 60 * 60,
                timeout=10,
            )
            sent += 1
        except pywebpush.WebPushException as exc:
            status = getattr(getattr(exc, "response", None), "status_code", None)
            if status in (404, 410):
                sub.delete()
            else:
                logger.warning("push to %s failed: %s", sub.endpoint[:60], exc)
        except Exception:  # noqa: BLE001
            logger.warning("push to %s failed", sub.endpoint[:60], exc_info=True)
    return sent


def notify(
    user,
    kind: str,
    title: str,
    body: str = "",
    url: str = "",
    data: dict | None = None,
    channels: list[str] | None = None,
) -> Notification | None:
    """
    Notifies a user on the resolved channels. Returns the in app Notification,
    or None when ``in_app`` is not one of them. Email and push failures are
    logged, never raised.
    """
    if user is None or not getattr(user, "is_active", True):
        return None
    allowed = set(available_channels())
    chosen = channels if channels is not None else resolve_channels(user, kind)
    chosen = [c for c in dict.fromkeys(chosen) if c in allowed]

    notification = None
    if "in_app" in chosen:
        notification = Notification.objects.create(
            user=user, kind=kind[:64], title=title[:200], body=body or "", url=url or "", data=data or {}
        )
        try:
            realtime = broker()
            realtime.publish(user_channel(user), {"type": "notification", "data": serialize(notification)})
            realtime.publish(user_channel(user), unread_event(user))
        except Exception:  # noqa: BLE001
            logger.warning("realtime publish failed", exc_info=True)

    if "email" in chosen:
        try:
            send_email_notification(user, title, body, url)
        except Exception:  # noqa: BLE001
            logger.warning("notification email failed", exc_info=True)

    if "push" in chosen:
        payload = {
            "id": str(notification.pk) if notification else None,
            "kind": kind,
            "title": title,
            "body": body,
            "url": url,
            "data": data or {},
        }
        send_push(user, payload)

    return notification
