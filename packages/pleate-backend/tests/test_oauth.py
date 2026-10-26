import base64
import hashlib
import json
import time
from urllib.parse import parse_qs, urlencode, urlparse

import httpx
import jwt
import pyotp
import pytest
import respx
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import Client, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from pleate_backend.accounts import signals as account_signals
from pleate_backend.accounts.models import UserSession
from pleate_backend.mfa.models import TOTPDevice
from pleate_backend.oauth import providers, signals
from pleate_backend.oauth.models import SocialAccount

from .conftest import PASSWORD

pytestmark = pytest.mark.django_db
User = get_user_model()

GOOGLE_TOKEN = "https://oauth2.googleapis.com/token"
GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo"
GITHUB_TOKEN = "https://github.com/login/oauth/access_token"
APPLE_TOKEN = "https://appleid.apple.com/auth/token"
APPLE_JWKS = "https://appleid.apple.com/auth/keys"
IDP = "https://idp.example.com"
DISCOVERY = f"{IDP}/.well-known/openid-configuration"

RSA_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
OTHER_RSA_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
APPLE_KEY = ec.generate_private_key(ec.SECP256R1())
APPLE_PEM = APPLE_KEY.private_bytes(
    serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
).decode()


def jwks():
    key = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(RSA_KEY.public_key()))
    return {"keys": [{**key, "kid": "k1", "use": "sig", "alg": "RS256"}]}


def id_token(nonce, *, iss="https://accounts.google.com", aud="google-client", key=RSA_KEY, **claims):
    now = int(time.time())
    payload = {"iss": iss, "aud": aud, "sub": "g-123", "iat": now, "exp": now + 600, "nonce": nonce}
    payload.update(claims)
    return jwt.encode(payload, key, algorithm="RS256", headers={"kid": "k1"})


PROVIDERS = {
    "google": {"client_id": "google-client", "client_secret": "google-secret"},
    "github": {"client_id": "gh-client", "client_secret": "gh-secret"},
    "apple": {
        "client_id": "com.example.web",
        "team_id": "TEAM123",
        "key_id": "KEY123",
        "private_key": APPLE_PEM,
    },
    "acme": {
        "type": "oidc",
        "name": "Acme SSO",
        "discovery_url": DISCOVERY,
        "client_id": "acme-client",
        "client_secret": "acme-secret",
        "scopes": ["openid", "email"],
    },
}


def pleate(**oauth):
    return {
        "SITE_NAME": "Plate",
        "FRONTEND_URL": "http://app.test",
        "EMAILS": {"ASYNC": False},
        "OAUTH": {"PROVIDERS": PROVIDERS, **oauth},
    }


@pytest.fixture(autouse=True)
def configured():
    providers.reset_caches()
    with override_settings(PLEATE=pleate()):
        yield
    providers.reset_caches()


@pytest.fixture
def router():
    with respx.mock(assert_all_called=False) as r:
        yield r


@pytest.fixture
def catch():
    caught = []

    def make(signal):
        calls = []

        def receiver(sender, **kwargs):
            calls.append(kwargs)

        signal.connect(receiver, weak=False)
        caught.append((signal, receiver))
        return calls

    yield make
    for signal, receiver in caught:
        signal.disconnect(receiver)


def query(url):
    return {k: v[0] for k, v in parse_qs(urlparse(url).query).items()}


def start(client, provider="google", **params):
    res = client.get(f"/api/auth/oauth/{provider}/start", params)
    assert res.status_code == 302, res.content
    return query(res["Location"])


def callback(client, provider, state, code="the-code", **extra):
    res = client.get(f"/api/auth/oauth/{provider}/callback", {"code": code, "state": state, **extra})
    assert res.status_code == 302, res.content
    assert res["Location"].startswith("http://app.test/auth/oauth/done?")
    return query(res["Location"])


