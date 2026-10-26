from django.contrib import admin

from .models import SocialAccount


@admin.register(SocialAccount)
class SocialAccountAdmin(admin.ModelAdmin):
    list_display = ["user", "provider", "email", "created_at", "last_login_at"]
    list_filter = ["provider"]
    search_fields = ["user__email", "email", "uid"]
    readonly_fields = ["user", "provider", "uid", "email", "extra", "created_at", "last_login_at"]

    def has_add_permission(self, request):
        return False
