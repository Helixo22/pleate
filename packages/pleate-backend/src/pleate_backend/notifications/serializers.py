from django.utils.translation import gettext as _
from rest_framework import serializers

from .models import Notification, PushSubscription
from .services import available_channels


class NotificationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ["id", "kind", "title", "body", "url", "data", "read", "read_at", "created_at"]
        read_only_fields = fields

    def get_read(self, notification) -> bool:
        return notification.read_at is not None


class NotificationCountSerializer(serializers.Serializer):
    count = serializers.IntegerField()


class PreferencesSerializer(serializers.Serializer):
    channels = serializers.DictField(
        child=serializers.ListField(child=serializers.CharField(max_length=32)),
        help_text='Channels per kind, "*" is the fallback for every other kind.',
    )
    available_channels = serializers.ListField(child=serializers.CharField(), read_only=True)

    def validate_channels(self, value):
        allowed = set(available_channels())
        cleaned = {}
        for kind, channels in value.items():
            if not kind or len(kind) > 64:
                raise serializers.ValidationError(_("This kind is not valid."), code="invalid_kind")
            unknown = [c for c in channels if c not in allowed]
            if unknown:
                raise serializers.ValidationError(
                    _("Unknown channel: %(channel)s.") % {"channel": unknown[0]}, code="invalid_channel"
                )
            cleaned[kind] = list(dict.fromkeys(channels))
        return cleaned


class PushKeysSerializer(serializers.Serializer):
    p256dh = serializers.CharField(max_length=200)
    auth = serializers.CharField(max_length=100)


class PushSubscriptionSerializer(serializers.Serializer):
    endpoint = serializers.URLField(max_length=1000)
    keys = PushKeysSerializer()

    def validate_endpoint(self, value):
        if not value.startswith("https://"):
            raise serializers.ValidationError(_("The endpoint must use HTTPS."), code="insecure_endpoint")
        return value


class PushSubscriptionOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ["endpoint", "created_at"]
        read_only_fields = fields


class PushEndpointSerializer(serializers.Serializer):
    endpoint = serializers.URLField(max_length=1000)


class PublicKeySerializer(serializers.Serializer):
    key = serializers.CharField(allow_null=True)
