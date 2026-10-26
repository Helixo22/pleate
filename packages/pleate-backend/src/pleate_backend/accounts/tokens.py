"""
Single purpose tokens sent by email.

- Password reset: Django's generator. The hash covers the password and last
  login, so a token dies as soon as it is used or the password changes.
- Email verification and email change: signed and timestamped payloads.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core import signing
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from pleate_backend.core.conf import pleate_settings


class _ResetTokens(PasswordResetTokenGenerator):
    key_salt = "pleate.accounts.password_reset"

    def _make_hash_value(self, user, timestamp):
        changed = "" if user.password_changed_at is None else user.password_changed_at.replace(microsecond=0)
        return f"{user.pk}{user.password}{changed}{timestamp}{user.email}"


reset_tokens = _ResetTokens()


def make_reset_token(user) -> str:
    return f"{urlsafe_base64_encode(force_bytes(user.pk))}.{reset_tokens.make_token(user)}"


def read_reset_token(token: str):
    try:
        uidb64, raw = token.split(".", 1)
        pk = force_str(urlsafe_base64_decode(uidb64))
        user = get_user_model().objects.get(pk=pk)
    except Exception:  # noqa: BLE001
        return None
    return user if reset_tokens.check_token(user, raw) else None


def make_signed(purpose: str, payload: dict) -> str:
    return signing.dumps(payload, salt=f"pleate.accounts.{purpose}", compress=True)


def read_signed(purpose: str, token: str, max_age: int | None = None) -> dict | None:
    try:
        return signing.loads(
            token,
            salt=f"pleate.accounts.{purpose}",
            max_age=max_age or pleate_settings.AUTH["EMAIL_TOKEN_MAX_AGE"],
        )
    except signing.BadSignature:
        return None
