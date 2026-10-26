from datetime import UTC, datetime, time, timedelta

import django_filters
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.translation import get_language
from django.utils.translation import gettext as _
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from pleate_backend.accounts import signals as account_signals
from pleate_backend.accounts.models import UserSession
from pleate_backend.accounts.serializers import CountSerializer
from pleate_backend.accounts.services import revoke_sessions
from pleate_backend.accounts.tokens import make_reset_token
from pleate_backend.core.conf import frontend_url
from pleate_backend.core.exceptions import ApiError
from pleate_backend.core.permissions import IsStaff
from pleate_backend.core.utils import client_ip
from pleate_backend.emails import send_email
from pleate_backend.rbac.permissions import HasPerm, ModelPerm
from pleate_backend.rbac.services import set_roles

from . import serializers as s
from .models import Ban

User = get_user_model()

USER_MODEL = f"{User._meta.app_label}.{User._meta.model_name}"
CHANGE_USER = f"{User._meta.app_label}.change_{User._meta.model_name}"

CanManageUsers = IsStaff | ModelPerm(USER_MODEL)
CanChangeUsers = IsStaff | HasPerm(CHANGE_USER)
CanManageBans = IsStaff | ModelPerm("pleate_staff.ban")
CanViewStats = IsStaff | HasPerm(f"{User._meta.app_label}.view_{User._meta.model_name}")


class UserFilter(django_filters.FilterSet):
    role = django_filters.CharFilter(field_name="groups__name", label="Role name")

    class Meta:
        model = User
        fields = ["is_active", "is_staff", "email_verified", "role"]


def _guard_target(request, target):
    if target.is_superuser and not request.user.is_superuser:
        raise ApiError("cannot_modify_superuser", _("Only a superuser can change a superuser."), 403)


@extend_schema_view(get=extend_schema(summary="List users", tags=["staff"]))
class UserListView(generics.ListAPIView):
    permission_classes = [CanManageUsers]
    serializer_class = s.StaffUserSerializer
    filterset_class = UserFilter
    search_fields = ["email", "name"]
    ordering_fields = ["date_joined", "email", "last_login", "name"]
    ordering = ["-date_joined"]

    def get_queryset(self):
        return User.objects.all()


class UserDetailView(generics.GenericAPIView):
    permission_classes = [CanManageUsers]
    serializer_class = s.StaffUserDetailSerializer

    def get_queryset(self):
        return User.objects.all()

    @extend_schema(summary="Get a user", tags=["staff"])
    def get(self, request, pk):
        return Response(s.StaffUserDetailSerializer(self.get_object()).data)

    @extend_schema(
        request=s.StaffUserUpdateSerializer,
        responses=s.StaffUserDetailSerializer,
        summary="Update a user",
        description="Deactivating a user signs it out everywhere.",
        tags=["staff"],
    )
    def patch(self, request, pk):
        user = self.get_object()
        _guard_target(request, user)
        ser = s.StaffUserUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        if user.pk == request.user.pk and (data.get("is_active") is False or data.get("is_staff") is False):
            raise ApiError("cannot_modify_self", _("You cannot deactivate or demote your own account."), 400)
        if "is_staff" in data and data["is_staff"] != user.is_staff and not request.user.is_staff:
            raise ApiError("permission_denied", _("Only staff can change staff access."), 403)
        if "roles" in data and not (request.user.is_staff or request.user.has_perm("auth.change_group")):
            raise ApiError("permission_denied", _("You cannot change roles."), 403)

        deactivated = data.get("is_active") is False and user.is_active
        fields = [f for f in ("name", "is_active", "is_staff", "email_verified") if f in data]
        for field in fields:
            setattr(user, field, data[field])
        if fields:
            user.save(update_fields=fields)
        if "roles" in data:
            set_roles(user, data["roles"])
        if deactivated:
            count = revoke_sessions(user)
            account_signals.sessions_revoked.send(sender=User, user=user, request=request, count=count)
        user = self.get_queryset().get(pk=user.pk)
        return Response(s.StaffUserDetailSerializer(user).data)

    @extend_schema(responses={204: None}, summary="Delete a user", tags=["staff"])
    def delete(self, request, pk):
        user = self.get_object()
        _guard_target(request, user)
        if user.pk == request.user.pk:
            raise ApiError("cannot_modify_self", _("You cannot delete your own account from here."), 400)
        account_signals.account_deleted.send(sender=User, user=user, request=request, email=user.email)
        if user.avatar:
            from pleate_backend.files.storage import get_storage

            get_storage().delete(user.avatar)
        revoke_sessions(user)
        user.delete()
        return Response(status=204)


