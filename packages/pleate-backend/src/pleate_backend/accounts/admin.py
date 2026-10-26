from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, UserSession


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-date_joined"]
    list_display = ["email", "name", "email_verified", "is_active", "is_staff", "date_joined"]
    list_filter = ["is_active", "is_staff", "email_verified"]
    search_fields = ["email", "name"]
    fieldsets = [
        (None, {"fields": ["email", "password"]}),
        ("Profile", {"fields": ["name", "locale", "timezone", "preferences", "avatar"]}),
        (
            "Status",
            {
                "fields": [
                    "is_active",
                    "email_verified",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ]
            },
        ),
        ("Dates", {"fields": ["last_login", "date_joined", "password_changed_at"]}),
    ]
    add_fieldsets = [(None, {"classes": ["wide"], "fields": ["email", "password1", "password2"]})]


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ["user", "ip", "last_seen_at", "expire_date"]
    readonly_fields = ["session_key", "user", "ip", "user_agent", "created_at", "last_seen_at", "expire_date"]
    exclude = ["session_data"]
