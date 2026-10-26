from django.contrib import admin

from .models import BackupCode, TOTPDevice


@admin.register(TOTPDevice)
class TOTPDeviceAdmin(admin.ModelAdmin):
    """Staff can see who has 2FA and remove a device (account recovery), never the secret."""

    list_display = ["user", "confirmed_at", "created_at"]
    list_filter = ["confirmed_at"]
    search_fields = ["user__email"]
    exclude = ["secret_encrypted", "last_used_step"]
    readonly_fields = ["user", "confirmed_at", "created_at"]

    def has_add_permission(self, request):
        return False


@admin.register(BackupCode)
class BackupCodeAdmin(admin.ModelAdmin):
    list_display = ["user", "used_at", "created_at"]
    search_fields = ["user__email"]
    exclude = ["code_hash"]
    readonly_fields = ["user", "used_at", "created_at"]

    def has_add_permission(self, request):
        return False
