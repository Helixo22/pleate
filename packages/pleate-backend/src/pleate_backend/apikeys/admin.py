from django.contrib import admin

from .models import APIKey


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "user",
        "prefix",
        "scopes",
        "created_at",
        "last_used_at",
        "expires_at",
        "revoked_at",
    ]
    list_filter = ["revoked_at"]
    search_fields = ["name", "prefix"]
    raw_id_fields = ["user"]
    exclude = ["key_hash"]
    readonly_fields = ["prefix", "last_used_at", "last_used_ip", "created_at"]
