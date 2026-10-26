from datetime import timedelta
from unittest import mock

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core import mail
from django.core.cache import cache
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework.test import APIClient

from pleate_backend.accounts.models import UserSession
from pleate_backend.staff import bans
from pleate_backend.staff.models import Ban

from .conftest import PASSWORD, link_token

pytestmark = pytest.mark.django_db
User = get_user_model()


@pytest.fixture(autouse=True)
def _reset_ban_memo():
    bans.invalidate()
    yield
    bans.invalidate()


@pytest.fixture
def staff_api(api, staff):
    api.force_authenticate(staff)
    return api


def _perm(name):
    app_label, codename = name.split(".")
    return Permission.objects.get(content_type__app_label=app_label, codename=codename)


def _login(user):
    client = APIClient()
    assert client.post("/api/auth/login", {"email": user.email, "password": PASSWORD}).status_code == 200
    return client


# Users


def test_users_require_staff(auth_api):
    assert auth_api.get("/api/staff/users").status_code == 403
    assert APIClient().get("/api/staff/users").status_code == 401


def test_users_with_model_perm(auth_api, user, make_user):
    user.user_permissions.add(_perm("pleate_accounts.view_user"))
    auth_api.force_authenticate(User.objects.get(pk=user.pk))
    target = make_user()
    assert auth_api.get("/api/staff/users").status_code == 200
    assert auth_api.get(f"/api/staff/users/{target.pk}").status_code == 200
    assert auth_api.patch(f"/api/staff/users/{target.pk}", {"name": "x"}, format="json").status_code == 403
    assert auth_api.delete(f"/api/staff/users/{target.pk}").status_code == 403


def test_users_list_filters_search_ordering(staff_api, make_user):
    editors = Group.objects.create(name="editor")
    a = make_user(email="anna@example.com", name="Anna")
    make_user(email="bob@example.com", name="Bob", is_active=False)
    make_user(email="carl@example.com", name="Carl", email_verified=False)
    a.groups.add(editors)

    body = staff_api.get("/api/staff/users").json()
    assert body["count"] == 4  # with staff
    assert {"page", "page_size", "page_count"} <= set(body)
    anna = next(u for u in body["results"] if u["email"] == "anna@example.com")
    assert anna["roles"] == ["editor"]

    def emails(query):
        return [u["email"] for u in staff_api.get(f"/api/staff/users?{query}").json()["results"]]

    assert emails("search=bob") == ["bob@example.com"]
    assert emails("search=Anna") == ["anna@example.com"]
    assert emails("is_active=false") == ["bob@example.com"]
    assert emails("email_verified=false") == ["carl@example.com"]
    assert emails("is_staff=true") == ["staff@example.com"]
    assert emails("role=editor") == ["anna@example.com"]
    assert emails("role=nobody") == []
    assert emails("ordering=email")[:2] == ["anna@example.com", "bob@example.com"]
    assert emails("ordering=-name")[0] == "carl@example.com"
    assert staff_api.get("/api/staff/users?ordering=password").json()["error"]["code"] == "invalid_ordering"


def test_user_detail(staff_api, user):
    _login(user)
    _login(user)
    body = staff_api.get(f"/api/staff/users/{user.pk}").json()
    assert body["email"] == user.email
    assert body["sessions_count"] == 2
    assert body["roles"] == []
    assert "mfa_enabled" in body
    assert staff_api.get("/api/staff/users/nope").status_code == 404
    assert staff_api.get("/api/staff/users/000000000000000000000000").status_code == 404


def test_user_patch(staff_api, user):
    Group.objects.create(name="editor")
    Group.objects.create(name="viewer")
    res = staff_api.patch(
        f"/api/staff/users/{user.pk}",
        {"name": "Ada L.", "email_verified": False, "is_staff": True, "roles": ["editor", "viewer"]},
        format="json",
    )
    assert res.status_code == 200, res.content
    body = res.json()
    assert body["name"] == "Ada L." and body["email_verified"] is False and body["is_staff"] is True
    assert body["roles"] == ["editor", "viewer"]
    res = staff_api.patch(f"/api/staff/users/{user.pk}", {"roles": ["viewer"]}, format="json")
    assert res.json()["roles"] == ["viewer"]
    res = staff_api.patch(f"/api/staff/users/{user.pk}", {"roles": ["ghost"]}, format="json")
    assert res.json()["error"]["fields"]["roles"][0]["code"] == "unknown_role"


def test_deactivating_revokes_sessions(staff_api, user):
    client = _login(user)
    assert client.get("/api/auth/me").status_code == 200
    res = staff_api.patch(f"/api/staff/users/{user.pk}", {"is_active": False}, format="json")
    assert res.json()["is_active"] is False
    assert UserSession.objects.filter(user=user).count() == 0
    assert client.get("/api/auth/me").status_code == 401


