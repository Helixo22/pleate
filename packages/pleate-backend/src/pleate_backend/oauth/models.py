from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class SocialAccount(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="social_accounts"
    )
    provider = models.CharField(max_length=40)
    # The provider's stable user id (``sub`` for OpenID Connect).
    uid = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    extra = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _("social account")
        verbose_name_plural = _("social accounts")
        ordering = ["created_at"]
        constraints = [models.UniqueConstraint(fields=["provider", "uid"], name="pleate_oauth_provider_uid")]

    def __str__(self):
        return f"{self.provider}:{self.uid}"
