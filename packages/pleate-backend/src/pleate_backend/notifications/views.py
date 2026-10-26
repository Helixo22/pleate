import json

import django_filters
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics
from rest_framework.renderers import BaseRenderer, JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from pleate_backend.core.conf import pleate_settings
from pleate_backend.core.pagination import CursorPagination
from pleate_backend.core.realtime import channel_stream, sse_response
from pleate_backend.core.utils import user_agent

from . import services
from .models import Notification, Preference, PushSubscription
from .serializers import (
    NotificationCountSerializer,
    NotificationSerializer,
    PreferencesSerializer,
    PublicKeySerializer,
    PushEndpointSerializer,
    PushSubscriptionOutSerializer,
    PushSubscriptionSerializer,
)


class NotificationFilter(django_filters.FilterSet):
    unread = django_filters.BooleanFilter(method="filter_unread", label="true: only unread, false: only read")

    class Meta:
        model = Notification
        fields = ["kind"]

    def filter_unread(self, queryset, name, value):
        return queryset.filter(read_at__isnull=value)


class OwnNotificationsMixin:
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Notification.objects.none()
        return Notification.objects.filter(user=self.request.user)


class NotificationListView(OwnNotificationsMixin, generics.ListAPIView):
    serializer_class = NotificationSerializer
    pagination_class = CursorPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = NotificationFilter

    @extend_schema(summary="List my notifications, newest first", tags=["notifications"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Delete every read notification",
        operation_id="notifications_clear_read",
        request=None,
        responses=NotificationCountSerializer,
        tags=["notifications"],
    )
    def delete(self, request):
        count, _detail = Notification.objects.filter(user=request.user, read_at__isnull=False).delete()
        return Response({"count": count})


class NotificationDetailView(OwnNotificationsMixin, generics.GenericAPIView):
    serializer_class = NotificationSerializer

    @extend_schema(responses={204: None}, tags=["notifications"])
    def delete(self, request, pk):
        notification = self.get_object()
        was_unread = notification.read_at is None
        notification.delete()
        if was_unread:
            services.publish_unread_count(request.user)
        return Response(status=204)


class MarkReadView(OwnNotificationsMixin, generics.GenericAPIView):
    serializer_class = NotificationSerializer
    read = True

    @extend_schema(request=None, responses=NotificationSerializer, tags=["notifications"])
    def post(self, request, pk):
        notification = self.get_object()
        target = timezone.now() if self.read else None
        if (notification.read_at is None) == self.read:
            notification.read_at = target
            notification.save(update_fields=["read_at"])
            services.publish_unread_count(request.user)
        return Response(NotificationSerializer(notification).data)


class MarkUnreadView(MarkReadView):
    read = False


class ReadAllView(APIView):
    @extend_schema(request=None, responses=NotificationCountSerializer, tags=["notifications"])
    def post(self, request):
        count = Notification.objects.filter(user=request.user, read_at__isnull=True).update(
            read_at=timezone.now()
        )
        if count:
            services.publish_unread_count(request.user)
        return Response({"count": count})


class UnreadCountView(APIView):
    @extend_schema(responses=NotificationCountSerializer, tags=["notifications"])
    def get(self, request):
        return Response({"count": services.unread_count(request.user)})


class PreferencesView(APIView):
    @extend_schema(responses=PreferencesSerializer, tags=["notifications"])
    def get(self, request):
        return Response(services.preferences_payload(request.user))

    @extend_schema(request=PreferencesSerializer, responses=PreferencesSerializer, tags=["notifications"])
    def put(self, request):
        ser = PreferencesSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        Preference.objects.update_or_create(
            user=request.user, defaults={"channels": ser.validated_data["channels"]}
        )
        return Response(services.preferences_payload(request.user))


class EventStreamRenderer(BaseRenderer):
    """Lets DRF accept ``Accept: text/event-stream``. Errors are still written as JSON."""

    media_type = "text/event-stream"
    format = "sse"
    charset = "utf-8"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return b"" if data is None else json.dumps(data, default=str).encode()


class StreamView(APIView):
    renderer_classes = [JSONRenderer, EventStreamRenderer]

    @extend_schema(
        summary="Server-Sent Events: notification and unread_count events",
        responses={
            (200, "text/event-stream"): OpenApiResponse(
                OpenApiTypes.STR,
                description=(
                    "Events `unread_count` ({count}) first, then `notification` (a Notification) "
                    "and `unread_count` as they happen."
                ),
            )
        },
        tags=["notifications"],
    )
    def get(self, request):
        user = request.user
        return sse_response(
            channel_stream(services.user_channel(user), initial=[services.unread_event(user)]),
            request=request,
        )


class PushPublicKeyView(APIView):
    @extend_schema(responses=PublicKeySerializer, tags=["notifications"])
    def get(self, request):
        return Response({"key": pleate_settings.NOTIFICATIONS["VAPID_PUBLIC_KEY"]})


class PushSubscriptionView(APIView):
    @extend_schema(
        request=PushSubscriptionSerializer,
        responses={201: PushSubscriptionOutSerializer},
        tags=["notifications"],
    )
    def post(self, request):
        ser = PushSubscriptionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        # The same browser may have been subscribed by another account before.
        sub, _created = PushSubscription.objects.update_or_create(
            endpoint=data["endpoint"],
            defaults={
                "user": request.user,
                "p256dh": data["keys"]["p256dh"],
                "auth": data["keys"]["auth"],
                "user_agent": user_agent(request),
            },
        )
        return Response(PushSubscriptionOutSerializer(sub).data, status=201)

    @extend_schema(request=PushEndpointSerializer, responses={204: None}, tags=["notifications"])
    def delete(self, request):
        ser = PushEndpointSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        get_object_or_404(
            PushSubscription, endpoint=ser.validated_data["endpoint"], user=request.user
        ).delete()
        return Response(status=204)