def mock_google(router, nonce_from, **claims):
    """Token endpoint answering with an id_token for the nonce sent at start."""
    claims.setdefault("email", "new@example.com")
    claims.setdefault("email_verified", True)
    claims.setdefault("name", "New Person")
    router.post(GOOGLE_TOKEN).respond(
        json={
            "access_token": "at",
            "token_type": "Bearer",
            "id_token": id_token(nonce_from["nonce"], **claims),
        }
    )
    router.get(GOOGLE_JWKS).respond(json=jwks())


def google_flow(client, router, **claims):
    params = start(client, "google")
    mock_google(router, params, **claims)
    return callback(client, "google", params["state"])


# Providers list


def test_providers_lists_configured_ones(api):
    res = api.get("/api/auth/oauth/providers")
    assert res.status_code == 200
    assert res.json() == [
        {"id": "google", "name": "Google"},
        {"id": "github", "name": "GitHub"},
        {"id": "apple", "name": "Apple"},
        {"id": "acme", "name": "Acme SSO"},
    ]


def test_providers_empty_and_unknown_types(api):
    with override_settings(PLEATE={"OAUTH": {"PROVIDERS": {"weird": {"type": "nope", "client_id": "x"}}}}):
        assert api.get("/api/auth/oauth/providers").json() == []
        assert api.get("/api/auth/oauth/weird/start").status_code == 404


def test_register_custom_provider(api):
    class Custom(providers.Provider):
        name = "Custom"
        authorize_url = "https://custom.example.com/auth"

    providers.register_provider("custom", Custom)
    try:
        with override_settings(
            PLEATE={"OAUTH": {"PROVIDERS": {"mine": {"type": "custom", "client_id": "c"}}}}
        ):
            assert api.get("/api/auth/oauth/providers").json() == [{"id": "mine", "name": "Custom"}]
            params = start(api, "mine")
            assert params["client_id"] == "c"
    finally:
        providers._registry.pop("custom")


# Start


def test_start_redirects_with_state_nonce_and_pkce(api):
    res = api.get("/api/auth/oauth/google/start", {"next": "/settings"})
    assert res.status_code == 302
    url = urlparse(res["Location"])
    assert f"{url.scheme}://{url.netloc}{url.path}" == "https://accounts.google.com/o/oauth2/v2/auth"
    params = query(res["Location"])
    assert params["client_id"] == "google-client"
    assert params["response_type"] == "code"
    assert params["redirect_uri"] == "http://testserver/api/auth/oauth/google/callback"
    assert params["scope"] == "openid email profile"
    assert params["code_challenge_method"] == "S256"
    assert len(params["state"]) > 30
    assert len(params["nonce"]) > 30
    flow = api.session["pl_oauth"][params["state"]]
    assert flow["nonce"] == params["nonce"]
    assert flow["next"] == "/settings"
    assert flow["mode"] == "login"
    expected = (
        base64.urlsafe_b64encode(hashlib.sha256(flow["verifier"].encode()).digest()).rstrip(b"=").decode()
    )
    assert params["code_challenge"] == expected


@pytest.mark.parametrize("bad", ["//evil.com", "https://evil.com/x", "evil", "/\\evil.com", ""])
def test_start_rejects_external_next(api, bad):
    params = start(api, "google", next=bad)
    assert api.session["pl_oauth"][params["state"]]["next"] == "/"


def test_start_unknown_provider(api):
    res = api.get("/api/auth/oauth/nope/start")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "oauth_unknown_provider"


def test_start_invalid_mode(api):
    assert (
        api.get("/api/auth/oauth/google/start", {"mode": "admin"}).json()["error"]["code"] == "invalid_mode"
    )


def test_start_link_requires_a_user(api):
    res = api.get("/api/auth/oauth/google/start", {"mode": "link"})
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "not_authenticated"


def test_start_keeps_a_few_parallel_flows(api):
    states = [start(api)["state"] for _ in range(7)]
    flows = api.session["pl_oauth"]
    assert len(flows) == 5
    assert states[-1] in flows
    assert states[0] not in flows


