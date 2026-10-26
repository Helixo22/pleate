from rest_framework import serializers

from .models import SocialAccount


class OAuthProviderSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()


class SocialAccountSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = SocialAccount
        fields = ["id", "provider", "email", "created_at", "last_login_at"]
        read_only_fields = fields
