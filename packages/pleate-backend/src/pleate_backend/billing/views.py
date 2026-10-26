import json
import logging

from django.utils.translation import gettext as _
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from pleate_backend.core.csrf import CsrfProtectedMixin
from pleate_backend.core.exceptions import ApiError

from . import serializers as s
from . import services

logger = logging.getLogger("pleate.billing")


class PlansView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses=s.PlansSerializer, tags=["billing"])
    def get(self, request):
        return Response(services.plans_payload(request.user))


class SubscriptionView(APIView):
    @extend_schema(responses=s.CurrentSubscriptionSerializer, tags=["billing"])
    def get(self, request):
        sub = services.current_subscription(request.user)
        return Response({"subscription": s.SubscriptionSerializer(sub).data if sub else None})


class CheckoutView(CsrfProtectedMixin, APIView):
    @extend_schema(request=s.CheckoutSerializer, responses=s.RedirectSerializer, tags=["billing"])
    def post(self, request):
        """Starts a Stripe Checkout session. Redirect the browser to ``url``."""
        ser = s.CheckoutSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        url = services.create_checkout(
            request.user, ser.validated_data["plan"], ser.validated_data["interval"]
        )
        return Response({"url": url})


class PortalView(CsrfProtectedMixin, APIView):
    @extend_schema(request=None, responses=s.RedirectSerializer, tags=["billing"])
    def post(self, request):
        """Opens the Stripe billing portal (change plan, payment method, invoices, cancel)."""
        return Response({"url": services.create_portal(request.user)})


class WebhookView(APIView):
    """Stripe calls this. Signed with STRIPE_WEBHOOK_SECRET, never with a session."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []
    # Documents the body; the view reads request.body itself and never parses it.
    parser_classes = [JSONParser]

    @extend_schema(
        request=OpenApiTypes.OBJECT,
        parameters=[
            OpenApiParameter("Stripe-Signature", OpenApiTypes.STR, OpenApiParameter.HEADER, required=True)
        ],
        responses=s.WebhookResponseSerializer,
        tags=["billing"],
    )
    def post(self, request):
        import stripe

        secret = services.conf()["STRIPE_WEBHOOK_SECRET"]
        if not secret:
            raise ApiError("billing_not_configured", _("Payments are not available right now."), 503)
        payload = request._request.body
        signature = request.META.get("HTTP_STRIPE_SIGNATURE")
        try:
            stripe.Webhook.construct_event(payload, signature, secret)
        except (stripe.SignatureVerificationError, ValueError) as exc:
            raise ApiError("invalid_signature", _("The webhook signature is not valid."), 400) from exc
        event = json.loads(payload)
        processed = services.process_event(event)
        return Response({"received": True, "duplicate": not processed})
