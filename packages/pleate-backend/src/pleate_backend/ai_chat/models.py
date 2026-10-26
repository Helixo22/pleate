from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Conversation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    title = models.CharField(_("title"), max_length=200, blank=True)
    model = models.CharField(_("model"), max_length=100, blank=True)
    system_prompt = models.TextField(_("system prompt"), blank=True)
    pinned = models.BooleanField(default=False)
    archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Set at creation so new conversations sort first, then bumped by every message.
    last_message_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-last_message_at"]
        indexes = [models.Index(fields=["user", "-last_message_at"], name="ai_conv_user_last")]

    def __str__(self):
        return self.title or str(self.pk)


class Message(models.Model):
    class Role(models.TextChoices):
        USER = "user", _("User")
        ASSISTANT = "assistant", _("Assistant")
        SYSTEM = "system", _("System")

    class Status(models.TextChoices):
        COMPLETE = "complete", _("Complete")
        STREAMING = "streaming", _("Streaming")
        STOPPED = "stopped", _("Stopped")
        ERROR = "error", _("Error")

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField(blank=True)
    reasoning = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.COMPLETE)
    error_code = models.CharField(max_length=64, blank=True)
    model = models.CharField(max_length=100, blank=True)
    # [{"title": "...", "url": "https://...", "snippet": "..."}]
    sources = models.JSONField(default=list, blank=True)
    # File ids (pleate_backend.files) as strings.
    attachments = models.JSONField(default=list, blank=True)
    input_tokens = models.PositiveIntegerField(default=0)
    output_tokens = models.PositiveIntegerField(default=0)
    # Previous assistant answers, oldest first, kept when the answer is regenerated.
    variants = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["created_at", "id"]
        indexes = [models.Index(fields=["conversation", "created_at"], name="ai_msg_conv_created")]

    def __str__(self):
        return f"{self.role}: {self.content[:40]}"


class DailyUsage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    day = models.DateField()
    input_tokens = models.PositiveBigIntegerField(default=0)
    output_tokens = models.PositiveBigIntegerField(default=0)

    class Meta:
        ordering = ["-day"]
        constraints = [models.UniqueConstraint(fields=["user", "day"], name="ai_usage_user_day")]

    def __str__(self):
        return f"{self.user_id} {self.day}"

    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens
