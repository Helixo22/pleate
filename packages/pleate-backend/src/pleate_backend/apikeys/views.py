from django.utils import timezone
from django.utils.translation import gettext as _
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from pleate_backend.core.exceptions import ApiError

from . import serializers as s
from .models import APIKey
from .permissions import DenyAPIKey
from .services import MAX_ACTIVE_KEYS, active_keys, create_key


class _MyKeys:
    permission_classes = [IsAuthenticated, DenyAPIKey]
    serializer_class = s.APIKeySerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return APIKey.objects.none()
        return APIKey.objects.filter(user=self.request.user)


@extend_schema_view(get=extend_schema(summary="List my API keys", tags=["api-keys"]))
class APIKeyListView(_MyKeys, generics.ListAPIView):
    search_fields = ["name", "prefix"]
    ordering_fields = ["created_at", "name", "last_used_at", "expires_at"]
    ordering = ["-created_at"]

    @extend_schema(
        request=s.APIKeyCreateSerializer,
        responses={201: s.APIKeyCreatedSerializer},
        tags=["api-keys"],
        summary="Create an API key",
        description="The response carries the full `key`. It is never shown again.",
    )
    def post(self, request):
        ser = s.APIKeyCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        if active_keys(request.user).count() >= MAX_ACTIVE_KEYS:
            raise ApiError(
                "api_key_limit",
                _("You can have up to %(max)d active API keys. Revoke one first.") % {"max": MAX_ACTIVE_KEYS},
                400,
                {"max": MAX_ACTIVE_KEYS},
            )
        data = ser.validated_data
        key, raw = create_key(request.user, data["name"], data["scopes"], data.get("expires_in_days"))
        key.key = raw
        return Response(s.APIKeyCreatedSerializer(key).data, status=201)


@extend_schema_view(
    get=extend_schema(summary="Get an API key", tags=["api-keys"]),
    patch=extend_schema(summary="Rename an API key", tags=["api-keys"]),
    delete=extend_schema(summary="Revoke an API key", tags=["api-keys"], responses={204: None}),
)
class APIKeyDetailView(_MyKeys, generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def perform_destroy(self, instance):
        if instance.revoked_at is None:
            instance.revoked_at = timezone.now()
            instance.save(update_fields=["revoked_at"])
