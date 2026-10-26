from django.db import connection
from django.middleware.csrf import get_token
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .conf import pleate_settings


class HealthView(APIView):
    """Liveness and readiness. Checks MongoDB and, when configured, Redis."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    @extend_schema(
        responses=inline_serializer(
            "Health", {"status": serializers.CharField(), "checks": serializers.DictField()}
        )
    )
    def get(self, request):
        checks = {}
        try:
            connection.ensure_connection()
            connection.database.command("ping")
            checks["mongodb"] = "ok"
        except Exception as exc:  # noqa: BLE001
            checks["mongodb"] = f"error: {exc.__class__.__name__}"
        if pleate_settings.REDIS_URL:
            try:
                import redis

                redis.Redis.from_url(pleate_settings.REDIS_URL, socket_timeout=1).ping()
                checks["redis"] = "ok"
            except Exception as exc:  # noqa: BLE001
                checks["redis"] = f"error: {exc.__class__.__name__}"
        ok = all(v == "ok" for v in checks.values())
        return Response({"status": "ok" if ok else "degraded", "checks": checks}, status=200 if ok else 503)


class CsrfView(APIView):
    """Sets the ``csrftoken`` cookie. Call once before the first unsafe request."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(responses=inline_serializer("Csrf", {"csrf_token": serializers.CharField()}))
    def get(self, request):
        return Response({"csrf_token": get_token(request)})
