import re
from datetime import UTC, datetime
from unittest import mock

import pyotp
import pytest
from cryptography.fernet import Fernet
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import Client, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from pleate_backend.accounts.models import UserSession
from pleate_backend.mfa import crypto, services, signals
from pleate_backend.mfa.models import BackupCode, TOTPDevice

from .conftest import PASSWORD

pytestmark = pytest.mark.django_db
User = get_user_model()

NOW = datetime(2026, 10, 26, 12, 0, 15, tzinfo=UTC)
CODE_FORMAT = re.compile(r"^[a-z2-9]{4}-[a-z2-9]{4}$")


@pytest.fixture(autouse=True)
def clock():
    """Pins the TOTP clock so codes for the previous, current and next step are predictable."""
    with mock.patch.object(services, "_now", return_value=NOW):
        yield


def totp(secret, offset=0):
    t = pyotp.TOTP(secret)
    return t.generate_otp(t.timecode(NOW) + offset)


def enable(user):
    device = TOTPDevice(user=user, confirmed_at=timezone.now())
    device.secret = pyotp.random_base32()
    device.save()
    return device, services.generate_backup_codes(user)


@pytest.fixture
def enabled(user):
    return enable(user)


def _login(client, user, remember=False):
    return client.post("/api/auth/login", {"email": user.email, "password": PASSWORD, "remember": remember})


class Catcher:
    def __init__(self, signal):
        self.calls = []
        signal.connect(self, weak=False)
        self.signal = signal

    def __call__(self, sender, **kwargs):
        self.calls.append(kwargs)

    def close(self):
        self.signal.disconnect(self)


@pytest.fixture
def catch():
    catchers = []

    def make(signal):
        c = Catcher(signal)
        catchers.append(c)
        return c

    yield make
    for c in catchers:
        c.close()


# Status and setup


def test_status_disabled(auth_api):
    assert auth_api.get("/api/auth/mfa/").json() == {
        "enabled": False,
        "confirmed_at": None,
        "backup_codes_remaining": 0,
    }


def test_status_requires_auth(api):
    assert api.get("/api/auth/mfa/").status_code == 401


def test_status_enabled(auth_api, enabled):
    body = auth_api.get("/api/auth/mfa/").json()
    assert body["enabled"] is True
    assert body["confirmed_at"]
    assert body["backup_codes_remaining"] == 10


def test_setup_returns_secret_url_and_qr(auth_api, user):
    res = auth_api.post("/api/auth/mfa/setup")
    assert res.status_code == 200, res.content
    body = res.json()
    assert body["otpauth_url"].startswith("otpauth://totp/")
    assert "issuer=Plate" in body["otpauth_url"]
    assert body["secret"] in body["otpauth_url"]
    assert body["qr_svg"].startswith("<svg")
    device = TOTPDevice.objects.get(user=user)
    assert device.confirmed_at is None
    # Encrypted at rest.
    assert body["secret"] not in device.secret_encrypted
    assert device.secret == body["secret"]


def test_setup_uses_configured_issuer(auth_api):
    with override_settings(PLEATE={"MFA": {"ISSUER": "Acme App"}}):
        url = auth_api.post("/api/auth/mfa/setup").json()["otpauth_url"]
    assert "issuer=Acme%20App" in url


def test_setup_replaces_unconfirmed_device(auth_api, user):
    first = auth_api.post("/api/auth/mfa/setup").json()["secret"]
    second = auth_api.post("/api/auth/mfa/setup").json()["secret"]
    assert first != second
    assert TOTPDevice.objects.filter(user=user).count() == 1
    assert TOTPDevice.objects.get(user=user).secret == second


def test_setup_refused_when_enabled(auth_api, enabled):
    res = auth_api.post("/api/auth/mfa/setup")
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "mfa_already_enabled"


# Confirm


def test_confirm_enables_and_returns_backup_codes(auth_api, user, catch):
    caught = catch(signals.mfa_enabled)
    secret = auth_api.post("/api/auth/mfa/setup").json()["secret"]
    res = auth_api.post("/api/auth/mfa/confirm", {"code": totp(secret)})
    assert res.status_code == 200, res.content
    codes = res.json()["backup_codes"]
    assert len(codes) == 10
    assert all(CODE_FORMAT.match(c) for c in codes)
    assert len(set(codes)) == 10
    assert TOTPDevice.objects.get(user=user).confirmed_at is not None
    assert caught.calls[0]["user"] == user
    assert "turned on" in mail.outbox[-1].body
    assert auth_api.get("/api/auth/me").json()["extra"]["mfa_enabled"] is True
    # Only hashes are stored.
    stored = set(BackupCode.objects.filter(user=user).values_list("code_hash", flat=True))
    assert not stored & {c.replace("-", "") for c in codes}


