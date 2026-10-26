from django.utils.translation import gettext_lazy as _
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import SCOPES, APIKey


@extend_schema_field(
    {"type": "string", "enum": ["active", "expired", "revoked"]}, component_name="APIKeyStatus"
)
class StatusField(serializers.CharField):
    pass


class APIKeySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    scopes = serializers.ListField(child=serializers.ChoiceField(choices=SCOPES), read_only=True)
    status = StatusField(read_only=True)
    display = serializers.SerializerMethodField(help_text="Masked key, for example pl_AbCd1234_...")

    class Meta:
        model = APIKey
        fields = [
            "id",
            "name",
            "prefix",
            "display",
            "scopes",
            "status",
            "expires_at",
            "last_used_at",
            "last_used_ip",
            "created_at",
            "revoked_at",
        ]
        read_only_fields = [f for f in fields if f != "name"]

    def get_display(self, key) -> str:
        return f"pl_{key.prefix}_..."


class APIKeyCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    scopes = serializers.ListField(
        child=serializers.ChoiceField(choices=SCOPES), default=lambda: ["read"], allow_empty=False
    )
    expires_in_days = serializers.IntegerField(min_value=1, max_value=3650, required=False, allow_null=True)


class APIKeyCreatedSerializer(APIKeySerializer):
    key = serializers.CharField(read_only=True, help_text=_("The full key. Shown only once."))

    class Meta(APIKeySerializer.Meta):
        fields = [*APIKeySerializer.Meta.fields, "key"]
