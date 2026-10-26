import ipaddress

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


def normalize_network(value: str) -> str:
    """ "1.2.3.4" -> "1.2.3.4/32", "10.0.0.7/8" -> "10.0.0.0/8". Raises ValueError."""
    return str(ipaddress.ip_network(str(value).strip(), strict=False))


class BanQuerySet(models.QuerySet):
    def active(self):
        return self.filter(models.Q(expires_at__isnull=True) | models.Q(expires_at__gt=timezone.now()))


class Ban(models.Model):
    """An IP address (stored as /32 or /128) or a network that may not use the site."""

    network = models.CharField(_("network"), max_length=49, db_index=True)
    reason = models.CharField(_("reason"), max_length=500, blank=True)
    expires_at = models.DateTimeField(_("expires at"), null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = BanQuerySet.as_manager()

    class Meta:
        verbose_name = _("IP ban")
        verbose_name_plural = _("IP bans")
        ordering = ["-created_at"]

    def __str__(self):
        return self.network

    def save(self, *args, **kwargs):
        self.network = normalize_network(self.network)
        super().save(*args, **kwargs)

    @property
    def is_active(self) -> bool:
        return self.expires_at is None or self.expires_at > timezone.now()

    def clean(self):
        try:
            self.network = normalize_network(self.network)
        except ValueError as exc:
            raise ValidationError({"network": _("Enter an IP address or a CIDR network.")}) from exc
