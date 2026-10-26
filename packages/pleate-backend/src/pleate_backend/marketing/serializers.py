from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import ContactMessage, NewsletterSubscriber, WaitlistEntry


def _clean_email(value: str) -> str:
    return value.strip().lower()


# Newsletter


class SubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    source = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")

    def validate_email(self, value):
        return _clean_email(value)


class SubscribeResponseSerializer(serializers.Serializer):
    confirmation_required = serializers.BooleanField(
        help_text="True when a confirmation email was (or would have been) sent."
    )


class NewsletterTokenSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=1000)


class NewsletterStatusSerializer(serializers.Serializer):
    email = serializers.EmailField()
    status = serializers.ChoiceField(choices=NewsletterSubscriber.Status.choices)


class SubscriberSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model = NewsletterSubscriber
        fields = [
            "id",
            "email",
            "status",
            "locale",
            "source",
            "user_id",
            "created_at",
            "confirmed_at",
            "unsubscribed_at",
        ]
        read_only_fields = fields


# Contact


class ContactSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField(max_length=254)
    subject = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    message = serializers.CharField(
        min_length=10,
        max_length=5000,
        error_messages={
            "min_length": _("Write at least {min_length} characters."),
            "max_length": _("Keep it under {max_length} characters."),
        },
    )
    website = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Honeypot. Render it hidden and leave it empty.",
    )

    def validate_email(self, value):
        return _clean_email(value)


class ContactResponseSerializer(serializers.Serializer):
    received = serializers.BooleanField()


class ContactMessageSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model = ContactMessage
        fields = [
            "id",
            "name",
            "email",
            "subject",
            "message",
            "user_id",
            "ip",
            "user_agent",
            "locale",
            "status",
            "created_at",
        ]
        read_only_fields = [f for f in fields if f != "status"]


class ContactStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ContactMessage.Status.choices)


# Waitlist


class WaitlistJoinSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    ref = serializers.CharField(
        max_length=32, required=False, allow_blank=True, default="", help_text="Referral code of the inviter."
    )

    def validate_email(self, value):
        return _clean_email(value)


class WaitlistStatusSerializer(serializers.Serializer):
    position = serializers.IntegerField(help_text="1 is next in line, 0 once invited.")
    referral_code = serializers.CharField()
    referrals = serializers.IntegerField()
    invited = serializers.BooleanField()


class WaitlistPublicStatusSerializer(serializers.Serializer):
    position = serializers.IntegerField()
    referrals = serializers.IntegerField()


class WaitlistEntrySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    referred_by_id = serializers.CharField(read_only=True, allow_null=True)
    referrals = serializers.SerializerMethodField()

    class Meta:
        model = WaitlistEntry
        fields = ["id", "email", "referral_code", "referred_by_id", "referrals", "created_at", "invited_at"]
        read_only_fields = fields

    def get_referrals(self, entry) -> int:
        return entry.referrals.count()
