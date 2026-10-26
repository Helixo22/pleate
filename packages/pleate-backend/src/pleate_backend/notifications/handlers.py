from django.dispatch import receiver

from pleate_backend.accounts.signals import collect_user_data
from pleate_backend.core.conf import pleate_settings
from pleate_backend.core.mongo import ensure_ttl_index


def ensure_indexes(**kwargs):
    from .models import Notification

    days = pleate_settings.NOTIFICATIONS["RETENTION_DAYS"]
    if days:
        ensure_ttl_index(Notification, "created_at", int(days) * 24 * 60 * 60)


@receiver(collect_user_data, dispatch_uid="pleate_notifications_export")
def export_notifications(sender, user, **kwargs):
    from .models import Notification, Preference, PushSubscription

    pref = Preference.objects.filter(user=user).first()
    return "notifications", {
        "preferences": pref.channels if pref else {},
        "push_subscriptions": [
            {"endpoint": s.endpoint, "user_agent": s.user_agent, "created_at": s.created_at.isoformat()}
            for s in PushSubscription.objects.filter(user=user)
        ],
        "items": [
            {
                "id": str(n.pk),
                "kind": n.kind,
                "title": n.title,
                "body": n.body,
                "url": n.url,
                "data": n.data,
                "read_at": n.read_at.isoformat() if n.read_at else None,
                "created_at": n.created_at.isoformat(),
            }
            for n in Notification.objects.filter(user=user).order_by("created_at")
        ],
    }
