from django.contrib import admin

from .models import ContactMessage, NewsletterSubscriber, WaitlistEntry


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ["email", "status", "source", "locale", "created_at", "confirmed_at"]
    list_filter = ["status", "source"]
    search_fields = ["email"]
    readonly_fields = ["created_at", "confirmed_at", "unsubscribed_at"]
    raw_id_fields = ["user"]


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "subject", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["name", "email", "subject"]
    readonly_fields = [
        "name",
        "email",
        "subject",
        "message",
        "user",
        "ip",
        "user_agent",
        "locale",
        "created_at",
    ]


@admin.register(WaitlistEntry)
class WaitlistEntryAdmin(admin.ModelAdmin):
    list_display = ["email", "referral_code", "created_at", "invited_at"]
    search_fields = ["email", "referral_code"]
    readonly_fields = ["referral_code", "created_at"]
    raw_id_fields = ["referred_by"]
