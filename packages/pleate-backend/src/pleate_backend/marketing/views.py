import csv
import io

from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import get_language
from django.utils.translation import gettext as _
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from pleate_backend.core.conf import pleate_settings
from pleate_backend.core.csrf import CsrfProtectedMixin
from pleate_backend.core.exceptions import ApiError
from pleate_backend.core.permissions import IsStaff
from pleate_backend.core.utils import client_ip, user_agent
from pleate_backend.emails import send_email
from pleate_backend.ratelimit.throttles import ScopedRateThrottle

from . import serializers as s
from . import services
from .models import ContactMessage, NewsletterSubscriber, WaitlistEntry

User = get_user_model()

INVALID_TOKEN = "invalid_token"


def _invalid_token():
    return ApiError(INVALID_TOKEN, _("This link is not valid anymore."), 400)


class PublicFormView(CsrfProtectedMixin, APIView):
    """Anonymous form endpoint: CSRF enforced, rate limited with the ``contact`` scope."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"


# Newsletter


class SubscribeView(PublicFormView):
    @extend_schema(
        request=s.SubscribeSerializer, responses={202: s.SubscribeResponseSerializer}, tags=["marketing"]
    )
    def post(self, request):
        """
        Always answers 202 with the same body, whether the email is new, pending,
        subscribed or unsubscribed, so it does not reveal who is on the list.
        """
        ser = s.SubscribeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]
        source = ser.validated_data["source"]
        double_opt_in = bool(pleate_settings.MARKETING["NEWSLETTER_DOUBLE_OPT_IN"])
        user = request.user if request.user.is_authenticated else None
        # A signed in user with a verified address already proved the inbox is theirs.
        owns_email = bool(user and user.email == email and user.email_verified)
        needs_confirmation = double_opt_in and not owns_email

        sub, created = NewsletterSubscriber.objects.get_or_create(
            email=email,
            defaults={
                "locale": (user and user.locale) or get_language() or "",
                "source": source,
                "user": user if user and user.email == email else None,
            },
        )
        if created or sub.status != NewsletterSubscriber.Status.SUBSCRIBED:
            if not created and source:
                sub.source = source
            if sub.user_id is None and user and user.email == email:
                sub.user = user
            if needs_confirmation:
                sub.status = NewsletterSubscriber.Status.PENDING
                sub.save()
                services.send_confirmation(sub)
            else:
                sub.status = NewsletterSubscriber.Status.SUBSCRIBED
                sub.confirmed_at = timezone.now()
                sub.unsubscribed_at = None
                sub.save()
        return Response({"confirmation_required": needs_confirmation}, status=202)


class ConfirmView(PublicFormView):
    throttle_scope = "auth"

    @extend_schema(
        request=s.NewsletterTokenSerializer, responses=s.NewsletterStatusSerializer, tags=["marketing"]
    )
    def post(self, request):
        ser = s.NewsletterTokenSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        sub = services.read_confirm_token(ser.validated_data["token"])
        if sub is None:
            raise _invalid_token()
        if sub.status != NewsletterSubscriber.Status.SUBSCRIBED:
            sub.status = NewsletterSubscriber.Status.SUBSCRIBED
            sub.confirmed_at = timezone.now()
            sub.unsubscribed_at = None
            sub.save(update_fields=["status", "confirmed_at", "unsubscribed_at"])
        return Response({"email": sub.email, "status": sub.status})


class UnsubscribeView(PublicFormView):
    throttle_scope = "auth"

    @extend_schema(
        request=s.NewsletterTokenSerializer, responses=s.NewsletterStatusSerializer, tags=["marketing"]
    )
    def post(self, request):
        ser = s.NewsletterTokenSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        sub = services.read_unsubscribe_token(ser.validated_data["token"])
        if sub is None:
            raise _invalid_token()
        if sub.status != NewsletterSubscriber.Status.UNSUBSCRIBED:
            sub.status = NewsletterSubscriber.Status.UNSUBSCRIBED
            sub.unsubscribed_at = timezone.now()
            sub.save(update_fields=["status", "unsubscribed_at"])
        return Response({"email": sub.email, "status": sub.status})


class SubscriberListView(generics.ListAPIView):
    permission_classes = [IsStaff]
    serializer_class = s.SubscriberSerializer
    queryset = NewsletterSubscriber.objects.all()
    search_fields = ["email"]
    filterset_fields = ["status", "source"]
    ordering_fields = ["created_at", "email"]
    ordering = ["-created_at"]

    @extend_schema(tags=["marketing"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


def _csv_cell(value) -> str:
    """Neutralize spreadsheet formulas (CSV injection)."""
    text = "" if value is None else str(value)
    return "'" + text if text[:1] in ("=", "+", "-", "@", "\t", "\r") else text


class SubscriberExportView(APIView):
    permission_classes = [IsStaff]

    @extend_schema(
        responses={
            (200, "text/csv"): OpenApiResponse(OpenApiTypes.STR, description="CSV of subscribed emails")
        },
        tags=["marketing"],
    )
    def get(self, request):
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["email", "locale", "source", "confirmed_at", "created_at"])
        rows = NewsletterSubscriber.objects.filter(status=NewsletterSubscriber.Status.SUBSCRIBED).order_by(
            "created_at"
        )
        for sub in rows.iterator():
            writer.writerow(
                [
                    _csv_cell(sub.email),
                    _csv_cell(sub.locale),
                    _csv_cell(sub.source),
                    sub.confirmed_at.isoformat() if sub.confirmed_at else "",
                    sub.created_at.isoformat(),
                ]
            )
        response = HttpResponse(buffer.getvalue(), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="newsletter-subscribers.csv"'
        return response


# Contact


def contact_recipients() -> list[str]:
    configured = list(pleate_settings.MARKETING["CONTACT_RECIPIENTS"] or [])
    if configured:
        return configured
    return list(User.objects.filter(is_staff=True, is_active=True).values_list("email", flat=True))


class ContactView(PublicFormView):
    @extend_schema(
        request=s.ContactSerializer, responses={201: s.ContactResponseSerializer}, tags=["marketing"]
    )
    def post(self, request):
        ser = s.ContactSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        spam = bool(data["website"].strip())
        msg = ContactMessage.objects.create(
            name=data["name"],
            email=data["email"],
            subject=data["subject"],
            message=data["message"],
            user=request.user if request.user.is_authenticated else None,
            ip=client_ip(request),
            user_agent=user_agent(request),
            locale=get_language() or "",
            status=ContactMessage.Status.SPAM if spam else ContactMessage.Status.NEW,
        )
        if not spam:
            recipients = contact_recipients()
            if recipients:
                send_email(
                    "contact_message",
                    recipients,
                    {
                        "name": msg.name,
                        "email": msg.email,
                        "subject": msg.subject,
                        "message": msg.message,
                        "message_id": str(msg.pk),
                    },
                    settings.LANGUAGE_CODE,
                    reply_to=[msg.email],
                )
        # The honeypot gets the same answer, so bots learn nothing.
        return Response({"received": True}, status=201)


class ContactMessageListView(generics.ListAPIView):
    permission_classes = [IsStaff]
    serializer_class = s.ContactMessageSerializer
    queryset = ContactMessage.objects.all()
    search_fields = ["name", "email", "subject"]
    filterset_fields = ["status"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    @extend_schema(tags=["marketing"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ContactMessageDetailView(APIView):
    permission_classes = [IsStaff]

    @extend_schema(
        request=s.ContactStatusSerializer, responses=s.ContactMessageSerializer, tags=["marketing"]
    )
    def patch(self, request, pk):
        msg = get_object_or_404(ContactMessage, pk=pk)
        ser = s.ContactStatusSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        msg.status = ser.validated_data["status"]
        msg.save(update_fields=["status"])
        return Response(s.ContactMessageSerializer(msg).data)


# Waitlist


class WaitlistView(CsrfProtectedMixin, generics.ListAPIView):
    """POST joins (anyone), GET lists the entries (staff)."""

    serializer_class = s.WaitlistEntrySerializer
    queryset = WaitlistEntry.objects.all()
    search_fields = ["email", "referral_code"]
    ordering_fields = ["created_at", "email", "invited_at"]
    ordering = ["created_at"]
    throttle_scope = "contact"

    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsStaff()]

    def get_throttles(self):
        if self.request.method == "POST":
            return [ScopedRateThrottle()]
        return super().get_throttles()

    @extend_schema(tags=["marketing"])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(request=s.WaitlistJoinSerializer, responses=s.WaitlistStatusSerializer, tags=["marketing"])
    def post(self, request):
        """Idempotent: an email already on the list gets its current status back."""
        ser = s.WaitlistJoinSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]
        entry = WaitlistEntry.objects.filter(email=email).first()
        if entry is None:
            ref = ser.validated_data["ref"].strip().upper()
            referrer = WaitlistEntry.objects.filter(referral_code=ref).first() if ref else None
            entry = services.create_waitlist_entry(email, referrer)
        return Response(services.waitlist_status(entry))


class WaitlistStatusView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses=s.WaitlistPublicStatusSerializer, tags=["marketing"])
    def get(self, request, referral_code):
        entry = get_object_or_404(WaitlistEntry, referral_code=referral_code.upper())
        status = services.waitlist_status(entry)
        return Response({"position": status["position"], "referrals": status["referrals"]})


class WaitlistInviteView(APIView):
    permission_classes = [IsStaff]

    @extend_schema(request=None, responses=s.WaitlistEntrySerializer, tags=["marketing"])
    def post(self, request, pk):
        entry = get_object_or_404(WaitlistEntry, pk=pk)
        entry.invited_at = timezone.now()
        entry.save(update_fields=["invited_at"])
        send_email(
            "waitlist_invite",
            entry.email,
            {"action_url": services.invite_url(entry), "action_label": _("Get started")},
        )
        return Response(s.WaitlistEntrySerializer(entry).data)
