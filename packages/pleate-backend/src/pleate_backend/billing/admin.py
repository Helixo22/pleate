from django.contrib import admin

from .models import Customer, StripeEvent, Subscription


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ["user", "stripe_customer_id", "created_at"]
    search_fields = ["stripe_customer_id"]
    raw_id_fields = ["user"]


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "plan_id", "interval", "status", "current_period_end", "cancel_at_period_end"]
    list_filter = ["status", "plan_id", "interval"]
    search_fields = ["stripe_subscription_id", "plan_id"]
    raw_id_fields = ["user"]
    readonly_fields = ["created_at", "updated_at", "last_event_at"]


@admin.register(StripeEvent)
class StripeEventAdmin(admin.ModelAdmin):
    list_display = ["event_id", "type", "received_at", "processed_at"]
    list_filter = ["type"]
    search_fields = ["event_id"]
    readonly_fields = ["event_id", "type", "received_at", "processed_at"]
