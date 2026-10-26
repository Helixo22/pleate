import io

import pytest
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from PIL import Image
from rest_framework.test import APIClient

from pleate_backend.accounts.models import UserSession

from .conftest import PASSWORD, link_token

pytestmark = pytest.mark.django_db
User = get_user_model()


def _png(size=(64, 48), color=(200, 30, 30)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, "PNG")
    buf.seek(0)
    buf.name = "a.png"
    return buf


# Signup


def test_signup_logs_in_and_sends_verification(api):
    res = api.post("/api/auth/signup", {"email": "New@Example.com", "password": PASSWORD, "name": "New"})
    assert res.status_code == 201, res.content
    body = res.json()
    assert body["user"]["email"] == "new@example.com"
    assert body["verification_required"] is False
    assert api.get("/api/auth/me").status_code == 200
    assert len(mail.outbox) == 1
    assert "/verify-email?token=" in mail.outbox[0].body


def test_signup_rejects_taken_email(api, user):
    res = api.post("/api/auth/signup", {"email": "ADA@example.com", "password": PASSWORD})
    assert res.status_code == 400
    assert res.json()["error"]["fields"]["email"][0]["code"] == "email_taken"


def test_signup_rejects_weak_password(api):
    res = api.post("/api/auth/signup", {"email": "x@example.com", "password": "12345678"})
    assert res.status_code == 400
    assert res.json()["error"]["fields"]["password"][0]["code"] == "weak_password"


def test_signup_disabled(api):
    with override_settings(PLEATE={"AUTH": {"SIGNUP_ENABLED": False}}):
        res = api.post("/api/auth/signup", {"email": "x@example.com", "password": PASSWORD})
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "signup_disabled"


def test_signup_with_required_verification_does_not_log_in(api):
    with override_settings(PLEATE={"AUTH": {"REQUIRE_EMAIL_VERIFICATION": True}, "EMAILS": {"ASYNC": False}}):
        res = api.post("/api/auth/signup", {"email": "x@example.com", "password": PASSWORD})
        assert res.json()["verification_required"] is True
        assert api.get("/api/auth/me").status_code == 401
        login = api.post("/api/auth/login", {"email": "x@example.com", "password": PASSWORD})
        assert login.json()["error"]["code"] == "email_not_verified"


def test_signup_is_throttled(api):
    for i in range(5):
        api.post("/api/auth/signup", {"email": f"t{i}@example.com", "password": PASSWORD})
        api.post("/api/auth/logout")
    res = api.post("/api/auth/signup", {"email": "t9@example.com", "password": PASSWORD})
    assert res.status_code == 429
    assert res["RateLimit-Remaining"] == "0"


# Login


def test_login_and_logout(api, user):
    res = api.post("/api/auth/login", {"email": "ADA@example.com", "password": PASSWORD})
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "ada@example.com"
    assert res.json()["mfa_required"] is False
    session = UserSession.objects.get(user=user)
    assert session.user_agent is not None
    assert api.post("/api/auth/logout").status_code == 204
    assert api.get("/api/auth/me").status_code == 401


def test_login_wrong_password_has_generic_error(api, user):
    res = api.post("/api/auth/login", {"email": user.email, "password": "nope-nope-nope"})
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "invalid_credentials"
    unknown = api.post("/api/auth/login", {"email": "ghost@example.com", "password": "nope-nope-nope"})
    assert unknown.json()["error"] == res.json()["error"]


def test_login_lockout_after_failures(api, user):
    for _ in range(5):
        api.post("/api/auth/login", {"email": user.email, "password": "wrong-password"})
    res = api.post("/api/auth/login", {"email": user.email, "password": PASSWORD})
    assert res.status_code == 429
    assert res.json()["error"]["code"] == "too_many_attempts"
    assert res.json()["error"]["retry_after"] > 0


def test_login_inactive_user(api, make_user):
    u = make_user(is_active=False)
    res = api.post("/api/auth/login", {"email": u.email, "password": PASSWORD})
    assert res.json()["error"]["code"] == "invalid_credentials"


def test_login_requires_csrf():
    client = APIClient(enforce_csrf_checks=True)
    res = client.post("/api/auth/login", {"email": "a@example.com", "password": "x"}, format="json")
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "csrf_failed"
    token = client.get("/api/csrf").json()["csrf_token"]
    res = client.post(
        "/api/auth/login", {"email": "a@example.com", "password": "x"}, format="json", HTTP_X_CSRFTOKEN=token
    )
    assert res.status_code == 400


def test_remember_me_sets_long_session(api, user):
    api.post("/api/auth/login", {"email": user.email, "password": PASSWORD, "remember": True})
    session = UserSession.objects.get(user=user)
    assert (session.expire_date - session.created_at).days > 300


# Profile


def test_me_get_and_patch(auth_api):
    res = auth_api.patch(
        "/api/auth/me", {"name": "Ada L.", "locale": "it", "preferences": {"theme": "dark"}}, format="json"
    )
    assert res.status_code == 200
    assert res.json()["name"] == "Ada L."
    assert res.cookies["locale"].value == "it"
    res = auth_api.patch("/api/auth/me", {"preferences": {"palette": "blue"}}, format="json")
    assert res.json()["preferences"] == {"theme": "dark", "palette": "blue"}


def test_me_cannot_change_email_or_staff(auth_api, user):
    auth_api.patch("/api/auth/me", {"email": "x@example.com", "is_staff": True}, format="json")
    user.refresh_from_db()
    assert user.email == "ada@example.com"
    assert user.is_staff is False


