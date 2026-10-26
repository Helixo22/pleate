from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class ActivityLog(models.Model):
    """
    One thing that happened. ``action`` is dotted (``auth.login``,
    ``billing.subscription.updated``). ``changes`` maps a field to
    ``[before, after]``. Documents expire after ``AUDIT["RETENTION_DAYS"]``.
    """

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    # Kept after the account is deleted.
    actor_email = models.CharField(_("actor email"), max_length=254, blank=True, db_index=True)
    action = models.CharField(_("action"), max_length=100, db_index=True)
    target_type = models.CharField(max_length=100, blank=True, db_index=True)
    target_id = models.CharField(max_length=64, blank=True, db_index=True)
    target_repr = models.CharField(max_length=200, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip = models.CharField(max_length=45, blank=True)
    user_agent = models.CharField(max_length=400, blank=True)
    request_id = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("activity log entry")
        verbose_name_plural = _("activity log")
        indexes = [models.Index(fields=["actor", "-created_at"], name="pleate_audit_actor_created")]

    def __str__(self):
        return f"{self.action} by {self.actor_email or 'system'}"