def test_callback_base_url_setting(api):
    with override_settings(PLEATE=pleate(CALLBACK_BASE_URL="https://api.example.com/")):
        params = start(api)
    assert params["redirect_uri"] == "https://api.example.com/api/auth/oauth/google/callback"


# Callback: signup and login


def test_callback_signs_up_a_new_user(api, router, catch):
    signed_up = catch(account_signals.user_signed_up)
    linked = catch(signals.social_account_linked)
    params = start(api, "google", next="/welcome")
    mock_google(router, params, picture="https://img.example.com/a.png")
    result = callback(api, "google", params["state"])
    assert result == {"status": "ok", "next": "/welcome"}

    token_request = router.calls[0].request
    body = parse_qs(token_request.content.decode())
    verifier = body["code_verifier"][0]
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    assert challenge == params["code_challenge"]
    assert body["code"] == ["the-code"]
    assert body["client_secret"] == ["google-secret"]

    user = User.objects.get(email="new@example.com")
    assert user.has_password is False
    assert user.has_usable_password() is False
    assert user.email_verified is True
    assert user.name == "New Person"
    account = SocialAccount.objects.get(user=user)
    assert (account.provider, account.uid) == ("google", "g-123")
    assert account.extra["picture"] == "https://img.example.com/a.png"
    assert signed_up[0]["user"] == user
    assert linked[0]["social_account"] == account
    me = api.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["extra"]["oauth_providers"] == ["google"]


def test_callback_logs_in_an_existing_identity(api, router, user):
    SocialAccount.objects.create(user=user, provider="google", uid="g-123", email=user.email)
    result = google_flow(api, router, email="other@example.com")
    assert result["status"] == "ok"
    assert api.get("/api/auth/me").json()["email"] == user.email
    account = SocialAccount.objects.get(user=user)
    assert account.last_login_at is not None
    assert account.email == "other@example.com"
    assert User.objects.count() == 1


def test_callback_remember_me(api, router, user):
    SocialAccount.objects.create(user=user, provider="google", uid="g-123")
    params = start(api, "google", remember="1")
    mock_google(router, params)
    callback(api, "google", params["state"])
    session = UserSession.objects.get(user=user)
    assert (session.expire_date - session.created_at).days > 300


def test_callback_refuses_existing_email(api, router, user):
    result = google_flow(api, router, email="ADA@example.com")
    assert result == {"status": "error", "code": "oauth_email_exists", "next": "/"}
    assert not SocialAccount.objects.exists()
    assert api.get("/api/auth/me").status_code == 401


def test_callback_refuses_unverified_email(api, router):
    result = google_flow(api, router, email_verified=False)
    assert result["code"] == "oauth_email_unverified"
    assert not User.objects.exists()


def test_callback_refuses_missing_email(api, router):
    router.get(GOOGLE_USERINFO).respond(json={"sub": "g-123"})
    params = start(api, "google")
    router.post(GOOGLE_TOKEN).respond(
        json={"access_token": "at", "id_token": id_token(params["nonce"], name="X")}
    )
    router.get(GOOGLE_JWKS).respond(json=jwks())
    assert callback(api, "google", params["state"])["code"] == "oauth_email_unverified"


def test_callback_signup_disabled(api, router):
    with override_settings(PLEATE=pleate(ALLOW_SIGNUP=False)):
        result = google_flow(api, router)
    assert result["code"] == "oauth_signup_disabled"
    assert not User.objects.exists()


def test_callback_inactive_user(api, router, make_user):
    u = make_user(is_active=False)
    SocialAccount.objects.create(user=u, provider="google", uid="g-123")
    assert google_flow(api, router)["code"] == "account_inactive"
    assert api.get("/api/auth/me").status_code == 401


# Callback: state and provider errors


