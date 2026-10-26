from django.contrib import admin

from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ["created_at", "action", "actor_email", "target_type", "target_repr", "ip"]
    list_filter = ["action", "target_type"]
    search_fields = ["actor_email", "action", "target_repr", "target_id"]
    date_hierarchy = None
    ordering = ["-created_at"]
    readonly_fields = [
        "actor",
        "actor_email",
        "action",
        "target_type",
        "target_id",
        "target_repr",
        "changes",
        "metadata",
        "ip",
        "user_agent",
        "request_id",
        "created_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