def test_confirm_backup_code_count_setting(auth_api):
    secret = auth_api.post("/api/auth/mfa/setup").json()["secret"]
    with override_settings(PLEATE={"MFA": {"BACKUP_CODES": 4}, "EMAILS": {"ASYNC": False}}):
        res = auth_api.post("/api/auth/mfa/confirm", {"code": totp(secret)})
    assert len(res.json()["backup_codes"]) == 4


def test_confirm_accepts_adjacent_steps_only(auth_api):
    secret = auth_api.post("/api/auth/mfa/setup").json()["secret"]
    res = auth_api.post("/api/auth/mfa/confirm", {"code": totp(secret, 2)})
    assert res.json()["error"]["code"] == "invalid_code"
    res = auth_api.post("/api/auth/mfa/confirm", {"code": totp(secret, -1)})
    assert res.status_code == 200


def test_confirm_wrong_code(auth_api, user):
    auth_api.post("/api/auth/mfa/setup")
    res = auth_api.post("/api/auth/mfa/confirm", {"code": "000000"})
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "invalid_code"
    assert TOTPDevice.objects.get(user=user).confirmed_at is None
    assert auth_api.get("/api/auth/me").json()["extra"]["mfa_enabled"] is False


def test_confirm_without_setup(auth_api):
    res = auth_api.post("/api/auth/mfa/confirm", {"code": "123456"})
    assert res.json()["error"]["code"] == "mfa_setup_required"


def test_confirm_when_already_enabled(auth_api, enabled):
    device, _codes = enabled
    res = auth_api.post("/api/auth/mfa/confirm", {"code": totp(device.secret)})
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "mfa_already_enabled"


def test_confirm_requires_code(auth_api):
    res = auth_api.post("/api/auth/mfa/confirm", {})
    assert res.json()["error"]["fields"]["code"][0]["code"] == "required"


# TOTP rules


def test_totp_code_cannot_be_replayed(user):
    device, _codes = enable(user)
    code = totp(device.secret)
    assert services.verify_totp(device, code) is True
    assert services.verify_totp(device, code) is False
    # An older step is refused too once a newer one was used.
    assert services.verify_totp(device, totp(device.secret, -1)) is False
    assert services.verify_totp(device, totp(device.secret, 1)) is True


def test_totp_rejects_malformed_codes(user):
    device, _codes = enable(user)
    for bad in ("", "12345", "1234567", "abcdef"):
        assert services.verify_totp(device, bad) is False
    assert services.verify_totp(device, " " + totp(device.secret)[:3] + " " + totp(device.secret)[3:]) is True


def test_backup_codes_are_single_use(user, catch):
    caught = catch(signals.backup_code_used)
    _device, codes = enable(user)
    assert services.use_backup_code(user, codes[0].upper()) is True
    assert services.use_backup_code(user, codes[0]) is False
    assert services.use_backup_code(user, "") is False
    assert services.backup_codes_remaining(user) == 9
    assert len(caught.calls) == 1


# Login with a second factor


def test_login_requires_second_factor(api, user, enabled):
    res = _login(api, user)
    assert res.status_code == 200
    assert res.json() == {"mfa_required": True, "methods": ["totp", "backup_code"]}
    assert api.get("/api/auth/me").status_code == 401
    assert not UserSession.objects.filter(user=user).exists()


def test_login_without_device_is_unchanged(api, user):
    auth = APIClient()
    auth.force_authenticate(user)
    auth.post("/api/auth/mfa/setup")  # unconfirmed devices do not count
    res = _login(api, user)
    assert res.json()["mfa_required"] is False


def test_verify_with_totp_completes_login(api, user, enabled):
    device, _codes = enabled
    _login(api, user, remember=True)
    res = api.post("/api/auth/mfa/verify", {"code": totp(device.secret)})
    assert res.status_code == 200, res.content
    assert res.json()["mfa_required"] is False
    assert res.json()["user"]["email"] == user.email
    assert res.json()["user"]["extra"]["mfa_enabled"] is True
    assert api.get("/api/auth/me").status_code == 200
    session = UserSession.objects.get(user=user)
    assert (session.expire_date - session.created_at).days > 300
    # The pending login is consumed.
    again = api.post("/api/auth/mfa/verify", {"code": totp(device.secret, 1)})
    assert again.json()["error"]["code"] == "mfa_pending_expired"


