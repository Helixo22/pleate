from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from . import crypto


class TOTPDevice(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="totp_device"
    )
    # Fernet token, never the plain secret.
    secret_encrypted = models.TextField()
    confirmed_at = models.DateTimeField(null=True, blank=True)
    # Highest accepted time step, so a code cannot be replayed.
    last_used_step = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("TOTP device")
        verbose_name_plural = _("TOTP devices")

    def __str__(self):
        return f"TOTP {self.user_id}"

    @property
    def secret(self) -> str:
        return crypto.decrypt(self.secret_encrypted)

    @secret.setter
    def secret(self, value: str):
        self.secret_encrypted = crypto.encrypt(value)

    @property
    def confirmed(self) -> bool:
        return self.confirmed_at is not None


class BackupCode(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mfa_backup_codes"
    )
    code_hash = models.CharField(max_length=64, db_index=True)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("backup code")
        verbose_name_plural = _("backup codes")

    def __str__(self):
        return f"Backup code {self.pk}"
