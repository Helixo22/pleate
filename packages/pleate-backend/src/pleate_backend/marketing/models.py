from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class NewsletterSubscriber(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        SUBSCRIBED = "subscribed", _("Subscribed")
        UNSUBSCRIBED = "unsubscribed", _("Unsubscribed")

    email = models.EmailField(unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    locale = models.CharField(max_length=10, blank=True)
    source = models.CharField(max_length=100, blank=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.email


class ContactMessage(models.Model):
    class Status(models.TextChoices):
        NEW = "new", _("New")
        READ = "read", _("Read")
        ARCHIVED = "archived", _("Archived")
        SPAM = "spam", _("Spam")

    name = models.CharField(max_length=150)
    email = models.EmailField()
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    ip = models.CharField(max_length=45, blank=True)
    user_agent = models.CharField(max_length=400, blank=True)
    locale = models.CharField(max_length=10, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} <{self.email}>"


class WaitlistEntry(models.Model):
    email = models.EmailField(unique=True)
    referral_code = models.CharField(max_length=8, unique=True)
    referred_by = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="referrals"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    invited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name_plural = "waitlist entries"

    def __str__(self):
        return self.email