def test_cannot_modify_self(staff_api, staff):
    for data in ({"is_active": False}, {"is_staff": False}):
        res = staff_api.patch(f"/api/staff/users/{staff.pk}", data, format="json")
        assert res.status_code == 400
        assert res.json()["error"]["code"] == "cannot_modify_self"
    assert staff_api.patch(f"/api/staff/users/{staff.pk}", {"name": "Me"}, format="json").status_code == 200
    assert staff_api.delete(f"/api/staff/users/{staff.pk}").json()["error"]["code"] == "cannot_modify_self"


def test_non_staff_with_perm_cannot_grant_staff_or_touch_superusers(api, make_user, staff):
    manager = make_user()
    manager.user_permissions.add(_perm("pleate_accounts.change_user"), _perm("pleate_accounts.view_user"))
    target = make_user()
    api.force_authenticate(User.objects.get(pk=manager.pk))
    res = api.patch(f"/api/staff/users/{target.pk}", {"is_staff": True}, format="json")
    assert res.status_code == 403
    res = api.patch(f"/api/staff/users/{manager.pk}", {"is_staff": True}, format="json")
    assert res.status_code == 403
    res = api.patch(f"/api/staff/users/{target.pk}", {"roles": []}, format="json")
    assert res.status_code == 403
    res = api.patch(f"/api/staff/users/{staff.pk}", {"name": "x"}, format="json")
    assert res.json()["error"]["code"] == "cannot_modify_superuser"
    assert api.patch(f"/api/staff/users/{target.pk}", {"name": "Fine"}, format="json").status_code == 200


def test_delete_user(staff_api, user):
    _login(user)
    assert staff_api.delete(f"/api/staff/users/{user.pk}").status_code == 204
    assert not User.objects.filter(pk=user.pk).exists()
    assert UserSession.objects.count() == 0


def test_revoke_sessions(staff_api, user):
    _login(user)
    _login(user)
    res = staff_api.post(f"/api/staff/users/{user.pk}/revoke-sessions")
    assert res.json() == {"count": 2}
    assert UserSession.objects.filter(user=user).count() == 0


def test_send_password_reset(staff_api, user, api):
    res = staff_api.post(f"/api/staff/users/{user.pk}/password-reset")
    assert res.status_code == 202
    assert len(mail.outbox) == 1 and mail.outbox[0].to == [user.email]
    token = link_token(mail.outbox[0])
    assert api.post("/api/auth/password/reset/validate", {"token": token}).json() == {"valid": True}


def test_password_reset_for_inactive_user(staff_api, make_user):
    target = make_user(is_active=False)
    res = staff_api.post(f"/api/staff/users/{target.pk}/password-reset")
    assert res.json()["error"]["code"] == "user_inactive"


def test_user_actions_denied(auth_api, make_user):
    target = make_user()
    assert auth_api.post(f"/api/staff/users/{target.pk}/revoke-sessions").status_code == 403
    assert auth_api.post(f"/api/staff/users/{target.pk}/password-reset").status_code == 403


# Stats


def test_stats(staff_api, make_user):
    make_user()
    old = make_user(is_active=False)
    User.objects.filter(pk=old.pk).update(date_joined=timezone.now() - timedelta(days=10))
    ancient = make_user()
    User.objects.filter(pk=ancient.pk).update(date_joined=timezone.now() - timedelta(days=90))
    _login(User.objects.get(pk=ancient.pk))
    body = staff_api.get("/api/staff/stats").json()
    assert body["users_total"] == 4
    assert body["users_active"] == 3
    assert body["users_new_7d"] == 2  # staff + one
    assert body["users_new_30d"] == 3
    assert body["sessions_active"] == 1
    days = body["signups_by_day"]
    assert len(days) == 30
    assert days[-1]["date"] == timezone.now().date().isoformat()
    assert days[-1]["count"] == 2
    assert sum(d["count"] for d in days) == 3


def test_stats_denied(auth_api):
    assert auth_api.get("/api/staff/stats").status_code == 403


# Bans: endpoints


def test_bans_crud(staff_api, staff):
    res = staff_api.post("/api/staff/bans", {"network": "203.0.113.7", "reason": "abuse"}, format="json")
    assert res.status_code == 201, res.content
    ban = res.json()
    assert ban["network"] == "203.0.113.7/32"
    assert ban["created_by"] == staff.email
    assert ban["is_active"] is True
    res = staff_api.post("/api/staff/bans", {"network": "2001:db8::1"}, format="json")
    assert res.json()["network"] == "2001:db8::1/128"
    res = staff_api.post("/api/staff/bans", {"network": "10.1.2.3/8"}, format="json")
    assert res.json()["network"] == "10.0.0.0/8"
    bad = staff_api.post("/api/staff/bans", {"network": "not-an-ip"}, format="json")
    assert bad.json()["error"]["fields"]["network"][0]["code"] == "invalid_network"

    assert staff_api.get("/api/staff/bans").json()["count"] == 3
    assert staff_api.get("/api/staff/bans?search=abuse").json()["count"] == 1
    assert staff_api.get("/api/staff/bans?search=2001").json()["count"] == 1

    res = staff_api.patch(f"/api/staff/bans/{ban['id']}", {"reason": "spam"}, format="json")
    assert res.json()["reason"] == "spam"
    assert staff_api.delete(f"/api/staff/bans/{ban['id']}").status_code == 204
    assert staff_api.get(f"/api/staff/bans/{ban['id']}").status_code == 404