def test_verify_with_backup_code(api, user, enabled, catch):
    caught = catch(signals.backup_code_used)
    _device, codes = enabled
    _login(api, user)
    res = api.post("/api/auth/mfa/verify", {"backup_code": codes[3]})
    assert res.status_code == 200, res.content
    assert caught.calls[0]["user"] == user
    other = APIClient()
    _login(other, user)
    res = other.post("/api/auth/mfa/verify", {"backup_code": codes[3]})
    assert res.json()["error"]["code"] == "invalid_code"


def test_verify_rejects_replayed_totp(api, user, enabled):
    device, _codes = enabled
    code = totp(device.secret)
    _login(api, user)
    assert api.post("/api/auth/mfa/verify", {"code": code}).status_code == 200
    other = APIClient()
    _login(other, user)
    assert other.post("/api/auth/mfa/verify", {"code": code}).json()["error"]["code"] == "invalid_code"


def test_verify_wrong_codes_end_the_pending_login(api, user, enabled):
    device, _codes = enabled
    _login(api, user)
    lefts = []
    for _ in range(5):
        res = api.post("/api/auth/mfa/verify", {"code": "000000"})
        assert res.json()["error"]["code"] == "invalid_code"
        lefts.append(res.json()["error"]["attempts_left"])
    assert lefts == [4, 3, 2, 1, 0]
    res = api.post("/api/auth/mfa/verify", {"code": totp(device.secret)})
    assert res.json()["error"]["code"] == "mfa_pending_expired"


def test_verify_without_pending_login(api, enabled):
    res = api.post("/api/auth/mfa/verify", {"code": "123456"})
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "mfa_pending_expired"


def test_verify_pending_login_expires(api, user, enabled):
    device, _codes = enabled
    _login(api, user)
    with mock.patch.object(services.time, "time", return_value=services.time.time() + 301):
        res = api.post("/api/auth/mfa/verify", {"code": totp(device.secret)})
    assert res.json()["error"]["code"] == "mfa_pending_expired"


def test_verify_when_device_removed_meanwhile(api, user, enabled):
    device, _codes = enabled
    _login(api, user)
    TOTPDevice.objects.filter(user=user).delete()
    res = api.post("/api/auth/mfa/verify", {"code": totp(device.secret)})
    assert res.json()["error"]["code"] == "mfa_pending_expired"


def test_verify_requires_a_code(api, user, enabled):
    _login(api, user)
    res = api.post("/api/auth/mfa/verify", {})
    assert res.json()["error"]["code"] == "code_required"


def test_verify_per_user_failure_limit(user, enabled):
    device, _codes = enabled
    with mock.patch("pleate_backend.mfa.views.USER_FAILURE_LIMIT", 3):
        client = APIClient()
        _login(client, user)
        for _ in range(3):
            client.post("/api/auth/mfa/verify", {"code": "000000"})
        res = client.post("/api/auth/mfa/verify", {"code": totp(device.secret)})
    assert res.status_code == 429
    assert res.json()["error"]["code"] == "too_many_attempts"


def test_verify_requires_csrf(user, enabled):
    client = APIClient(enforce_csrf_checks=True)
    res = client.post("/api/auth/mfa/verify", {"code": "123456"}, format="json")
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "csrf_failed"


# Disable


def test_disable_with_totp(auth_api, user, enabled, catch):
    caught = catch(signals.mfa_disabled)
    device, _codes = enabled
    res = auth_api.post("/api/auth/mfa/disable", {"password": PASSWORD, "code": totp(device.secret)})
    assert res.status_code == 204, res.content
    assert not TOTPDevice.objects.filter(user=user).exists()
    assert not BackupCode.objects.filter(user=user).exists()
    assert caught.calls[0]["user"] == user
    assert "turned off" in mail.outbox[-1].body
    assert auth_api.get("/api/auth/mfa/").json()["enabled"] is False


def test_disable_with_backup_code(auth_api, user, enabled):
    _device, codes = enabled
    res = auth_api.post("/api/auth/mfa/disable", {"password": PASSWORD, "code": codes[0]})
    assert res.status_code == 204


def test_disable_wrong_password(auth_api, user, enabled):
    device, _codes = enabled
    res = auth_api.post("/api/auth/mfa/disable", {"password": "nope", "code": totp(device.secret)})
    assert res.json()["error"]["code"] == "wrong_password"
    assert TOTPDevice.objects.filter(user=user).exists()