def test_callback_state_mismatch(api, router):
    start(api, "google")
    assert callback(api, "google", "forged-state") == {
        "status": "error",
        "code": "oauth_state_mismatch",
        "next": "/",
    }
    res = api.get("/api/auth/oauth/google/callback", {"code": "x"})
    assert query(res["Location"])["code"] == "oauth_state_mismatch"
    assert len(router.calls) == 0


def test_callback_state_from_another_browser(api, router):
    params = start(api, "google")
    other = APIClient()
    assert callback(other, "google", params["state"])["code"] == "oauth_state_mismatch"


def test_callback_state_for_another_provider(api, router):
    params = start(api, "google")
    assert callback(api, "github", params["state"])["code"] == "oauth_state_mismatch"


def test_callback_state_is_single_use(api, router):
    params = start(api, "google")
    mock_google(router, params)
    assert callback(api, "google", params["state"])["status"] == "ok"
    assert callback(api, "google", params["state"])["code"] == "oauth_state_mismatch"


def test_callback_state_expires(api, router):
    params = start(api, "google")
    session = api.session
    session["pl_oauth"][params["state"]]["at"] -= 3600
    session.save()
    assert callback(api, "google", params["state"])["code"] == "oauth_state_mismatch"


def test_callback_provider_denied(api, router):
    params = start(api, "google", next="/x")
    res = api.get("/api/auth/oauth/google/callback", {"state": params["state"], "error": "access_denied"})
    assert query(res["Location"]) == {"status": "error", "code": "oauth_provider_error", "next": "/x"}


def test_callback_token_error(api, router):
    params = start(api, "google")
    router.post(GOOGLE_TOKEN).respond(400, json={"error": "invalid_grant"})
    assert callback(api, "google", params["state"])["code"] == "oauth_provider_error"


def test_callback_token_network_error(api, router):
    params = start(api, "google")
    router.post(GOOGLE_TOKEN).mock(side_effect=httpx.ConnectError("down"))
    assert callback(api, "google", params["state"])["code"] == "oauth_provider_error"


@pytest.mark.parametrize(
    "override",
    [
        {"key": OTHER_RSA_KEY},
        {"aud": "someone-else"},
        {"iss": "https://evil.example.com"},
        {"nonce": "wrong-nonce"},
        {"exp": int(time.time()) - 3600},
    ],
)
def test_callback_rejects_bad_id_tokens(api, router, override):
    params = start(api, "google")
    nonce = override.pop("nonce", params["nonce"])
    router.post(GOOGLE_TOKEN).respond(
        json={
            "access_token": "at",
            "id_token": id_token(nonce, email="n@example.com", email_verified=True, **override),
        }
    )
    router.get(GOOGLE_JWKS).respond(json=jwks())
    assert callback(api, "google", params["state"])["code"] == "oauth_provider_error"
    assert not User.objects.exists()


def test_callback_without_id_token(api, router):
    params = start(api, "google")
    router.post(GOOGLE_TOKEN).respond(json={"access_token": "at"})
    assert callback(api, "google", params["state"])["code"] == "oauth_provider_error"


# MFA


def test_callback_redirects_to_mfa_when_enabled(api, router, user):
    SocialAccount.objects.create(user=user, provider="google", uid="g-123")
    device = TOTPDevice(user=user, confirmed_at=timezone.now())
    device.secret = pyotp.random_base32()
    device.save()
    params = start(api, "google", next="/dashboard")
    mock_google(router, params)
    result = callback(api, "google", params["state"])
    assert result == {"status": "mfa_required", "next": "/dashboard"}
    assert api.get("/api/auth/me").status_code == 401
    res = api.post("/api/auth/mfa/verify", {"code": pyotp.TOTP(device.secret).now()})
    assert res.status_code == 200, res.content
    assert api.get("/api/auth/me").json()["email"] == user.email


# Link and unlink