def test_cannot_ban_own_address(staff_api):
    res = staff_api.post("/api/staff/bans", {"network": "127.0.0.0/8"}, format="json")
    assert res.json()["error"]["code"] == "cannot_ban_self"


def test_bans_denied(auth_api):
    assert auth_api.get("/api/staff/bans").status_code == 403
    assert auth_api.post("/api/staff/bans", {"network": "1.2.3.4"}, format="json").status_code == 403


# Bans: middleware


def _get(path="/api/csrf", ip="198.51.100.9"):
    return APIClient().get(path, REMOTE_ADDR=ip)


def test_banned_ip_gets_403():
    Ban.objects.create(network="198.51.100.9")
    res = _get()
    assert res.status_code == 403
    assert res.json() == {
        "error": {"status": 403, "code": "banned", "message": "Access from your network has been blocked."}
    }
    assert _get(ip="198.51.100.10").status_code == 200


def test_cidr_ban():
    Ban.objects.create(network="198.51.100.0/24")
    assert _get(ip="198.51.100.200").status_code == 403
    assert _get(ip="198.51.101.1").status_code == 200
    Ban.objects.create(network="2001:db8::/32")
    assert _get(ip="2001:db8::abcd").status_code == 403
    assert _get(ip="2001:db9::1").status_code == 200


def test_ipv4_mapped_address_is_banned():
    Ban.objects.create(network="198.51.100.9")
    assert _get(ip="::ffff:198.51.100.9").status_code == 403


def test_health_is_never_blocked():
    Ban.objects.create(network="198.51.100.9")
    assert _get("/api/health", ip="198.51.100.9").status_code in (200, 503)


def test_expired_ban_does_not_block():
    Ban.objects.create(network="198.51.100.9", expires_at=timezone.now() - timedelta(minutes=1))
    assert _get().status_code == 200


def test_ban_expiring_while_cached():
    ban = Ban.objects.create(network="198.51.100.9", expires_at=timezone.now() + timedelta(hours=1))
    assert _get().status_code == 403
    later = timezone.now().timestamp() + 2 * 3600
    with mock.patch("pleate_backend.staff.bans.time.time", return_value=later):
        assert _get().status_code == 200
    assert ban.is_active


def test_forwarded_ip_from_trusted_proxy():
    Ban.objects.create(network="198.51.100.9")
    res = APIClient().get("/api/csrf", REMOTE_ADDR="127.0.0.1", HTTP_X_FORWARDED_FOR="198.51.100.9")
    assert res.status_code == 403


def test_cache_invalidation_on_save_and_delete():
    assert _get().status_code == 200  # warms the cache with an empty list
    ban = Ban.objects.create(network="198.51.100.9")
    assert _get().status_code == 403
    ban.delete()
    assert _get().status_code == 200
    Ban.objects.create(network="198.51.100.0/24")
    assert _get().status_code == 403
    Ban.objects.all().delete()
    assert _get().status_code == 200


def test_update_invalidates_cache():
    ban = Ban.objects.create(network="198.51.100.9")
    assert _get().status_code == 403
    ban.network = "192.0.2.1"
    ban.save()
    assert _get().status_code == 200


def test_warm_cache_makes_no_queries():
    Ban.objects.create(network="192.0.2.1")
    _get()
    bans._local.update(at=0.0, value=None)  # drop the in process copy, keep the shared cache
    with CaptureQueriesContext(connection) as ctx:
        assert bans.is_banned("198.51.100.9") is False
        assert bans.is_banned("192.0.2.1") is True
    assert len(ctx.captured_queries) == 0


def test_shared_cache_entry_is_used():
    Ban.objects.create(network="192.0.2.1")
    assert bans.is_banned("192.0.2.1")
    assert cache.get(bans.CACHE_KEY) == (("192.0.2.1/32", None),)


def test_cache_failure_fails_open():
    Ban.objects.create(network="198.51.100.9")
    bans.invalidate()
    with mock.patch.object(bans.cache, "get", side_effect=ConnectionError):
        assert _get().status_code == 200


def test_admin_registrations():
    from django.contrib import admin

    from pleate_backend.apikeys.models import APIKey
    from pleate_backend.rbac.models import Feature, ObjectPermission, RoleInfo

    for model in (Ban, APIKey, Feature, ObjectPermission, RoleInfo, Group):
        assert admin.site.is_registered(model)


def test_admin_pages_render(staff):
    client = APIClient()
    client.force_login(staff)
    Ban.objects.create(network="192.0.2.1")
    for url in (
        "/admin/pleate_staff/ban/",
        "/admin/pleate_apikeys/apikey/",
        "/admin/pleate_rbac/feature/",
        "/admin/pleate_rbac/objectpermission/",
        "/admin/auth/group/add/",
    ):
        assert client.get(url).status_code == 200, url
