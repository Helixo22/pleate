from django.apps import apps
from django.utils.translation import gettext_lazy as _
from rest_framework.permissions import BasePermission


class DenyAPIKey(BasePermission):
    """Session only endpoints: a request authenticated with an API key is refused."""

    message = _("This action needs a signed in session, not an API key.")
    code = "api_key_not_allowed"

    def has_permission(self, request, view):
        # Lazy: account views use this even when the apikeys app is not installed.
        if not apps.is_installed("pleate_backend.apikeys"):
            return True
        from .models import APIKey

        return not isinstance(getattr(request, "auth", None), APIKey)
