from django.contrib import admin

from .models import Delivery, Endpoint, InboundEvent


@admin.register(Endpoint)
class EndpointAdmin(admin.ModelAdmin):
    list_display = ["url", "owner", "active", "consecutive_failures", "disabled_at", "created_at"]
    list_filter = ["active"]
    search_fields = ["url", "description"]
    exclude = ["secret"]
    readonly_fields = ["masked_secret", "consecutive_failures", "disabled_at", "created_at", "updated_at"]


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ["event", "event_id", "endpoint", "status", "attempts", "last_status_code", "created_at"]
    list_filter = ["status", "event"]
    search_fields = ["event_id", "event"]
    readonly_fields = [
        "endpoint",
        "event_id",
        "event",
        "payload",
        "status",
        "attempts",
        "next_attempt_at",
        "last_status_code",
        "last_error",
        "response_excerpt",
        "duration_ms",
        "created_at",
        "delivered_at",
    ]

    def has_add_permission(self, request):
        return False


@admin.register(InboundEvent)
class InboundEventAdmin(admin.ModelAdmin):
    list_display = ["provider", "event_id", "received_at", "processed_at"]
    list_filter = ["provider"]
    search_fields = ["event_id"]
    readonly_fields = ["provider", "event_id", "payload", "received_at", "processed_at"]

    def has_add_permission(self, request):
        return False
