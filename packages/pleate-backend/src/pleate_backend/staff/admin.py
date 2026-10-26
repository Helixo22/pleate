from django.contrib import admin

from .models import Ban


@admin.register(Ban)
class BanAdmin(admin.ModelAdmin):
    list_display = ["network", "reason", "expires_at", "created_by", "created_at"]
    search_fields = ["network", "reason"]
    readonly_fields = ["created_by", "created_at"]

    def save_model(self, request, obj, form, change):
        if not change and obj.created_by_id is None:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
