from bson import ObjectId
from django.http import Http404
from django.utils.translation import gettext as _
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from pleate_backend.core.exceptions import ApiError
from pleate_backend.core.filters import OrderingFilter
from pleate_backend.core.pagination import PagePagination

from . import registry, services
from . import serializers as s
from .models import Delivery, Endpoint
from .security import new_secret


def _valid_id(pk: str) -> str:
    if not ObjectId.is_valid(pk):
        raise Http404
    return pk


def owned_endpoint(request, pk) -> Endpoint:
    endpoint = Endpoint.objects.filter(pk=_valid_id(pk), owner_id=request.user.pk).first()
    if endpoint is None:
        raise Http404
    return endpoint


def owned_delivery(request, pk) -> Delivery:
    delivery = Delivery.objects.select_related("endpoint").filter(pk=_valid_id(pk)).first()
    if delivery is None or delivery.endpoint.owner_id != request.user.pk:
        raise Http404
    return delivery


@extend_schema_view(
    get=extend_schema(tags=["webhooks"], summary="My webhook endpoints"),
    post=extend_schema(
        tags=["webhooks"],
        summary="Add an endpoint",
        request=s.EndpointSerializer,
        responses={201: s.EndpointCreatedSerializer},
    ),
)
class EndpointListView(generics.ListCreateAPIView):
    serializer_class = s.EndpointSerializer
    pagination_class = PagePagination
    filter_backends = [OrderingFilter]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Endpoint.objects.filter(owner_id=self.request.user.pk)

    def create(self, request, *args, **kwargs):
        if Endpoint.objects.filter(owner_id=request.user.pk).count() >= services.MAX_ENDPOINTS:
            raise ApiError(
                "endpoint_limit",
                _("You can have at most %(count)s endpoints.") % {"count": services.MAX_ENDPOINTS},
                400,
            )
        ser = s.EndpointSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        endpoint = ser.save(
            owner=request.user, secret=new_secret(), events=ser.validated_data.get("events") or ["*"]
        )
        return Response(s.EndpointCreatedSerializer(endpoint).data, status=201)


@extend_schema_view(
    get=extend_schema(tags=["webhooks"], summary="One endpoint"),
    patch=extend_schema(tags=["webhooks"], summary="Change an endpoint"),
    delete=extend_schema(tags=["webhooks"], summary="Remove an endpoint"),
)
class EndpointDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = s.EndpointSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_object(self):
        return owned_endpoint(self.request, self.kwargs["pk"])

    def perform_update(self, serializer):
        extra = {}
        if serializer.validated_data.get("active") is True and not serializer.instance.active:
            extra = {"consecutive_failures": 0, "disabled_at": None}
        serializer.save(**extra)


class RotateSecretView(APIView):
    @extend_schema(
        request=None, responses=s.SecretSerializer, tags=["webhooks"], summary="New signing secret"
    )
    def post(self, request, pk):
        endpoint = owned_endpoint(request, pk)
        endpoint.secret = new_secret()
        endpoint.save(update_fields=["secret", "updated_at"])
        return Response({"secret": endpoint.secret})


class TestEndpointView(APIView):
    @extend_schema(
        request=None, responses=s.TestResultSerializer, tags=["webhooks"], summary="Send a ping now"
    )
    def post(self, request, pk):
        endpoint = owned_endpoint(request, pk)
        delivery = services.send_test(endpoint)
        return Response(
            {
                "delivery": str(delivery.pk),
                "status": delivery.status,
                "status_code": delivery.last_status_code,
                "duration_ms": delivery.duration_ms,
                "error": delivery.last_error,
            }
        )


@extend_schema_view(get=extend_schema(tags=["webhooks"], summary="Deliveries of an endpoint"))
class EndpointDeliveriesView(generics.ListAPIView):
    serializer_class = s.DeliverySerializer
    pagination_class = PagePagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "event"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Delivery.objects.none()
        endpoint = owned_endpoint(self.request, self.kwargs["pk"])
        return Delivery.objects.filter(endpoint_id=endpoint.pk)


@extend_schema_view(get=extend_schema(tags=["webhooks"], summary="One delivery with its payload"))
class DeliveryDetailView(generics.RetrieveAPIView):
    serializer_class = s.DeliveryDetailSerializer

    def get_object(self):
        return owned_delivery(self.request, self.kwargs["pk"])


class RedeliverView(APIView):
    @extend_schema(
        request=None, responses={202: s.DeliveryDetailSerializer}, tags=["webhooks"], summary="Send again"
    )
    def post(self, request, pk):
        delivery = owned_delivery(request, pk)
        if not delivery.endpoint.active:
            raise ApiError("endpoint_inactive", _("Turn the endpoint on before sending again."), 409)
        copy = services.redeliver(delivery)
        return Response(s.DeliveryDetailSerializer(copy).data, status=202)


class EventListView(APIView):
    pagination_class = None

    @extend_schema(
        responses=s.EventSerializer(many=True), tags=["webhooks"], summary="Events to subscribe to"
    )
    def get(self, request):
        return Response(registry.events())