def test_disable_wrong_code(auth_api, user, enabled):
    res = auth_api.post("/api/auth/mfa/disable", {"password": PASSWORD, "code": "000000"})
    assert res.json()["error"]["code"] == "invalid_code"
    res = auth_api.post("/api/auth/mfa/disable", {"password": PASSWORD, "code": "zzzz-zzzz"})
    assert res.json()["error"]["code"] == "invalid_code"


def test_disable_without_password_for_oauth_users(api, make_user):
    u = make_user()
    u.set_unusable_password()
    u.has_password = False
    u.save()
    device, _codes = enable(u)
    api.force_authenticate(u)
    res = api.post("/api/auth/mfa/disable", {"code": totp(device.secret)})
    assert res.status_code == 204, res.content


def test_disable_when_not_enabled(auth_api):
    res = auth_api.post("/api/auth/mfa/disable", {"password": PASSWORD, "code": "123456"})
    assert res.json()["error"]["code"] == "mfa_not_enabled"


# Backup codes


def test_regenerate_backup_codes(auth_api, user, enabled):
    device, old = enabled
    services.use_backup_code(user, old[1])
    res = auth_api.post("/api/auth/mfa/backup-codes", {"code": totp(device.secret)})
    assert res.status_code == 200, res.content
    new = res.json()["backup_codes"]
    assert len(new) == 10
    assert services.backup_codes_remaining(user) == 10
    assert services.use_backup_code(user, old[0]) is False
    assert services.use_backup_code(user, new[0]) is True


def test_regenerate_backup_codes_with_a_backup_code(auth_api, enabled):
    _device, old = enabled
    assert auth_api.post("/api/auth/mfa/backup-codes", {"code": old[0]}).status_code == 200


def test_regenerate_backup_codes_errors(auth_api, user):
    res = auth_api.post("/api/auth/mfa/backup-codes", {"code": "123456"})
    assert res.json()["error"]["code"] == "mfa_not_enabled"
    enable(user)
    res = auth_api.post("/api/auth/mfa/backup-codes", {"code": "000000"})
    assert res.json()["error"]["code"] == "invalid_code"


# Export, deletion, admin


def test_export_has_state_but_no_secrets(auth_api, enabled):
    device, codes = enabled
    data = auth_api.get("/api/auth/me/export").json()
    assert data["mfa"]["enabled"] is True
    assert set(data["mfa"]) == {"enabled", "created_at", "enabled_at"}
    raw = str(data)
    assert device.secret not in raw
    assert codes[0] not in raw


def test_export_without_mfa(auth_api):
    assert auth_api.get("/api/auth/me/export").json()["mfa"] == {"enabled": False}


def test_deleting_the_user_removes_mfa_data(user, enabled):
    user.delete()
    assert not TOTPDevice.objects.exists()
    assert not BackupCode.objects.exists()


def test_admin_never_shows_the_secret(staff, user, enabled):
    device, _codes = enabled
    client = Client()
    client.force_login(staff)
    listing = client.get("/admin/pleate_mfa/totpdevice/")
    assert listing.status_code == 200
    page = client.get(f"/admin/pleate_mfa/totpdevice/{device.pk}/change/")
    assert page.status_code == 200
    content = page.content.decode()
    assert device.secret not in content
    assert device.secret_encrypted not in content
    assert client.get("/admin/pleate_mfa/backupcode/").status_code == 200


# Encryption


def test_encryption_with_configured_fernet_key():
    key = Fernet.generate_key().decode()
    with override_settings(PLEATE={"MFA": {"ENCRYPTION_KEY": key}}):
        token = crypto.encrypt("SECRET")
        assert Fernet(key.encode()).decrypt(token.encode()) == b"SECRET"
    with pytest.raises(ValueError):
        crypto.decrypt(token)


def test_encryption_with_passphrase_key():
    with override_settings(PLEATE={"MFA": {"ENCRYPTION_KEY": "any long passphrase"}}):
        assert crypto.decrypt(crypto.encrypt("SECRET")) == "SECRET"


def test_encryption_survives_secret_key_rotation():
    token = crypto.encrypt("SECRET")
    with override_settings(
        SECRET_KEY="a-brand-new-secret-key-0123456789",
        SECRET_KEY_FALLBACKS=["test-secret-key-not-for-production-0123456789"],
    ):
        assert crypto.decrypt(token) == "SECRET"
