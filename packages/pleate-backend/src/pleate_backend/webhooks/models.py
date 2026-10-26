from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Endpoint(models.Model):
    """A URL that receives signed POSTs for the events it subscribes to."""

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    url = models.URLField(_("URL"), max_length=2000)
    description = models.CharField(_("description"), max_length=200, blank=True)
    secret = models.CharField(max_length=100)
    # ["*"] or a list of event names.
    events = models.JSONField(default=list)
    active = models.BooleanField(default=True)
    consecutive_failures = models.PositiveIntegerField(default=0)
    disabled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("webhook endpoint")
        verbose_name_plural = _("webhook endpoints")

    def __str__(self):
        return self.url

    @property
    def masked_secret(self) -> str:
        return f"whsec_{'*' * 8}{self.secret[-4:]}" if self.secret else ""

    def wants(self, event: str) -> bool:
        events = self.events or []
        return "*" in events or event in events


class Delivery(models.Model):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    STATUSES = [(PENDING, _("Pending")), (SUCCESS, _("Success")), (FAILED, _("Failed"))]

    endpoint = models.ForeignKey(Endpoint, on_delete=models.CASCADE, related_name="deliveries")
    event_id = models.CharField(max_length=64, db_index=True)
    event = models.CharField(max_length=100, db_index=True)
    # The full body that is sent: {"id", "type", "created_at", "data"}.
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=10, choices=STATUSES, default=PENDING, db_index=True)
    attempts = models.PositiveIntegerField(default=0)
    # Set while a (re)try is due. None once the delivery is settled.
    next_attempt_at = models.DateTimeField(null=True, blank=True, db_index=True)
    last_status_code = models.PositiveIntegerField(null=True, blank=True)
    last_error = models.CharField(max_length=500, blank=True)
    response_excerpt = models.TextField(blank=True)
    duration_ms = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("webhook delivery")
        verbose_name_plural = _("webhook deliveries")

    def __str__(self):
        return f"{self.event} {self.event_id} ({self.status})"


class InboundEvent(models.Model):
    """Deduplicates incoming webhooks (Stripe, GitHub...) by provider and event id."""

    provider = models.CharField(max_length=50)
    event_id = models.CharField(max_length=255)
    payload = models.JSONField(default=dict, blank=True)
    received_at = models.DateTimeField(default=timezone.now, db_index=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-received_at"]
        constraints = [
            models.UniqueConstraint(fields=["provider", "event_id"], name="pleate_webhooks_inbound_unique")
        ]

    def __str__(self):
        return f"{self.provider}:{self.event_id}"