class _UserAction(generics.GenericAPIView):
    permission_classes = [CanChangeUsers]
    queryset = User.objects.all()


class UserRevokeSessionsView(_UserAction):
    @extend_schema(
        request=None, responses=CountSerializer, summary="Sign a user out everywhere", tags=["staff"]
    )
    def post(self, request, pk):
        user = self.get_object()
        _guard_target(request, user)
        count = revoke_sessions(user)
        account_signals.sessions_revoked.send(sender=User, user=user, request=request, count=count)
        return Response({"count": count})


class UserPasswordResetView(_UserAction):
    @extend_schema(
        request=None, responses={202: None}, summary="Send a password reset email to a user", tags=["staff"]
    )
    def post(self, request, pk):
        user = self.get_object()
        if not user.is_active:
            raise ApiError("user_inactive", _("This account is deactivated."), 400)
        send_email(
            "password_reset",
            user.email,
            {
                "name": user.display_name,
                "action_url": frontend_url("RESET_PASSWORD", token=make_reset_token(user)),
                "action_label": _("Choose a new password"),
                "minutes": settings.PASSWORD_RESET_TIMEOUT // 60,
            },
            user.locale or get_language(),
        )
        return Response(status=202)


@extend_schema_view(
    get=extend_schema(summary="List IP bans", tags=["staff"]),
    post=extend_schema(summary="Ban an IP address or network", tags=["staff"]),
)
class BanListView(generics.ListCreateAPIView):
    permission_classes = [CanManageBans]
    serializer_class = s.BanSerializer
    search_fields = ["network", "reason"]
    ordering_fields = ["created_at", "expires_at", "network"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Ban.objects.select_related("created_by")

    def perform_create(self, serializer):
        _refuse_self_ban(self.request, serializer.validated_data["network"])
        serializer.save(created_by=self.request.user)


@extend_schema_view(
    get=extend_schema(summary="Get an IP ban", tags=["staff"]),
    patch=extend_schema(summary="Update an IP ban", tags=["staff"]),
    delete=extend_schema(summary="Lift an IP ban", tags=["staff"]),
)
class BanDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [CanManageBans]
    serializer_class = s.BanSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Ban.objects.select_related("created_by")

    def perform_update(self, serializer):
        if "network" in serializer.validated_data:
            _refuse_self_ban(self.request, serializer.validated_data["network"])
        serializer.save()


def _refuse_self_ban(request, network: str):
    import ipaddress

    try:
        if ipaddress.ip_address(client_ip(request)) in ipaddress.ip_network(network):
            raise ApiError("cannot_ban_self", _("This ban would block your own address."), 400)
    except ValueError:
        pass


class StatsView(APIView):
    permission_classes = [CanViewStats]

    @extend_schema(responses=s.StatsSerializer, summary="User and session numbers", tags=["staff"])
    def get(self, request):
        now = timezone.now()
        today = now.astimezone(UTC).date()
        start = datetime.combine(today - timedelta(days=29), time.min, tzinfo=UTC)
        counts: dict = {}
        for joined in User.objects.filter(date_joined__gte=start).values_list("date_joined", flat=True):
            day = joined.astimezone(UTC).date()
            counts[day] = counts.get(day, 0) + 1
        return Response(
            {
                "users_total": User.objects.count(),
                "users_active": User.objects.filter(is_active=True).count(),
                "users_new_7d": User.objects.filter(date_joined__gte=now - timedelta(days=7)).count(),
                "users_new_30d": User.objects.filter(date_joined__gte=now - timedelta(days=30)).count(),
                "sessions_active": UserSession.objects.filter(
                    user__isnull=False, expire_date__gt=now
                ).count(),
                "signups_by_day": [
                    {"date": day.isoformat(), "count": counts.get(day, 0)}
                    for day in (today - timedelta(days=i) for i in range(29, -1, -1))
                ],
            }
        )
