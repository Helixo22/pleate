from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Subscription

FEATURE_SCHEMA = {
    "oneOf": [
        {"type": "string"},
        {
            "type": "object",
            "required": ["label", "included"],
            "properties": {
                "label": {"type": "string"},
                "included": {"type": "boolean"},
                "hint": {"type": "string"},
            },
        },
    ]
}


@extend_schema_field(FEATURE_SCHEMA)
class FeatureField(serializers.JSONField):
    pass


class PricingPriceSerializer(serializers.Serializer):
    monthly = serializers.FloatField(help_text="Per month, in major units.")
    yearly = serializers.FloatField(help_text="Per month when billed yearly, in major units.")


class AmountsSerializer(serializers.Serializer):
    month = serializers.IntegerField(allow_null=True, help_text="Minor units charged each month.")
    year = serializers.IntegerField(allow_null=True, help_text="Minor units charged each year.")


class PlanSerializer(serializers.Serializer):
    """Maps 1:1 onto the ``PricingPlan`` type of the pleate Pricing component."""

    id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    features = serializers.ListField(child=FeatureField())
    highlighted = serializers.BooleanField()
    badge = serializers.CharField(allow_null=True)
    cta = serializers.CharField(allow_null=True)
    price = PricingPriceSerializer(allow_null=True, help_text="null for custom priced plans.")
    custom_price = serializers.CharField(allow_null=True)
    amounts = AmountsSerializer()
    intervals = serializers.ListField(
        child=serializers.ChoiceField(choices=["month", "year"]), help_text="Intervals that can be bought."
    )
    current = serializers.BooleanField()


class PlansSerializer(serializers.Serializer):
    currency = serializers.CharField(help_text="ISO 4217, upper case.")
    trial_days = serializers.IntegerField()
    current_plan = serializers.CharField(allow_null=True)
    plans = PlanSerializer(many=True)


class SubscriptionSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    active = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            "id",
            "plan_id",
            "price_id",
            "interval",
            "status",
            "active",
            "current_period_end",
            "cancel_at_period_end",
            "trial_end",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_active(self, sub) -> bool:
        from .services import ACTIVE_STATUSES

        return sub.status in ACTIVE_STATUSES


class CurrentSubscriptionSerializer(serializers.Serializer):
    subscription = SubscriptionSerializer(allow_null=True)


class CheckoutSerializer(serializers.Serializer):
    plan = serializers.CharField(max_length=100)
    interval = serializers.ChoiceField(choices=["month", "year"], default="month")


class RedirectSerializer(serializers.Serializer):
    url = serializers.URLField()


class WebhookResponseSerializer(serializers.Serializer):
    received = serializers.BooleanField()
    duplicate = serializers.BooleanField()
