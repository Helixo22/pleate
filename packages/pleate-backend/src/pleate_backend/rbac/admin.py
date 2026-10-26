from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.models import Group

from .models import Feature, ObjectPermission, RoleInfo


class RoleInfoInline(admin.StackedInline):
    model = RoleInfo
    can_delete = False
    max_num = 1


class GroupAdmin(BaseGroupAdmin):
    inlines = [RoleInfoInline]


if admin.site.is_registered(Group):
    admin.site.unregister(Group)
admin.site.register(Group, GroupAdmin)


@admin.register(RoleInfo)
class RoleInfoAdmin(admin.ModelAdmin):
    list_display = ["group", "is_default", "description"]
    list_filter = ["is_default"]


@admin.register(ObjectPermission)
class ObjectPermissionAdmin(admin.ModelAdmin):
    list_display = ["permission", "user", "group", "content_type", "object_id", "created_at"]
    list_filter = ["content_type"]
    search_fields = ["permission", "object_id"]
    raw_id_fields = ["user"]


@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ["key", "enabled", "rollout_percent", "updated_at"]
    list_filter = ["enabled"]
    search_fields = ["key", "description"]
    filter_horizontal = ["groups"]
    raw_id_fields = ["users"]
