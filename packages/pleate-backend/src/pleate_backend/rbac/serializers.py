from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import Feature, RoleInfo
from .services import perm_name, permissions_by_group

User = get_user_model()


def resolve_permissions(names: list[str]) -> list[Permission]:
    found = []
    unknown = []
    for name in dict.fromkeys(names):
        app_label, _sep, codename = name.partition(".")
        perm = (
            Permission.objects.filter(content_type__app_label=app_label, codename=codename).first()
            if app_label and codename
            else None
        )
        if perm is None:
            unknown.append(name)
        else:
            found.append(perm)
    if unknown:
        raise serializers.ValidationError(
            _("Unknown permissions: %(names)s.") % {"names": ", ".join(unknown)}, code="unknown_permission"
        )
    return found


class PermissionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    codename = serializers.SerializerMethodField(help_text='"app_label.codename"')
    app_label = serializers.CharField(source="content_type.app_label", read_only=True)
    model = serializers.CharField(source="content_type.model", read_only=True)

    class Meta:
        model = Permission
        fields = ["id", "codename", "name", "app_label", "model"]

    def get_codename(self, perm) -> str:
        return perm_name(perm)


class RoleListSerializer(serializers.ListSerializer):
    def to_representation(self, data):
        groups = list(data.all() if hasattr(data, "all") else data)
        self.child.context["permissions_map"] = permissions_by_group([g.pk for g in groups])
        return [self.child.to_representation(g) for g in groups]


class RoleSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=150)
    description = serializers.CharField(max_length=500, required=False, allow_blank=True)
    is_default = serializers.BooleanField(required=False)
    permissions = serializers.ListField(
        child=serializers.CharField(), required=False, help_text='Global permissions, "app_label.codename".'
    )

    class Meta:
        list_serializer_class = RoleListSerializer

    def to_representation(self, group):
        info = group.role_info if _has_info(group) else None
        perms = self.context.get("permissions_map", {}).get(group.pk)
        if perms is None:
            perms = permissions_by_group([group.pk])[group.pk]
        return {
            "id": str(group.pk),
            "name": group.name,
            "description": info.description if info else "",
            "is_default": info.is_default if info else False,
            "permissions": perms,
        }

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError(_("Give the role a name."), code="required")
        qs = Group.objects.filter(name=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(_("A role with this name already exists."), code="role_taken")
        return value

    def validate_permissions(self, value):
        return resolve_permissions(value)

    def _save_info(self, group, data):
        if "description" not in data and "is_default" not in data:
            return
        info, _created = RoleInfo.objects.get_or_create(group=group)
        if "description" in data:
            info.description = data["description"]
        if "is_default" in data:
            info.is_default = data["is_default"]
        info.save()

    def create(self, validated_data):
        group = Group.objects.create(name=validated_data["name"])
        RoleInfo.objects.create(
            group=group,
            description=validated_data.get("description", ""),
            is_default=validated_data.get("is_default", False),
        )
        if validated_data.get("permissions"):
            group.permissions.set(validated_data["permissions"])
        return Group.objects.get(pk=group.pk)

    def update(self, group, validated_data):
        if "name" in validated_data:
            group.name = validated_data["name"]
            group.save(update_fields=["name"])
        self._save_info(group, validated_data)
        if "permissions" in validated_data:
            group.permissions.set(validated_data["permissions"])
        return Group.objects.get(pk=group.pk)


def _has_info(group) -> bool:
    try:
        group.role_info  # noqa: B018
    except RoleInfo.DoesNotExist:
        return False
    return True


class RoleAssignSerializer(serializers.Serializer):
    role = serializers.CharField()

    def validate_role(self, value):
        group = Group.objects.filter(name=value).first()
        if group is None:
            raise serializers.ValidationError(_("This role does not exist."), code="unknown_role")
        return group


class UserRolesSerializer(serializers.Serializer):
    roles = serializers.ListField(child=serializers.CharField())


class FeatureKeysSerializer(serializers.Serializer):
    features = serializers.ListField(child=serializers.CharField())


class _RelatedValues(serializers.ListField):
    """A list of strings in and out; reads a related manager as ``values_list(attr)``."""

    attr = "pk"
    child = serializers.CharField()

    def to_representation(self, data):
        if hasattr(data, "values_list"):
            return sorted(str(v) for v in data.values_list(self.attr, flat=True))
        return super().to_representation(data)


class _UserIds(_RelatedValues):
    attr = "pk"


class _RoleNames(_RelatedValues):
    attr = "name"


class FeatureSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    key = serializers.SlugField(max_length=100)
    rollout_percent = serializers.IntegerField(min_value=0, max_value=100, required=False)
    users = _UserIds(required=False, help_text="Ids of the users that always get the flag.")
    groups = _RoleNames(required=False, help_text="Names of the roles that always get the flag.")

    class Meta:
        model = Feature
        fields = [
            "id",
            "key",
            "description",
            "enabled",
            "rollout_percent",
            "users",
            "groups",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_key(self, value):
        qs = Feature.objects.filter(key=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(_("A flag with this key already exists."), code="feature_taken")
        return value

    def validate_users(self, value):
        ids = list(dict.fromkeys(value))
        try:
            users = list(User.objects.filter(pk__in=ids))
        except DjangoValidationError:
            users = []
        if len(users) != len(ids):
            raise serializers.ValidationError(_("Some users do not exist."), code="unknown_user")
        return users

    def validate_groups(self, value):
        names = list(dict.fromkeys(value))
        groups = list(Group.objects.filter(name__in=names))
        if len(groups) != len(names):
            raise serializers.ValidationError(_("Some roles do not exist."), code="unknown_role")
        return groups

    def _set_relations(self, feature, users, groups):
        if users is not None:
            feature.users.set(users)
        if groups is not None:
            feature.groups.set(groups)

    def create(self, validated_data):
        users = validated_data.pop("users", None)
        groups = validated_data.pop("groups", None)
        feature = Feature.objects.create(**validated_data)
        self._set_relations(feature, users, groups)
        return feature

    def update(self, feature, validated_data):
        users = validated_data.pop("users", None)
        groups = validated_data.pop("groups", None)
        feature = super().update(feature, validated_data)
        self._set_relations(feature, users, groups)
        return feature
