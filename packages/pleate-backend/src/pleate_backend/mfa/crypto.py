"""Encryption at rest for TOTP secrets."""

import base64
import binascii

from cryptography.fernet import Fernet, InvalidToken, MultiFernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from django.conf import settings

from pleate_backend.core.conf import pleate_settings

_INFO = b"pleate.mfa.totp-secret"


def _derive(secret: str) -> bytes:
    raw = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=_INFO).derive(secret.encode())
    return base64.urlsafe_b64encode(raw)


def _as_fernet_key(value: str) -> bytes:
    """Use a Fernet key as is, stretch anything else."""
    try:
        if len(base64.urlsafe_b64decode(value.encode())) == 32:
            return value.encode()
    except (binascii.Error, ValueError):
        pass
    return _derive(value)


def _fernet() -> MultiFernet:
    configured = (pleate_settings.MFA or {}).get("ENCRYPTION_KEY")
    if configured:
        keys = [_as_fernet_key(configured)]
    else:
        keys = [_derive(settings.SECRET_KEY)]
        keys += [_derive(old) for old in getattr(settings, "SECRET_KEY_FALLBACKS", [])]
    return MultiFernet([Fernet(k) for k in keys])


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("The TOTP secret cannot be decrypted with the configured key.") from exc
