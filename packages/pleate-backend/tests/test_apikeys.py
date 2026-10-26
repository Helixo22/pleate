from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from pleate_backend.apikeys.models import APIKey
from pleate_backend.apikeys.services import MAX_ACTIVE_KEYS, create_key, find_key
from pleate_backend.core.utils import sha256

pytestmark = pytest.mark.django_db


def _bearer(raw):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {raw}")
    return client


# Management endpoints


def test_create_shows_key_once(auth_api, user):
    res = auth_api.post(
        "/api/api-keys/", {"name": "CI", "scopes": ["write"], "expires_in_days": 30}, format="json"
    )
    assert res.status_code == 201, res.content
    body = res.json()
    raw = body["key"]
    assert raw.startswith(f"pl_{body['prefix']}_")
    assert len(body["prefix"]) == 8
    assert body["scopes"] == ["read", "write"]  # write implies read
    assert body["status"] == "active"
    assert body["display"] == f"pl_{body['prefix']}_..."
    key = APIKey.objects.get(pk=body["id"])
    assert key.key_hash == sha256(raw) and raw not in key.key_hash
    assert 29 <= (key.expires_at - timezone.now()).days <= 30
    detail = auth_api.get(f"/api/api-keys/{body['id']}").json()
    assert "key" not in detail
    assert "key" not in auth_api.get("/api/api-keys/").json()["results"][0]


def test_create_defaults_to_read_scope(auth_api):
    body = auth_api.post("/api/api-keys/", {"name": "ro"}, format="json").json()
    assert body["scopes"] == ["read"]
    assert body["expires_at"] is None


def test_create_validation(auth_api):
    assert auth_api.post("/api/api-keys/", {}, format="json").status_code == 400
    res = auth_api.post("/api/api-keys/", {"name": "x", "scopes": ["admin"]}, format="json")
    assert res.status_code == 400
    res = auth_api.post("/api/api-keys/", {"name": "x", "scopes": []}, format="json")
    assert res.status_code == 400
    res = auth_api.post("/api/api-keys/", {"name": "x", "expires_in_days": 0}, format="json")
    assert res.status_code == 400


def test_list_search_ordering_and_isolation(auth_api, user, make_user):
    create_key(user, "Alpha")
    create_key(user, "Beta")
    create_key(make_user(), "Other")
    body = auth_api.get("/api/api-keys/").json()
    assert body["count"] == 2
    assert [k["name"] for k in body["results"]] == ["Beta", "Alpha"]
    assert [k["name"] for k in auth_api.get("/api/api-keys/?ordering=name").json()["results"]] == [
        "Alpha",
        "Beta",
    ]
    assert auth_api.get("/api/api-keys/?search=alp").json()["count"] == 1
    assert auth_api.get("/api/api-keys/?ordering=key_hash").json()["error"]["code"] == "invalid_ordering"


def test_cannot_see_other_users_keys(auth_api, make_user):
    other, _ = create_key(make_user(), "Other")
    assert auth_api.get(f"/api/api-keys/{other.pk}").status_code == 404
    assert auth_api.delete(f"/api/api-keys/{other.pk}").status_code == 404
    assert auth_api.get("/api/api-keys/bogus").status_code == 404


def test_rename_and_revoke(auth_api, user):
    key, raw = create_key(user, "Old", ["read", "write"])
    res = auth_api.patch(f"/api/api-keys/{key.pk}", {"name": "New", "scopes": ["read"]}, format="json")
    assert res.status_code == 200
    assert res.json()["name"] == "New"
    assert res.json()["scopes"] == ["read", "write"]  # scopes are read only
    assert auth_api.put(f"/api/api-keys/{key.pk}", {"name": "x"}, format="json").status_code == 405
    assert auth_api.delete(f"/api/api-keys/{key.pk}").status_code == 204
    key.refresh_from_db()
    assert key.revoked_at is not None
    assert auth_api.get(f"/api/api-keys/{key.pk}").json()["status"] == "revoked"
    assert auth_api.delete(f"/api/api-keys/{key.pk}").status_code == 204
    res = _bearer(raw).get("/api/auth/me")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "invalid_api_key"