def test_link_attaches_to_the_signed_in_user(session_api, router, user, catch):
    linked = catch(signals.social_account_linked)
    params = start(session_api, "google", mode="link", next="/settings/accounts")
    mock_google(router, params, email="ada.work@example.com")
    result = callback(session_api, "google", params["state"])
    assert result == {"status": "ok", "next": "/settings/accounts"}
    account = SocialAccount.objects.get(provider="google", uid="g-123")
    assert account.user == user
    assert account.email == "ada.work@example.com"
    assert linked[0]["user"] == user
    assert "linked" in mail.outbox[-1].body
    # Linking again is a no op.
    params = start(session_api, "google", mode="link")
    mock_google(router, params)
    assert callback(session_api, "google", params["state"])["status"] == "ok"
    assert SocialAccount.objects.count() == 1


def test_link_refuses_an_identity_of_someone_else(session_api, router, make_user):
    other = make_user()
    SocialAccount.objects.create(user=other, provider="google", uid="g-123")
    params = start(session_api, "google", mode="link")
    mock_google(router, params)
    assert callback(session_api, "google", params["state"])["code"] == "oauth_already_linked"
    assert SocialAccount.objects.get().user == other


def test_link_needs_the_same_user_at_callback(session_api, router):
    params = start(session_api, "google", mode="link")
    session_api.post("/api/auth/logout")
    mock_google(router, params)
    # Logging out flushes the session, so the state is gone too.
    assert callback(session_api, "google", params["state"])["code"] == "oauth_state_mismatch"


def test_link_does_not_require_verified_email(session_api, router, user):
    params = start(session_api, "google", mode="link")
    mock_google(router, params, email_verified=False)
    assert callback(session_api, "google", params["state"])["status"] == "ok"


def test_list_accounts(auth_api, user, make_user):
    SocialAccount.objects.create(user=user, provider="google", uid="1", email="a@example.com")
    SocialAccount.objects.create(user=user, provider="github", uid="2", email="b@example.com")
    SocialAccount.objects.create(user=make_user(), provider="google", uid="3")
    rows = auth_api.get("/api/auth/oauth/accounts").json()
    assert [r["provider"] for r in rows] == ["google", "github"]
    assert set(rows[0]) == {"id", "provider", "email", "created_at", "last_login_at"}
    assert auth_api.get("/api/auth/me").json()["extra"]["oauth_providers"] == ["github", "google"]


def test_list_accounts_requires_auth(api):
    assert api.get("/api/auth/oauth/accounts").status_code == 401


def test_unlink(auth_api, user, catch):
    unlinked = catch(signals.social_account_unlinked)
    account = SocialAccount.objects.create(user=user, provider="google", uid="1")
    assert auth_api.delete(f"/api/auth/oauth/accounts/{account.pk}").status_code == 204
    assert not SocialAccount.objects.exists()
    assert unlinked[0]["user"] == user
    assert "Google" in mail.outbox[-1].body


def test_unlink_last_login_method_guard(api, make_user):
    u = make_user()
    u.set_unusable_password()
    u.has_password = False
    u.save()
    api.force_authenticate(u)
    first = SocialAccount.objects.create(user=u, provider="google", uid="1")
    second = SocialAccount.objects.create(user=u, provider="github", uid="2")
    assert api.delete(f"/api/auth/oauth/accounts/{first.pk}").status_code == 204
    res = api.delete(f"/api/auth/oauth/accounts/{second.pk}")
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "last_login_method"
    assert SocialAccount.objects.filter(pk=second.pk).exists()


def test_unlink_someone_elses_account(auth_api, make_user):
    account = SocialAccount.objects.create(user=make_user(), provider="google", uid="1")
    assert auth_api.delete(f"/api/auth/oauth/accounts/{account.pk}").status_code == 404
    assert auth_api.delete("/api/auth/oauth/accounts/000000000000000000000000").status_code == 404
    assert SocialAccount.objects.exists()


# GitHub


