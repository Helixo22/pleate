from rest_framework import serializers

from pleate_backend.accounts.serializers import MeSerializer


class MfaStatusSerializer(serializers.Serializer):
    enabled = serializers.BooleanField()
    confirmed_at = serializers.DateTimeField(allow_null=True)
    backup_codes_remaining = serializers.IntegerField()


class MfaSetupResponseSerializer(serializers.Serializer):
    secret = serializers.CharField(help_text="Base32 secret, for manual entry in the app.")
    otpauth_url = serializers.CharField()
    qr_svg = serializers.CharField(help_text="Inline SVG of the otpauth URL.")


class MfaCodeSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=32, help_text="A TOTP code or, where accepted, a backup code.")


class MfaBackupCodesSerializer(serializers.Serializer):
    backup_codes = serializers.ListField(child=serializers.CharField())


class MfaDisableSerializer(serializers.Serializer):
    password = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)
    code = serializers.CharField(max_length=32)


class MfaVerifySerializer(serializers.Serializer):
    code = serializers.CharField(required=False, allow_blank=True, max_length=32)
    backup_code = serializers.CharField(required=False, allow_blank=True, max_length=32)


class MfaVerifyResponseSerializer(serializers.Serializer):
    user = MeSerializer()
    mfa_required = serializers.BooleanField()
