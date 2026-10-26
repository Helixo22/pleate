"""
DRF permission classes. Each helper returns a class, so it goes straight into
``permission_classes`` and composes with ``|``, ``&`` and ``~``:

    permission_classes = [IsStaff | HasPerm("projects.change_project")]
    permission_classes = [HasRole("editor", "admin")]
    permission_classes = [IsAuthenticated, HasObjectPerm("projects.change_project")]
    permission_classes = [HasFeature("new-dashboard")]
    permission_classes = [ModelPerm("projects.project")]   # GET view, POST add, PATCH change, DELETE delete
"""

from django.utils.translation import gettext_lazy as _
from rest_framework.permissions import BasePermission

DENIED = _("You do not have permission to do this.")


def _signed_in(request) -> bool:
    user = getattr(request, "user", None)
    return bool(user and user.is_authenticated and user.is_active)


def HasPerm(*perms: str) -> type[BasePermission]:  # noqa: N802
    """The user holds every listed global permission ("app_label.codename")."""

    class _HasPerm(BasePermission):
        message = DENIED
        required = perms

        def has_permission(self, request, view):
            return _signed_in(request) and request.user.has_perms(perms)

    _HasPerm.__name__ = _HasPerm.__qualname__ = "HasPerm"
    return _HasPerm


def HasRole(*names: str) -> type[BasePermission]:  # noqa: N802
    """The user has at least one of the roles. Superusers always pass."""

    class _HasRole(BasePermission):
        message = DENIED
        roles = names

        def has_permission(self, request, view):
            if not _signed_in(request):
                return False
            user = request.user
            return user.is_superuser or user.groups.filter(name__in=names).exists()

    _HasRole.__name__ = _HasRole.__qualname__ = "HasRole"
    return _HasRole


def HasObjectPerm(perm: str) -> type[BasePermission]:  # noqa: N802
    """
    Object level: the user holds ``perm`` on the object (directly or through a
    role) or globally. Checked by ``get_object()`` in generic views.
    """

    class _HasObjectPerm(BasePermission):
        message = DENIED
        required = perm

        def has_permission(self, request, view):
            return _signed_in(request)

        def has_object_permission(self, request, view, obj):
            user = request.user
            return user.has_perm(perm) or user.has_perm(perm, obj)

    _HasObjectPerm.__name__ = _HasObjectPerm.__qualname__ = "HasObjectPerm"
    return _HasObjectPerm


def HasFeature(key: str) -> type[BasePermission]:  # noqa: N802
    """The feature flag is on for the request user."""

    class _HasFeature(BasePermission):
        message = _("This feature is not available.")
        code = "feature_disabled"
        feature = key

        def has_permission(self, request, view):
            from .services import feature_enabled

            return feature_enabled(getattr(request, "user", None), key)

    _HasFeature.__name__ = _HasFeature.__qualname__ = "HasFeature"
    return _HasFeature


METHOD_ACTIONS = {
    "GET": "view",
    "HEAD": "view",
    "OPTIONS": "view",
    "POST": "add",
    "PUT": "change",
    "PATCH": "change",
    "DELETE": "delete",
}


def ModelPerm(model: str) -> type[BasePermission]:  # noqa: N802
    """
    The model permission that matches the HTTP method, for ``"app_label.model"``:
    GET needs ``view_<model>``, POST ``add_<model>``, PUT/PATCH ``change_<model>``,
    DELETE ``delete_<model>``.
    """
    app_label, model_name = model.lower().split(".")

    class _ModelPerm(BasePermission):
        message = DENIED

        def has_permission(self, request, view):
            action = METHOD_ACTIONS.get(request.method)
            return (
                bool(action)
                and _signed_in(request)
                and request.user.has_perm(f"{app_label}.{action}_{model_name}")
            )

    _ModelPerm.__name__ = _ModelPerm.__qualname__ = "ModelPerm"
    return _ModelPerm
