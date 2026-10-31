import time
from unittest import mock

import pyotp
import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.db import IntegrityError
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from pleate_backend.accounts import views as account_views
from pleate_backend.accounts.tokens import make_reset_token, make_signed
from pleate_backend.apikeys.models import APIKey
from pleate_backend.apikeys.services import create_key
from pleate_backend.mfa import services as mfa_services
from pleate_backend.mfa.models import BackupCode, TOTPDevice
from pleate_backend.oauth.models import SocialAccount
from pleate_backend.ratelimit import limits
from pleate_backend.ratelimit.apps import check_shared_cache
from pleate_backend.webhooks.models import Endpoint

from .conftest import PASSWORD

pytestmark = pytest.mark.django_db
User = get_user_model()


def _bearer(user, scopes=("read", "write")):
    _key, raw = create_key(user, "k", list(scopes))
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {raw}")
    return client


def _enable_mfa(user):
    device = TOTPDevice(user=user, confirmed_at=timezone.now())
    device.secret = pyotp.random_base32()
    device.save()
    mfa_services.generate_backup_codes(user)
    return device


# API keys cannot touch account security


@pytest.mark.parametrize(
    "method,path",
    [
        ("post", "/api/auth/password/change"),
        ("post", "/api/auth/email/change"),
        ("post", "/api/auth/email/change/confirm"),
        ("post", "/api/auth/sessions/revoke-others"),
        ("delete", "/api/auth/sessions/abc"),
        ("patch", "/api/auth/me"),
        ("delete", "/api/auth/me"),
        ("post", "/api/auth/mfa/setup"),
        ("post", "/api/auth/mfa/confirm"),
        ("post", "/api/auth/mfa/disable"),
        ("post", "/api/auth/mfa/backup-codes"),
        ("delete", "/api/auth/oauth/accounts/abc"),
    ],
)
def test_api_key_refused_on_account_security(user, method, path):
    res = getattr(_bearer(user), method)(path, {}, format="json")
    assert res.status_code == 403, res.content
    assert res.json()["error"]["code"] == "api_key_not_allowed"


def test_api_key_refused_on_export_even_read_only(user):
    res = _bearer(user, ["read"]).get("/api/auth/me/export")
    assert res.json()["error"]["code"] == "api_key_not_allowed"


def test_api_key_can_still_read_me_and_sessions(user):
    client = _bearer(user, ["read"])
    assert client.get("/api/auth/me").status_code == 200
    assert client.get("/api/auth/sessions").status_code == 200


def test_session_still_changes_the_account(session_api):
    res = session_api.patch("/api/auth/me", {"name": "Grace"}, format="json")
    assert res.status_code == 200
    assert session_api.get("/api/auth/me/export").status_code == 200


# Password reset and change close other ways in


def _reset(api, user, password="brand-new-pass-77"):
    return api.post(
        "/api/auth/password/reset/confirm", {"token": make_reset_token(user), "new_password": password}
    )


def _attach_everything(user):
    create_key(user, "attacker", ["read", "write"])
    SocialAccount.objects.create(user=user, provider="google", uid="g-evil", email=user.email)
    _enable_mfa(user)
    Endpoint.objects.create(owner=user, url="https://evil.example.com/hook", secret="whsec_x", events=["*"])


def test_reset_of_unverified_account_removes_attached_access(api, make_user):
    user = make_user(email="victim@example.com", email_verified=False)
    _attach_everything(user)
    assert _reset(api, user).status_code == 204
    user.refresh_from_db()
    assert user.email_verified
    assert not APIKey.objects.filter(user=user, revoked_at__isnull=True).exists()
    assert not SocialAccount.objects.filter(user=user).exists()
    assert not TOTPDevice.objects.filter(user=user).exists()
    assert not BackupCode.objects.filter(user=user).exists()
    assert not Endpoint.objects.filter(owner=user).exists()


def test_reset_of_verified_account_only_revokes_keys(api, user):
    _attach_everything(user)
    assert _reset(api, user).status_code == 204
    assert not APIKey.objects.filter(user=user, revoked_at__isnull=True).exists()
    assert SocialAccount.objects.filter(user=user).exists()
    assert TOTPDevice.objects.filter(user=user).exists()
    assert Endpoint.objects.filter(owner=user).exists()


def test_password_change_revokes_api_keys(session_api, user):
    create_key(user, "CI", ["read"])
    res = session_api.post(
        "/api/auth/password/change",
        {"current_password": PASSWORD, "new_password": "brand-new-pass-77"},
        format="json",
    )
    assert res.status_code == 204, res.content
    assert not APIKey.objects.filter(user=user, revoked_at__isnull=True).exists()


# Attempts are counted before the slow check


def test_login_counts_before_checking_the_password(api, user):
    """A request arriving while another is still checking the password sees its attempt."""
    real = account_views.authenticate
    nested = []

    def slow_authenticate(*args, **kwargs):
        if not nested:
            nested.append(
                APIClient().post("/api/auth/login", {"email": user.email, "password": "wrong"}, format="json")
            )
        return real(*args, **kwargs)

    with (
        override_settings(PLEATE={**settings.PLEATE, "AUTH": {"LOGIN_MAX_ATTEMPTS": 1}}),
        mock.patch.object(account_views, "authenticate", slow_authenticate),
    ):
        api.post("/api/auth/login", {"email": user.email, "password": "wrong"}, format="json")
    assert nested[0].status_code == 429


