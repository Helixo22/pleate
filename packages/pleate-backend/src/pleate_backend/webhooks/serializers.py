from django.utils.translation import gettext as _
from rest_framework import serializers

from . import registry
from .models import Delivery, Endpoint
from .security import UrlNotAllowed, check_url


class EndpointSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    url = serializers.URLField(max_length=2000)
    events = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        help_text='Event names, or ["*"] for every event.',
    )
    secret = serializers.CharField(source="masked_secret", read_only=True, help_text="Masked after creation.")

    class Meta:
        model = Endpoint
        fields = [
            "id",
            "url",
            "description",
            "events",
            "active",
            "secret",
            "consecutive_failures",
            "disabled_at",
            "created_at",
        ]
        read_only_fields = ["consecutive_failures", "disabled_at", "created_at"]

    def validate_url(self, value):
        try:
            check_url(value)
        except UrlNotAllowed as exc:
            raise serializers.ValidationError(exc.message, code="url_not_allowed") from exc
        return value

    def validate_events(self, value):
        names = list(dict.fromkeys(v.strip() for v in value if v.strip()))
        if not names:
            raise serializers.ValidationError(_("Pick at least one event."), code="events_required")
        if "*" in names:
            return ["*"]
        known = {item["name"] for item in registry.events()}
        unknown = [name for name in names if name not in known]
        if unknown:
            raise serializers.ValidationError(
                _("Unknown events: %(names)s.") % {"names": ", ".join(unknown)}, code="unknown_event"
            )
        return names


class EndpointCreatedSerializer(EndpointSerializer):
    secret = serializers.CharField(read_only=True, help_text="Shown in full only now. Store it safely.")


class SecretSerializer(serializers.Serializer):
    secret = serializers.CharField()


class TestResultSerializer(serializers.Serializer):
    delivery = serializers.CharField()
    status = serializers.ChoiceField(choices=Delivery.STATUSES)
    status_code = serializers.IntegerField(allow_null=True)
    duration_ms = serializers.IntegerField(allow_null=True)
    error = serializers.CharField(allow_blank=True)


class DeliverySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    endpoint = serializers.CharField(source="endpoint_id", read_only=True)

    class Meta:
        model = Delivery
        fields = [
            "id",
            "endpoint",
            "event_id",
            "event",
            "status",
            "attempts",
            "next_attempt_at",
            "last_status_code",
            "last_error",
            "duration_ms",
            "created_at",
            "delivered_at",
        ]
        read_only_fields = fields


class DeliveryDetailSerializer(DeliverySerializer):
    payload = serializers.DictField(child=serializers.JSONField(allow_null=True), read_only=True)

    class Meta(DeliverySerializer.Meta):
        fields = [*DeliverySerializer.Meta.fields, "payload", "response_excerpt"]
        read_only_fields = fields


class EventSerializer(serializers.Serializer):
    name = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