def test_avatar_upload_serve_and_delete(auth_api, user):
    res = auth_api.put("/api/auth/me/avatar", {"file": _png()}, format="multipart")
    assert res.status_code == 200, res.content
    url = res.json()["avatar_url"]
    assert url.startswith(f"/api/auth/avatars/{user.pk}")
    img = auth_api.get(url)
    assert img.status_code == 200
    assert img["Content-Type"] == "image/webp"
    assert Image.open(io.BytesIO(b"".join(img.streaming_content))).size == (512, 512)
    assert auth_api.delete("/api/auth/me/avatar").json()["avatar_url"] is None


def test_avatar_rejects_non_image(auth_api):
    fake = io.BytesIO(b"<script>alert(1)</script>")
    fake.name = "x.png"
    res = auth_api.put("/api/auth/me/avatar", {"file": fake}, format="multipart")
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "invalid_image"


# Password


def test_password_change_revokes_other_sessions(user):
    a, b = APIClient(), APIClient()
    a.login(email=user.email, password=PASSWORD)
    b.login(email=user.email, password=PASSWORD)
    res = a.post(
        "/api/auth/password/change",
        {"current_password": PASSWORD, "new_password": "another-good-pass-42"},
        format="json",
    )
    assert res.status_code == 204, res.content
    assert a.get("/api/auth/me").status_code == 200
    assert b.get("/api/auth/me").status_code == 401
    assert "password" in mail.outbox[-1].body


def test_password_change_wrong_current(auth_api):
    res = auth_api.post(
        "/api/auth/password/change", {"current_password": "nope", "new_password": "another-good-pass-42"}
    )
    assert res.json()["error"]["fields"]["current_password"][0]["code"] == "wrong_password"


def test_password_reset_flow(api, user):
    assert api.post("/api/auth/password/reset", {"email": user.email}).status_code == 202
    token = link_token(mail.outbox[0])
    assert api.post("/api/auth/password/reset/validate", {"token": token}).json() == {"valid": True}
    res = api.post("/api/auth/password/reset/confirm", {"token": token, "new_password": "brand-new-pass-77"})
    assert res.status_code == 204
    # Single use: the hash covers the password.
    again = api.post(
        "/api/auth/password/reset/confirm", {"token": token, "new_password": "brand-new-pass-78"}
    )
    assert again.json()["error"]["code"] == "invalid_token"
    assert (
        api.post("/api/auth/login", {"email": user.email, "password": "brand-new-pass-77"}).status_code == 200
    )


def test_password_reset_unknown_email_is_silent(api):
    assert api.post("/api/auth/password/reset", {"email": "ghost@example.com"}).status_code == 202
    assert mail.outbox == []


def test_password_reset_bad_token(api):
    res = api.post(
        "/api/auth/password/reset/confirm", {"token": "abc.def", "new_password": "brand-new-pass-77"}
    )
    assert res.json()["error"]["code"] == "invalid_token"


# Email


def test_email_verification(api, make_user):
    u = make_user(email_verified=False)
    api.force_authenticate(u)
    assert api.post("/api/auth/email/verify/resend").status_code == 202
    token = link_token(mail.outbox[-1])
    res = api.post("/api/auth/email/verify", {"token": token})
    assert res.status_code == 200
    assert res.json()["email_verified"] is True


def test_email_verification_bad_token(api):
    assert api.post("/api/auth/email/verify", {"token": "garbage"}).json()["error"]["code"] == "invalid_token"


def test_email_change_flow(auth_api, user):
    res = auth_api.post("/api/auth/email/change", {"new_email": "Ada.New@example.com", "password": PASSWORD})
    assert res.status_code == 202
    assert mail.outbox[-1].to == ["ada.new@example.com"]
    token = link_token(mail.outbox[-1])
    res = auth_api.post("/api/auth/email/change/confirm", {"token": token})
    assert res.json()["email"] == "ada.new@example.com"
    assert mail.outbox[-1].to == ["ada@example.com"]


def test_email_change_needs_password(auth_api):
    res = auth_api.post("/api/auth/email/change", {"new_email": "z@example.com", "password": "bad"})
    assert res.json()["error"]["fields"]["password"][0]["code"] == "wrong_password"


# Sessions


def test_sessions_list_and_revoke(user):
    a, b = APIClient(HTTP_USER_AGENT="Mozilla/5.0 (iPhone) Safari/604.1"), APIClient()
    a.login(email=user.email, password=PASSWORD)
    b.login(email=user.email, password=PASSWORD)
    rows = a.get("/api/auth/sessions").json()
    assert len(rows) == 2
    current = next(r for r in rows if r["current"])
    other = next(r for r in rows if not r["current"])
    assert len(current["id"]) == 24
    assert a.delete(f"/api/auth/sessions/{other['id']}").status_code == 204
    assert b.get("/api/auth/me").status_code == 401
    assert a.delete("/api/auth/sessions/unknown").status_code == 404


def test_revoke_other_sessions(user):
    clients = [APIClient() for _ in range(3)]
    for c in clients:
        c.login(email=user.email, password=PASSWORD)
    assert clients[0].post("/api/auth/sessions/revoke-others").json() == {"count": 2}
    assert clients[1].get("/api/auth/me").status_code == 401
    assert clients[0].get("/api/auth/me").status_code == 200


# Export and delete


def test_export(auth_api):
    res = auth_api.get("/api/auth/me/export")
    assert res.status_code == 200
    assert res.json()["account"]["email"] == "ada@example.com"
    assert "attachment" in res["Content-Disposition"]


def test_delete_account(session_api, user):
    res = session_api.delete("/api/auth/me", {"password": "wrong"}, format="json")
    assert res.json()["error"]["code"] == "wrong_password"
    res = session_api.delete("/api/auth/me", {"password": PASSWORD}, format="json")
    assert res.status_code == 204
    assert not User.objects.filter(pk=user.pk).exists()
    assert not UserSession.objects.filter(user_id=user.pk).exists()