def test_login_success_clears_the_account_counter(api, user):
    with override_settings(PLEATE={**settings.PLEATE, "AUTH": {"LOGIN_MAX_ATTEMPTS": 2}}):
        api.post("/api/auth/login", {"email": user.email, "password": "wrong"}, format="json")
        ok = APIClient().post("/api/auth/login", {"email": user.email, "password": PASSWORD}, format="json")
        assert ok.status_code == 200
        api.post("/api/auth/login", {"email": user.email, "password": "wrong"}, format="json")
        res = api.post("/api/auth/login", {"email": user.email, "password": PASSWORD}, format="json")
    assert res.status_code == 200


def test_login_success_does_not_count_against_the_ip(user):
    with override_settings(PLEATE={**settings.PLEATE, "AUTH": {"LOGIN_IP_MAX_ATTEMPTS": 2}}):
        for _ in range(3):
            ok = APIClient().post(
                "/api/auth/login", {"email": user.email, "password": PASSWORD}, format="json"
            )
            assert ok.status_code == 200
        for _ in range(2):
            APIClient().post("/api/auth/login", {"email": user.email, "password": "wrong"}, format="json")
        res = APIClient().post("/api/auth/login", {"email": user.email, "password": PASSWORD}, format="json")
    assert res.status_code == 429


def test_mfa_verify_counts_before_checking_the_code(api, user):
    device = _enable_mfa(user)
    api.post("/api/auth/login", {"email": user.email, "password": PASSWORD}, format="json")
    real = mfa_services.verify_totp
    nested = []

    def slow_verify(*args, **kwargs):
        if not nested:
            nested.append(api.post("/api/auth/mfa/verify", {"code": "000000"}, format="json"))
        return real(*args, **kwargs)

    with (
        mock.patch.object(mfa_services, "MAX_PENDING_ATTEMPTS", 1),
        mock.patch.object(mfa_services, "verify_totp", slow_verify),
    ):
        api.post("/api/auth/mfa/verify", {"code": pyotp.TOTP(device.secret).now()}, format="json")
    assert nested[0].json()["error"]["code"] == "mfa_pending_expired"


def test_mfa_verify_success_clears_the_user_counter(user):
    device = _enable_mfa(user)
    with mock.patch("pleate_backend.mfa.views.USER_FAILURE_LIMIT", 2):
        client = APIClient()
        client.post("/api/auth/login", {"email": user.email, "password": PASSWORD}, format="json")
        res = client.post("/api/auth/mfa/verify", {"code": pyotp.TOTP(device.secret).now()}, format="json")
        assert res.status_code == 200, res.content
        assert limits.remaining(f"mfa:user:{user.pk}", 2, 900) == 2


def test_hit_is_atomic_and_refusals_do_not_count():
    assert limits.consume("t:a", 2, 60)[:3] == (True, 0, 1)
    assert limits.consume("t:a", 2, 60)[:3] == (True, 0, 0)
    allowed, retry, left, reset_in = limits.consume("t:a", 2, 60)
    assert not allowed and left == 0 and 0 < retry == reset_in <= 60
    # The refused hit was rolled back: the bucket holds exactly the limit.
    assert limits.remaining("t:a", 2, 60) == 0
    cur_key = limits._buckets("t:a", 60, time.time())[0]
    assert limits.cache.get(cur_key) == 2


def test_throttle_reset_header_is_time_left_in_window(api):
    with mock.patch.object(limits.time, "time", return_value=600 * 1000 + 15):
        res = api.post("/api/auth/password/reset", {"email": "x@example.com"}, format="json")
    # auth is 10/min: 15 s into the minute, 45 s are left.
    assert res["RateLimit-Reset"] == "45"
    assert res["RateLimit-Remaining"] == "9"


# Startup warning


def test_locmem_cache_warns_without_debug():
    locmem = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
    redis = {"default": {"BACKEND": "django.core.cache.backends.redis.RedisCache", "LOCATION": "redis://x"}}
    with override_settings(DEBUG=False, CACHES=locmem):
        assert [w.id for w in check_shared_cache()] == ["pleate_ratelimit.W001"]
    with override_settings(DEBUG=True, CACHES=locmem):
        assert check_shared_cache() == []
    with override_settings(DEBUG=False, CACHES=redis):
        assert check_shared_cache() == []


# Races on unique fields answer 409


def test_concurrent_signup_is_409(api):
    with mock.patch.object(User.objects, "create_user", side_effect=IntegrityError):
        res = api.post(
            "/api/auth/signup", {"email": "new@example.com", "password": "brand-new-pass-77"}, format="json"
        )
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "email_taken"


def test_concurrent_email_change_confirm_is_409(api, user):
    from pleate_backend.accounts.views import _password_stamp

    payload = {"uid": str(user.pk), "old": user.email, "new": "new@example.com", "pw": _password_stamp(user)}
    token = make_signed("email_change", payload)
    with mock.patch.object(User, "save", side_effect=IntegrityError):
        res = api.post("/api/auth/email/change/confirm", {"token": token}, format="json")
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "email_taken"
    assert not mail.outbox


def test_concurrent_mfa_setup_is_409(auth_api):
    with mock.patch.object(TOTPDevice, "save", side_effect=IntegrityError):
        res = auth_api.post("/api/auth/mfa/setup")
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "mfa_already_enabled"


def test_user_indexes():
    assert User._meta.get_field("date_joined").db_index
    assert User._meta.get_field("is_staff").db_index
