from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.utils.translation import gettext as _
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from pleate_backend.apikeys.permissions import DenyAPIKey
from pleate_backend.core.exceptions import ApiError
from pleate_backend.core.permissions import IsStaff

from . import serializers as s
from .models import Feature
from .permissions import HasPerm, ModelPerm
from .services import enabled_features, ensure_can_assign, role_names

User = get_user_model()

CanManageRoles = IsStaff | HasPerm("auth.change_group")
CanManageFeatures = IsStaff | ModelPerm("pleate_rbac.feature")


def _roles():
    return Group.objects.select_related("role_info")


@extend_schema_view(
    get=extend_schema(summary="List roles", tags=["rbac"]),
    post=extend_schema(summary="Create a role", tags=["rbac"]),
)
class RoleListView(generics.ListCreateAPIView):
    permission_classes = [DenyAPIKey, CanManageRoles]
    serializer_class = s.RoleSerializer
    search_fields = ["name"]
    ordering_fields = ["name"]
    ordering = ["name"]

    def get_queryset(self):
        return _roles()


@extend_schema_view(
    get=extend_schema(summary="Get a role", tags=["rbac"]),
    patch=extend_schema(summary="Update a role", tags=["rbac"]),
    delete=extend_schema(summary="Delete a role", tags=["rbac"]),
)
class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [DenyAPIKey, CanManageRoles]
    serializer_class = s.RoleSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return _roles()

    def perform_destroy(self, instance):
        ensure_can_assign(self.request.user, [instance])
        instance.delete()


@extend_schema_view(get=extend_schema(summary="List every available permission", tags=["rbac"]))
class PermissionListView(generics.ListAPIView):
    permission_classes = [DenyAPIKey, CanManageRoles]
    serializer_class = s.PermissionSerializer
    search_fields = ["codename", "name", "content_type__app_label", "content_type__model"]
    ordering_fields = ["codename", "name"]
    ordering = ["codename"]

    def get_queryset(self):
        return Permission.objects.select_related("content_type")


class UserRolesView(APIView):
    """Give or take a role from a user."""

    permission_classes = [DenyAPIKey, CanManageRoles]

    def _user(self, user_id):
        return generics.get_object_or_404(User, pk=user_id)

    def _check(self, request, user, role):
        if request.user.is_superuser:
            return
        if user.pk == request.user.pk:
            raise ApiError("cannot_modify_self", _("You cannot change your own roles."), 403)
        ensure_can_assign(request.user, [role])

    @extend_schema(
        request=s.RoleAssignSerializer,
        responses=s.UserRolesSerializer,
        tags=["rbac"],
        summary="Add a role to a user",
    )
    def post(self, request, user_id):
        user = self._user(user_id)
        ser = s.RoleAssignSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        self._check(request, user, ser.validated_data["role"])
        user.groups.add(ser.validated_data["role"])
        return Response({"roles": role_names(user)})

    @extend_schema(
        request=s.RoleAssignSerializer,
        parameters=[OpenApiParameter("role", str, description="Role name, when not sent in the body.")],
        responses=s.UserRolesSerializer,
        tags=["rbac"],
        summary="Remove a role from a user",
    )
    def delete(self, request, user_id):
        user = self._user(user_id)
        data = request.data if request.data else {"role": request.query_params.get("role", "")}
        ser = s.RoleAssignSerializer(data=data)
        ser.is_valid(raise_exception=True)
        self._check(request, user, ser.validated_data["role"])
        user.groups.remove(ser.validated_data["role"])
        return Response({"roles": role_names(user)})


class MyFeaturesView(APIView):
    """Feature flags that are on for the signed in user."""

    @extend_schema(responses=s.FeatureKeysSerializer, tags=["rbac"], summary="My feature flags")
    def get(self, request):
        return Response({"features": enabled_features(request.user)})


@extend_schema_view(
    get=extend_schema(summary="List feature flags", tags=["rbac"]),
    post=extend_schema(summary="Create a feature flag", tags=["rbac"]),
)
class FeatureListView(generics.ListCreateAPIView):
    permission_classes = [DenyAPIKey, CanManageFeatures]
    serializer_class = s.FeatureSerializer
    queryset = Feature.objects.all()
    search_fields = ["key", "description"]
    ordering_fields = ["key", "created_at", "updated_at", "rollout_percent"]
    ordering = ["key"]
    filterset_fields = ["enabled"]


@extend_schema_view(
    get=extend_schema(summary="Get a feature flag", tags=["rbac"]),
    patch=extend_schema(summary="Update a feature flag", tags=["rbac"]),
    delete=extend_schema(summary="Delete a feature flag", tags=["rbac"]),
)
class FeatureDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [DenyAPIKey, CanManageFeatures]
    serializer_class = s.FeatureSerializer
    queryset = Feature.objects.all()
    http_method_names = ["get", "patch", "delete", "head", "options"]
