from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils.translation import gettext_lazy as _
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from pleate_backend.accounts.serializers import avatar_url
from pleate_backend.rbac.services import roles_by_user

from .models import Ban, normalize_network

User = get_user_model()


class StaffUserListSerializer(serializers.ListSerializer):
    def to_representation(self, data):
        users = list(data.all() if hasattr(data, "all") else data)
        self.child.context["roles_map"] = roles_by_user([u.pk for u in users])
        return [self.child.to_representation(u) for u in users]


class StaffUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    display_name = serializers.CharField(read_only=True)
    avatar_url = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "name",
            "display_name",
            "avatar_url",
            "email_verified",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
            "last_login",
            "roles",
        ]
        read_only_fields = fields
        list_serializer_class = StaffUserListSerializer

    def get_avatar_url(self, user) -> str | None:
        return avatar_url(user)

    def get_roles(self, user) -> list[str]:
        roles = self.context.get("roles_map", {}).get(user.pk)
        return roles if roles is not None else roles_by_user([user.pk])[user.pk]


class StaffUserDetailSerializer(StaffUserSerializer):
    sessions_count = serializers.SerializerMethodField()
    mfa_enabled = serializers.SerializerMethodField(help_text="null when the mfa app is not installed")
    has_password = serializers.BooleanField(read_only=True)
    locale = serializers.CharField(read_only=True)
    timezone = serializers.CharField(read_only=True)

    class Meta(StaffUserSerializer.Meta):
        fields = [
            *StaffUserSerializer.Meta.fields,
            "has_password",
            "locale",
            "timezone",
            "sessions_count",
            "mfa_enabled",
        ]
        read_only_fields = fields

    def get_sessions_count(self, user) -> int:
        from django.utils import timezone

        from pleate_backend.accounts.models import UserSession

        return UserSession.objects.filter(user=user, expire_date__gt=timezone.now()).count()

    @extend_schema_field(serializers.BooleanField(allow_null=True))
    def get_mfa_enabled(self, user):
        from pleate_backend.accounts.me import extra_fields

        value = extra_fields(user).get("mfa_enabled")
        return None if value is None else bool(value)


class StaffUserUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
    is_staff = serializers.BooleanField(required=False)
    email_verified = serializers.BooleanField(required=False)
    roles = serializers.ListField(child=serializers.CharField(), required=False)

    def validate_roles(self, value):
        names = list(dict.fromkeys(value))
        if Group.objects.filter(name__in=names).count() != len(names):
            raise serializers.ValidationError(_("Some roles do not exist."), code="unknown_role")
        return names


class BanSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    network = serializers.CharField(max_length=49, help_text="IP address or CIDR network")
    created_by = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Ban
        fields = ["id", "network", "reason", "expires_at", "is_active", "created_by", "created_at"]
        read_only_fields = ["created_at"]

    @extend_schema_field(serializers.EmailField(allow_null=True))
    def get_created_by(self, ban):
        return ban.created_by.email if ban.created_by_id and ban.created_by else None

    def validate_network(self, value):
        try:
            return normalize_network(value)
        except ValueError as exc:
            raise serializers.ValidationError(
                _("Enter an IP address or a CIDR network."), code="invalid_network"
            ) from exc


class DayCountSerializer(serializers.Serializer):
    date = serializers.DateField()
    count = serializers.IntegerField()


class StatsSerializer(serializers.Serializer):
    users_total = serializers.IntegerField()
    users_active = serializers.IntegerField()
    users_new_7d = serializers.IntegerField()
    users_new_30d = serializers.IntegerField()
    sessions_active = serializers.IntegerField()
    signups_by_day = DayCountSerializer(many=True)
