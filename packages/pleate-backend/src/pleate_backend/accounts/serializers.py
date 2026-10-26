from django.conf import settings
from django.contrib.auth import get_user_model, password_validation
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .me import extra_fields

User = get_user_model()

LANGUAGES = [code for code, _name in settings.LANGUAGES]


def avatar_url(user, request=None) -> str | None:
    if not user.avatar:
        return None
    version = user.avatar.rsplit("/", 1)[-1].split(".")[0][-8:]
    path = reverse("accounts:avatar", kwargs={"user_id": str(user.pk)}) + f"?v={version}"
    return request.build_absolute_uri(path) if request else path


class PublicUserSerializer(serializers.ModelSerializer):
    """What other users may see (authors, chat participants...)."""

    id = serializers.CharField(read_only=True)
    display_name = serializers.CharField(read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "name", "display_name", "avatar_url"]

    def get_avatar_url(self, user) -> str | None:
        return avatar_url(user)


class MeSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    display_name = serializers.CharField(read_only=True)
    avatar_url = serializers.SerializerMethodField()
    locale = serializers.ChoiceField(choices=[("", "")] + list(settings.LANGUAGES), required=False)
    extra = serializers.SerializerMethodField(
        help_text="Fields contributed by other apps: roles, permissions, mfa_enabled, subscription..."
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "name",
            "display_name",
            "email_verified",
            "locale",
            "timezone",
            "preferences",
            "avatar_url",
            "has_password",
            "is_staff",
            "date_joined",
            "extra",
        ]
        read_only_fields = ["email", "email_verified", "has_password", "is_staff", "date_joined"]

    def get_avatar_url(self, user) -> str | None:
        return avatar_url(user)

    @extend_schema_field(serializers.DictField())
    def get_extra(self, user):
        return extra_fields(user)

    def validate_preferences(self, value):
        if not isinstance(value, dict) or len(str(value)) > 4000:
            raise serializers.ValidationError(_("Preferences must be a small object."), code="invalid")
        return value

    def update(self, instance, validated_data):
        prefs = validated_data.pop("preferences", None)
        if prefs is not None:
            instance.preferences = {**(instance.preferences or {}), **prefs}
        return super().update(instance, validated_data)


def _validate_new_password(password, user=None):
    try:
        password_validation.validate_password(password, user)
    except Exception as exc:  # django ValidationError
        raise serializers.ValidationError(list(exc.messages), code="weak_password") from exc
    return password


class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    locale = serializers.ChoiceField(choices=LANGUAGES, required=False)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                _("An account with this email already exists."), code="email_taken"
            )
        return value

    def validate(self, attrs):
        probe = User(email=attrs["email"], name=attrs.get("name", ""))
        try:
            _validate_new_password(attrs["password"], probe)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({"password": exc.detail}) from exc
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    remember = serializers.BooleanField(default=False)


class LoginResponseSerializer(serializers.Serializer):
    user = MeSerializer(required=False)
    mfa_required = serializers.BooleanField(default=False)
    methods = serializers.ListField(child=serializers.CharField(), required=False)


class SignupResponseSerializer(serializers.Serializer):
    user = MeSerializer()
    verification_required = serializers.BooleanField()


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)
    new_password = serializers.CharField(trim_whitespace=False)

    def validate(self, attrs):
        user = self.context["request"].user
        if user.has_password and not user.check_password(attrs.get("current_password") or ""):
            raise serializers.ValidationError(
                {
                    "current_password": serializers.ErrorDetail(
                        _("The current password is wrong."), "wrong_password"
                    )
                }
            )
        try:
            _validate_new_password(attrs["new_password"], user)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({"new_password": exc.detail}) from exc
        return attrs


class EmailSerializer(serializers.Serializer):
    email = serializers.EmailField()


class TokenSerializer(serializers.Serializer):
    token = serializers.CharField()


class ValidResponseSerializer(serializers.Serializer):
    valid = serializers.BooleanField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(trim_whitespace=False)


class EmailChangeSerializer(serializers.Serializer):
    new_email = serializers.EmailField()
    password = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)

    def validate_new_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                _("An account with this email already exists."), code="email_taken"
            )
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        if user.has_password and not user.check_password(attrs.get("password") or ""):
            raise serializers.ValidationError(
                {"password": serializers.ErrorDetail(_("The password is wrong."), "wrong_password")}
            )
        return attrs


class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)
    confirm_email = serializers.EmailField(required=False)


class SessionSerializer(serializers.Serializer):
    id = serializers.CharField()
    current = serializers.BooleanField()
    ip = serializers.CharField()
    user_agent = serializers.CharField()
    browser = serializers.CharField()
    os = serializers.CharField()
    mobile = serializers.BooleanField()
    created_at = serializers.DateTimeField()
    last_seen_at = serializers.DateTimeField()
    expires_at = serializers.DateTimeField()


class CountSerializer(serializers.Serializer):
    count = serializers.IntegerField()


class AvatarUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
