from django.contrib import admin

from .models import Notification, Preference, PushSubscription


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "kind", "read_at", "created_at"]
    list_filter = ["kind"]
    search_fields = ["title", "body", "kind"]
    readonly_fields = ["created_at"]


@admin.register(Preference)
class PreferenceAdmin(admin.ModelAdmin):
    list_display = ["user", "updated_at"]


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "user_agent", "created_at"]
    readonly_fields = ["user", "endpoint", "p256dh", "auth", "user_agent", "created_at"]