def test_active_key_limit(auth_api, user):
    for i in range(MAX_ACTIVE_KEYS):
        create_key(user, f"k{i}")
    res = auth_api.post("/api/api-keys/", {"name": "one more"}, format="json")
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "api_key_limit"
    # Revoked and expired keys do not count.
    first = APIKey.objects.filter(user=user).first()
    first.revoked_at = timezone.now()
    first.save()
    assert auth_api.post("/api/api-keys/", {"name": "one more"}, format="json").status_code == 201
    APIKey.objects.filter(user=user, revoked_at__isnull=True).filter(name="k1").update(
        expires_at=timezone.now() - timedelta(days=1)
    )
    assert auth_api.post("/api/api-keys/", {"name": "and another"}, format="json").status_code == 201


def test_management_needs_login(api):
    assert api.get("/api/api-keys/").status_code == 401


def test_keys_cannot_manage_keys(user):
    _key, raw = create_key(user, "full", ["read", "write"])
    client = _bearer(raw)
    res = client.post("/api/api-keys/", {"name": "child"}, format="json")
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "api_key_not_allowed"
    assert client.get("/api/api-keys/").json()["error"]["code"] == "api_key_not_allowed"


# Authentication


def test_authenticates_and_sets_request_auth(user):
    key, raw = create_key(user, "k", ["read"])
    res = _bearer(raw).get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["email"] == user.email
    key.refresh_from_db()
    assert key.last_used_at is not None
    assert key.last_used_ip == "127.0.0.1"
    assert find_key(raw) == key


def test_last_used_is_written_at_most_once_a_minute(user):
    key, raw = create_key(user, "k")
    client = _bearer(raw)
    client.get("/api/auth/me")
    key.refresh_from_db()
    first = key.last_used_at
    client.get("/api/auth/me")
    key.refresh_from_db()
    assert key.last_used_at == first
    APIKey.objects.filter(pk=key.pk).update(last_used_at=timezone.now() - timedelta(minutes=2))
    client.get("/api/auth/me")
    key.refresh_from_db()
    assert key.last_used_at > first - timedelta(seconds=1)
    assert timezone.now() - key.last_used_at < timedelta(seconds=30)


def test_read_scope_is_enforced(user):
    _key, raw = create_key(user, "ro", ["read"])
    client = _bearer(raw)
    assert client.get("/api/auth/me").status_code == 200
    res = client.patch("/api/auth/me", {"name": "X"}, format="json")
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "insufficient_scope"
    user.refresh_from_db()
    assert user.name == "Ada"


def test_write_scope_allows_unsafe_methods_without_csrf(user):
    _key, raw = create_key(user, "rw", ["read", "write"])
    client = APIClient(enforce_csrf_checks=True)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {raw}")
    res = client.patch("/api/auth/me", {"name": "Key"}, format="json")
    assert res.status_code == 200
    assert res.json()["name"] == "Key"


def test_expired_key(user):
    _key, raw = create_key(user, "old")
    APIKey.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
    res = _bearer(raw).get("/api/auth/me")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "api_key_expired"
    assert res["WWW-Authenticate"] == 'Bearer realm="api"'


def test_inactive_user_key(user):
    _key, raw = create_key(user, "k")
    user.is_active = False
    user.save()
    assert _bearer(raw).get("/api/auth/me").json()["error"]["code"] == "invalid_api_key"


@pytest.mark.parametrize(
    "token",
    ["pl_nope", "pl_ABCDEFGH_wrongsecret", "pl_ABCDEFGH_", "pl_short_secret"],
)
def test_invalid_keys(user, token):
    create_key(user, "k")
    res = _bearer(token).get("/api/auth/me")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "invalid_api_key"


def test_tampered_secret_with_valid_prefix(user):
    _key, raw = create_key(user, "k")
    res = _bearer(raw[:-2] + ("AA" if not raw.endswith("AA") else "BB")).get("/api/auth/me")
    assert res.json()["error"]["code"] == "invalid_api_key"


def test_other_bearer_tokens_fall_through(api):
    api.credentials(HTTP_AUTHORIZATION="Bearer something-else")
    res = api.get("/api/auth/me")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "not_authenticated"


def test_export_includes_keys_without_hashes(auth_api, user):
    key, raw = create_key(user, "Exported")
    data = auth_api.get("/api/auth/me/export").json()
    assert data["api_keys"][0]["name"] == "Exported"
    assert data["api_keys"][0]["prefix"] == key.prefix
    dumped = str(data)
    assert key.key_hash not in dumped and raw not in dumped


def test_deleting_user_deletes_keys(user):
    create_key(user, "k")
    user.delete()
    assert APIKey.objects.count() == 0
