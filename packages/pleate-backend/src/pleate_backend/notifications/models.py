from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    # Free form type, for routing preferences and icons: "billing.payment_failed", "mention"...
    kind = models.CharField(_("kind"), max_length=64, db_index=True)
    title = models.CharField(_("title"), max_length=200)
    body = models.TextField(_("body"), blank=True)
    url = models.CharField(_("link"), max_length=500, blank=True)
    data = models.JSONField(default=dict, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    # Also the TTL index: notifications older than RETENTION_DAYS are dropped by MongoDB.
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"], name="notification_user_created")]

    def __str__(self):
        return self.title


class Preference(models.Model):
    """Which channels each kind of notification goes to: ``{"*": ["in_app"], "billing": ["email"]}``."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_preference"
    )
    channels = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.user)


class PushSubscription(models.Model):
    """A Web Push subscription of one browser."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="push_subscriptions"
    )
    endpoint = models.URLField(max_length=1000, unique=True)
    p256dh = models.CharField(max_length=200)
    auth = models.CharField(max_length=100)
    user_agent = models.CharField(max_length=400, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.endpoint
