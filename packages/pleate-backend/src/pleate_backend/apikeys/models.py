from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

SCOPES = [("read", _("Read")), ("write", _("Write"))]


class APIKey(models.Model):
    """
    A personal API key. The full key (``pl_<prefix>_<secret>``) is shown once;
    only its SHA-256 is stored. ``prefix`` finds the row, the hash proves it.
    """

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="api_keys")
    name = models.CharField(_("name"), max_length=100)
    prefix = models.CharField(max_length=8, db_index=True)
    key_hash = models.CharField(max_length=64)
    scopes = models.JSONField(default=list)
    expires_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    last_used_ip = models.CharField(max_length=45, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _("API key")
        verbose_name_plural = _("API keys")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} (pl_{self.prefix}_...)"

    @property
    def is_expired(self) -> bool:
        return self.expires_at is not None and self.expires_at <= timezone.now()

    @property
    def status(self) -> str:
        if self.revoked_at:
            return "revoked"
        if self.is_expired:
            return "expired"
        return "active"

    @property
    def can_write(self) -> bool:
        return "write" in (self.scopes or [])
