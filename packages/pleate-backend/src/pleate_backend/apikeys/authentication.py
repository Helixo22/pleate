from datetime import timedelta

from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.permissions import SAFE_METHODS

from pleate_backend.core.utils import client_ip

from .models import APIKey
from .services import KEY_PREFIX, find_key

TOUCH_EVERY = timedelta(minutes=1)


class APIKeyAuthentication(BaseAuthentication):
    """
    ``Authorization: Bearer pl_<prefix>_<secret>``. Sets ``request.auth`` to the
    ``APIKey``. Keys with only the ``read`` scope may only use safe methods.
    Requests without a ``pl_`` bearer token fall through to the next class.
    """

    keyword = "bearer"

    def authenticate(self, request):
        header = get_authorization_header(request).split()
        if len(header) != 2 or header[0].lower() != self.keyword.encode():
            return None
        try:
            raw = header[1].decode()
        except UnicodeError:
            return None
        if not raw.startswith(KEY_PREFIX):
            return None

        key = find_key(raw)
        if key is None or key.revoked_at is not None or not key.user.is_active:
            raise exceptions.AuthenticationFailed(_("This API key is not valid."), code="invalid_api_key")
        if key.is_expired:
            raise exceptions.AuthenticationFailed(_("This API key has expired."), code="api_key_expired")
        if request.method not in SAFE_METHODS and not key.can_write:
            raise exceptions.PermissionDenied(_("This API key can only read."), code="insufficient_scope")

        now = timezone.now()
        if key.last_used_at is None or now - key.last_used_at >= TOUCH_EVERY:
            ip = client_ip(request)
            APIKey.objects.filter(pk=key.pk).update(last_used_at=now, last_used_ip=ip)
            key.last_used_at, key.last_used_ip = now, ip
        return key.user, key

    def authenticate_header(self, request):
        return 'Bearer realm="api"'
