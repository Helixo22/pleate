from django.contrib import admin

from .models import File


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ["name", "owner", "content_type", "size", "purpose", "status", "created_at"]
    list_filter = ["status", "content_type", "purpose"]
    search_fields = ["name", "checksum"]
    readonly_fields = [
        "owner",
        "key",
        "size",
        "content_type",
        "checksum",
        "width",
        "height",
        "status",
        "created_at",
    ]
