from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class FileQuerySet(models.QuerySet):
    def ready(self):
        return self.filter(status=File.Status.READY)

    def pending(self):
        return self.filter(status=File.Status.PENDING)


class File(models.Model):
    """An uploaded blob. The bytes live in the configured storage under ``key``."""

    class Status(models.TextChoices):
        READY = "ready", _("Ready")
        PENDING = "pending", _("Pending")

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="files")
    # Original (sanitized) filename, shown to people and used for downloads.
    name = models.CharField(_("name"), max_length=255)
    # Storage name. Never derived from user input.
    key = models.CharField(max_length=512)
    size = models.PositiveBigIntegerField(default=0)
    # Detected from the bytes, never the type declared by the client.
    content_type = models.CharField(max_length=127)
    checksum = models.CharField(max_length=64, blank=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    purpose = models.CharField(max_length=32, blank=True, db_index=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.READY, db_index=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    objects = FileQuerySet.as_manager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["owner", "status", "-created_at"], name="file_owner_status")]

    def __str__(self):
        return self.name

    @property
    def is_image(self) -> bool:
        return self.content_type.startswith("image/")
