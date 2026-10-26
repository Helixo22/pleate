import hmac
import secrets
import time

import pyotp
from django.utils import timezone

from pleate_backend.core.conf import pleate_settings
from pleate_backend.core.utils import sha256

from . import signals
from .models import BackupCode, TOTPDevice

PENDING_KEY = "pl_mfa_pending"
MAX_PENDING_ATTEMPTS = 5
METHODS = ["totp", "backup_code"]

# No 0/o, 1/l/i: backup codes are often read from paper.
_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"


def _now():
    """Patched by tests to pin the TOTP clock."""
    return timezone.now()


def conf() -> dict:
    return pleate_settings.MFA or {}


def issuer() -> str:
    return conf().get("ISSUER") or pleate_settings.SITE_NAME


def confirmed_device(user) -> TOTPDevice | None:
    if not user or not user.is_authenticated:
        return None
    return TOTPDevice.objects.filter(user=user, confirmed_at__isnull=False).first()


def is_enabled(user) -> bool:
    return TOTPDevice.objects.filter(user=user, confirmed_at__isnull=False).exists()


def normalize(code: str) -> str:
    return "".join((code or "").split()).replace("-", "").lower()


def verify_totp(device: TOTPDevice, code: str) -> bool:
    """Accepts the current step and one on each side, never a step already used."""
    code = normalize(code)
    if len(code) != 6 or not code.isdigit():
        return False
    totp = pyotp.TOTP(device.secret)
    now = totp.timecode(_now())
    for step in (now - 1, now, now + 1):
        if hmac.compare_digest(totp.generate_otp(step), code):
            # Atomic: only one request can move the step forward.
            updated = TOTPDevice.objects.filter(pk=device.pk, last_used_step__lt=step).update(
                last_used_step=step
            )
            if updated:
                device.last_used_step = step
            return bool(updated)
    return False


def _format(raw: str) -> str:
    return f"{raw[:4]}-{raw[4:]}"


def generate_backup_codes(user) -> list[str]:
    """Replaces every backup code of the user. The plain codes are only returned here."""
    count = int(conf().get("BACKUP_CODES") or 10)
    codes = ["".join(secrets.choice(_ALPHABET) for _ in range(8)) for _ in range(count)]
    BackupCode.objects.filter(user=user).delete()
    BackupCode.objects.bulk_create([BackupCode(user=user, code_hash=sha256(c)) for c in codes])
    return [_format(c) for c in codes]


def backup_codes_remaining(user) -> int:
    return BackupCode.objects.filter(user=user, used_at__isnull=True).count()


def use_backup_code(user, code: str, request=None) -> bool:
    code = normalize(code)
    if not code:
        return False
    row = BackupCode.objects.filter(user=user, code_hash=sha256(code), used_at__isnull=True).first()
    if row is None:
        return False
    if not BackupCode.objects.filter(pk=row.pk, used_at__isnull=True).update(used_at=timezone.now()):
        return False
    signals.backup_code_used.send(sender=BackupCode, user=user, request=request)
    return True


def looks_like_totp(code: str) -> bool:
    code = normalize(code)
    return len(code) == 6 and code.isdigit()


def verify_any(user, device: TOTPDevice, code: str, request=None) -> bool:
    """A TOTP or a backup code."""
    if looks_like_totp(code):
        return verify_totp(device, code)
    return use_backup_code(user, code, request)


# Login integration


def login_challenge(request, user, remember: bool):
    """Registered in ``accounts.services.login_challenges``."""
    if not TOTPDevice.objects.filter(user=user, confirmed_at__isnull=False).exists():
        return None
    request.session[PENDING_KEY] = {
        "uid": str(user.pk),
        "remember": bool(remember),
        "at": time.time(),
        "attempts": 0,
    }
    return {"methods": list(METHODS)}


def read_pending(request) -> dict | None:
    pending = request.session.get(PENDING_KEY)
    if not isinstance(pending, dict):
        return None
    max_age = int(conf().get("PENDING_LOGIN_SECONDS") or 300)
    if (
        time.time() - float(pending.get("at", 0)) > max_age
        or pending.get("attempts", 0) >= MAX_PENDING_ATTEMPTS
    ):
        clear_pending(request)
        return None
    return pending


def clear_pending(request):
    if PENDING_KEY in request.session:
        del request.session[PENDING_KEY]
