"""
Create and check API keys.

    key, raw = create_key(user, "CI", scopes=["read"], expires_in_days=90)
    find_key(raw)  # APIKey or None
"""

import hmac
import secrets
import string
from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from pleate_backend.core.utils import sha256

from .models import APIKey

KEY_PREFIX = "pl_"
MAX_ACTIVE_KEYS = 25
_ALPHABET = string.ascii_letters + string.digits


def generate() -> tuple[str, str]:
    """Returns ``(prefix, full_key)``."""
    prefix = "".join(secrets.choice(_ALPHABET) for _ in range(8))
    return prefix, f"{KEY_PREFIX}{prefix}_{secrets.token_urlsafe(32)}"


def normalize_scopes(scopes) -> list[str]:
    scopes = set(scopes or ["read"])
    # Writing implies reading.
    if "write" in scopes:
        scopes.add("read")
    return sorted(scopes)


def active_keys(user):
    return APIKey.objects.filter(user=user, revoked_at__isnull=True).filter(
        Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
    )


def create_key(user, name: str, scopes=None, expires_in_days: int | None = None) -> tuple[APIKey, str]:
    prefix, raw = generate()
    key = APIKey.objects.create(
        user=user,
        name=name,
        prefix=prefix,
        key_hash=sha256(raw),
        scopes=normalize_scopes(scopes),
        expires_at=timezone.now() + timedelta(days=expires_in_days) if expires_in_days else None,
    )
    return key, raw


def parse(raw: str) -> str | None:
    """The prefix of a well formed key, else None."""
    if not raw.startswith(KEY_PREFIX):
        return None
    parts = raw.split("_", 2)
    if len(parts) != 3 or len(parts[1]) != 8 or not parts[2]:
        return None
    return parts[1]


def find_key(raw: str) -> APIKey | None:
    """The key row whose hash matches, revoked or expired ones included."""
    prefix = parse(raw)
    if prefix is None:
        return None
    digest = sha256(raw)
    match = None
    for candidate in APIKey.objects.select_related("user").filter(prefix=prefix):
        # Constant time, and no early exit so timing does not leak the count.
        if hmac.compare_digest(candidate.key_hash, digest):
            match = candidate
    return match