def _github(router, emails, profile=None):
    router.post(GITHUB_TOKEN).respond(json={"access_token": "gh-token", "token_type": "bearer"})
    router.get("https://api.github.com/user").respond(
        json=profile
        or {"id": 42, "login": "octo", "name": "Octo Cat", "avatar_url": "https://a.example.com/o.png"}
    )
    router.get("https://api.github.com/user/emails").respond(json=emails)


def test_github_flow(api, router):
    params = start(api, "github")
    assert params["scope"] == "read:user user:email"
    assert "nonce" not in params
    _github(
        router,
        [
            {"email": "old@example.com", "primary": False, "verified": True},
            {"email": "Octo@Example.com", "primary": True, "verified": True},
        ],
    )
    assert callback(api, "github", params["state"])["status"] == "ok"
    user = User.objects.get()
    assert user.email == "octo@example.com"
    assert user.name == "Octo Cat"
    account = SocialAccount.objects.get()
    assert (account.provider, account.uid, account.extra["login"]) == ("github", "42", "octo")
    token_call = next(c for c in router.calls if c.request.url == GITHUB_TOKEN)
    assert token_call.request.headers["Accept"] == "application/json"
    user_call = next(c for c in router.calls if str(c.request.url) == "https://api.github.com/user")
    assert user_call.request.headers["Authorization"] == "Bearer gh-token"


def test_github_unverified_primary_email(api, router):
    params = start(api, "github")
    _github(router, [{"email": "octo@example.com", "primary": True, "verified": False}])
    assert callback(api, "github", params["state"])["code"] == "oauth_email_unverified"


def test_github_api_error(api, router):
    params = start(api, "github")
    router.post(GITHUB_TOKEN).respond(json={"access_token": "gh-token"})
    router.get("https://api.github.com/user").respond(500)
    assert callback(api, "github", params["state"])["code"] == "oauth_provider_error"


def test_github_token_error_in_200_body(api, router):
    params = start(api, "github")
    router.post(GITHUB_TOKEN).respond(json={"error": "bad_verification_code"})
    assert callback(api, "github", params["state"])["code"] == "oauth_provider_error"


# Generic OpenID Connect


def _discovery(router):
    return router.get(DISCOVERY).respond(
        json={
            "issuer": IDP,
            "authorization_endpoint": f"{IDP}/authorize",
            "token_endpoint": f"{IDP}/token",
            "jwks_uri": f"{IDP}/jwks",
            "userinfo_endpoint": f"{IDP}/userinfo",
        }
    )


def test_generic_oidc_via_discovery(api, router):
    discovery = _discovery(router)
    res = api.get("/api/auth/oauth/acme/start")
    assert res["Location"].startswith(f"{IDP}/authorize?")
    params = query(res["Location"])
    assert params["scope"] == "openid email"
    assert params["client_id"] == "acme-client"
    # The id_token has no email: it comes from the userinfo endpoint.
    router.post(f"{IDP}/token").respond(
        json={
            "access_token": "acme-at",
            "id_token": id_token(params["nonce"], iss=IDP, aud="acme-client", sub="u-9"),
        }
    )
    router.get(f"{IDP}/jwks").respond(json=jwks())
    userinfo = router.get(f"{IDP}/userinfo").respond(
        json={"sub": "u-9", "email": "sso@example.com", "email_verified": True, "name": "Sso User"}
    )
    assert callback(api, "acme", params["state"])["status"] == "ok"
    user = User.objects.get()
    assert (user.email, user.name) == ("sso@example.com", "Sso User")
    assert SocialAccount.objects.get().provider == "acme"
    assert userinfo.calls.last.request.headers["Authorization"] == "Bearer acme-at"
    # The discovery document is cached.
    assert discovery.call_count == 1


