from django.utils.translation import gettext_lazy as _
from rest_framework.permissions import BasePermission

from .models import APIKey


class DenyAPIKey(BasePermission):
    """Session only endpoints: a request authenticated with an API key is refused."""

    message = _("This action needs a signed in session, not an API key.")
    code = "api_key_not_allowed"

    def has_permission(self, request, view):
        return not isinstance(getattr(request, "auth", None), APIKey)