def test_generic_oidc_ignores_userinfo_of_another_subject(api, router):
    _discovery(router)
    params = start(api, "acme")
    router.post(f"{IDP}/token").respond(
        json={
            "access_token": "at",
            "id_token": id_token(params["nonce"], iss=IDP, aud="acme-client", sub="u-9"),
        }
    )
    router.get(f"{IDP}/jwks").respond(json=jwks())
    router.get(f"{IDP}/userinfo").respond(
        json={"sub": "u-other", "email": "x@example.com", "email_verified": True}
    )
    assert callback(api, "acme", params["state"])["code"] == "oauth_email_unverified"


def test_generic_oidc_discovery_failure(api, router):
    router.get(DISCOVERY).respond(500)
    res = api.get("/api/auth/oauth/acme/start", {"next": "/x"})
    assert res.status_code == 302
    assert query(res["Location"]) == {"status": "error", "code": "oauth_provider_error", "next": "/x"}


# Apple


def test_apple_form_post_flow(api, router):
    params = start(api, "apple")
    assert params["response_mode"] == "form_post"
    assert params["scope"] == "name email"
    assert "code_challenge" not in params
    router.post(APPLE_TOKEN).respond(
        json={
            "access_token": "at",
            "id_token": id_token(
                params["nonce"],
                iss="https://appleid.apple.com",
                aud="com.example.web",
                sub="apple-1",
                email="relay@privaterelay.appleid.com",
                email_verified="true",
                is_private_email="true",
            ),
        }
    )
    router.get(APPLE_JWKS).respond(json=jwks())
    body = urlencode(
        {
            "code": "apple-code",
            "state": params["state"],
            "user": json.dumps({"name": {"firstName": "Tim", "lastName": "Apple"}, "email": "x"}),
        }
    )
    # Cross site POST: no CSRF token, answered with a 303 to the GET callback.
    client = APIClient(enforce_csrf_checks=True)
    client.cookies = api.cookies
    res = client.post(
        "/api/auth/oauth/apple/callback", body, content_type="application/x-www-form-urlencoded"
    )
    assert res.status_code == 303
    assert res["Location"].startswith("/api/auth/oauth/apple/callback?")
    final = client.get(res["Location"])
    assert query(final["Location"])["status"] == "ok"

    user = User.objects.get()
    assert (user.email, user.name) == ("relay@privaterelay.appleid.com", "Tim Apple")
    assert SocialAccount.objects.get().extra == {"is_private_email": True}
    sent = parse_qs(next(c for c in router.calls if c.request.url == APPLE_TOKEN).request.content.decode())
    secret = sent["client_secret"][0]
    assert jwt.get_unverified_header(secret)["kid"] == "KEY123"
    claims = jwt.decode(
        secret, APPLE_KEY.public_key(), algorithms=["ES256"], audience="https://appleid.apple.com"
    )
    assert (claims["iss"], claims["sub"]) == ("TEAM123", "com.example.web")
    assert "code_verifier" not in sent


# Export, admin, deletion


def test_export_lists_linked_accounts(auth_api, user):
    SocialAccount.objects.create(user=user, provider="google", uid="1", email="a@example.com")
    data = auth_api.get("/api/auth/me/export").json()
    assert data["oauth"][0]["provider"] == "google"
    assert data["oauth"][0]["email"] == "a@example.com"


def test_deleting_the_user_removes_social_accounts(user):
    SocialAccount.objects.create(user=user, provider="google", uid="1")
    user.delete()
    assert not SocialAccount.objects.exists()


def test_admin_pages(staff, user):
    account = SocialAccount.objects.create(user=user, provider="google", uid="1")
    client = Client()
    client.force_login(staff)
    assert client.get("/admin/pleate_oauth/socialaccount/").status_code == 200
    assert client.get(f"/admin/pleate_oauth/socialaccount/{account.pk}/change/").status_code == 200


def test_password_login_still_works_for_linked_users(api, user):
    SocialAccount.objects.create(user=user, provider="google", uid="1")
    res = api.post("/api/auth/login", {"email": user.email, "password": PASSWORD})
    assert res.json()["mfa_required"] is False
