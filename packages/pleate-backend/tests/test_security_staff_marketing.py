import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core import mail
from rest_framework.test import APIClient

from pleate_backend.apikeys.services import create_key
from pleate_backend.marketing import services
from pleate_backend.marketing.models import ContactMessage, NewsletterSubscriber
from pleate_backend.rbac.models import RoleInfo

from .test_marketing import settings_with

pytestmark = pytest.mark.django_db

User = get_user_model()
CHANGE_USER = f"{User._meta.app_label}.change_{User._meta.model_name}"


def _perm(name):
    app_label, codename = name.split(".")
    return Permission.objects.get(content_type__app_label=app_label, codename=codename)


def _as(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def _code(res):
    return res.json()["error"]["code"]


@pytest.fixture
def manager(make_user):
    """Role manager (not staff) holding auth.change_group and the user change permission."""
    u = make_user(email="manager@example.com")
    u.user_permissions.add(_perm("auth.change_group"), _perm(CHANGE_USER))
    return u


# API keys


@pytest.mark.parametrize("path", ["/api/staff/users", "/api/staff/stats", "/api/rbac/roles"])
def test_api_key_is_not_an_admin_credential(staff, path):
    _key, raw = create_key(staff, "ci", ["read", "write"])
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {raw}")
    res = client.get(path)
    assert res.status_code == 403
    assert _code(res) == "api_key_not_allowed"


# RBAC escalation


def test_cannot_create_role_with_permissions_not_held(manager):
    client = _as(manager)
    res = client.post(
        "/api/rbac/roles", {"name": "boss", "permissions": ["auth.delete_group"]}, format="json"
    )
    assert res.status_code == 403
    assert _code(res) == "permission_not_held"
    ok = client.post(
        "/api/rbac/roles", {"name": "helper", "permissions": ["auth.change_group"]}, format="json"
    )
    assert ok.status_code == 201, ok.content


def test_only_superuser_sets_is_default(manager, staff):
    res = _as(manager).post("/api/rbac/roles", {"name": "everyone", "is_default": True})
    assert res.status_code == 403
    assert _code(res) == "permission_denied"
    assert _as(staff).post("/api/rbac/roles", {"name": "everyone", "is_default": True}).status_code == 201
    group = Group.objects.get(name="everyone")
    res = _as(manager).patch(f"/api/rbac/roles/{group.pk}", {"is_default": False})
    assert res.status_code == 403
    assert RoleInfo.objects.get(group=group).is_default is True


def test_cannot_edit_or_delete_role_above_own_permissions(manager):
    admin = Group.objects.create(name="admin")
    admin.permissions.add(_perm("auth.delete_group"))
    client = _as(manager)
    assert client.patch(f"/api/rbac/roles/{admin.pk}", {"permissions": []}).status_code == 403
    assert client.delete(f"/api/rbac/roles/{admin.pk}").status_code == 403
    assert Group.objects.filter(name="admin").exists()


def test_role_assignment_limits(manager, make_user):
    admin = Group.objects.create(name="admin")
    admin.permissions.add(_perm("auth.delete_group"))
    helper = Group.objects.create(name="helper")
    helper.permissions.add(_perm("auth.change_group"))
    other = make_user()
    client = _as(manager)

    res = client.post(f"/api/rbac/users/{manager.pk}/roles", {"role": "helper"})
    assert res.status_code == 403
    assert _code(res) == "cannot_modify_self"
    res = client.post(f"/api/rbac/users/{other.pk}/roles", {"role": "admin"})
    assert res.status_code == 403
    assert _code(res) == "permission_not_held"
    assert client.post(f"/api/rbac/users/{other.pk}/roles", {"role": "helper"}).status_code == 200

    # Same rules through the staff user endpoint.
    res = client.patch(f"/api/staff/users/{manager.pk}", {"roles": ["helper"]})
    assert _code(res) == "cannot_modify_self"
    res = client.patch(f"/api/staff/users/{other.pk}", {"roles": ["helper", "admin"]})
    assert _code(res) == "permission_not_held"
    assert client.patch(f"/api/staff/users/{other.pk}", {"roles": []}).status_code == 200


# Staff guard


def test_non_superuser_cannot_act_on_other_staff(make_user):
    actor = make_user(email="junior@example.com", is_staff=True)
    target = make_user(email="senior@example.com", is_staff=True)
    client = _as(actor)
    for res in (
        client.patch(f"/api/staff/users/{target.pk}", {"is_active": False}),
        client.patch(f"/api/staff/users/{target.pk}", {"email_verified": False}),
        client.post(f"/api/staff/users/{target.pk}/revoke-sessions"),
        client.delete(f"/api/staff/users/{target.pk}"),
    ):
        assert res.status_code == 403
        assert _code(res) == "cannot_modify_staff"
    target.refresh_from_db()
    assert target.is_active and target.email_verified
    # Still allowed: editing your own name, and acting on regular users.
    assert client.patch(f"/api/staff/users/{actor.pk}", {"name": "Me"}).status_code == 200
    assert _code(client.patch(f"/api/staff/users/{actor.pk}", {"is_active": False})) == ("cannot_modify_self")
    regular = make_user()
    assert client.patch(f"/api/staff/users/{regular.pk}", {"is_active": False}).status_code == 200


# Marketing


def test_export_ignores_email_matches_when_unverified(make_user):
    owner = make_user(email="claim@example.com", email_verified=False)
    NewsletterSubscriber.objects.create(email=owner.email, status="subscribed")
    ContactMessage.objects.create(name="Real", email=owner.email, message="someone else wrote this")
    ContactMessage.objects.create(name="Me", email="x@example.com", message="mine, linked", user=owner)
    services.create_waitlist_entry(owner.email)
    data = _as(owner).get("/api/auth/me/export").json()["marketing"]
    assert data["newsletter"] == []
    assert [m["name"] for m in data["contact_messages"]] == ["Me"]
    assert data["waitlist"] == []


def test_waitlist_existing_email_gets_no_code(api):
    first = api.post("/api/marketing/waitlist", {"email": "w@example.com"}).json()
    assert len(first["referral_code"]) == 8
    again = api.post("/api/marketing/waitlist", {"email": "w@example.com"})
    assert again.status_code == 200
    assert again.json() == {"position": None, "referral_code": None, "referrals": None, "invited": None}


def test_unsubscribed_needs_confirmation_without_double_opt_in(api):
    sub = NewsletterSubscriber.objects.create(email="gone@example.com", status="unsubscribed", locale="en")
    with settings_with(NEWSLETTER_DOUBLE_OPT_IN=False):
        res = api.post("/api/marketing/newsletter/subscribe", {"email": "gone@example.com"})
    assert res.status_code == 202
    assert res.json() == {"confirmation_required": False}  # same body as for a new address
    sub.refresh_from_db()
    assert sub.status == "pending"
    assert len(mail.outbox) == 1


def test_subscribe_survives_concurrent_create(api, monkeypatch):
    from django.db import IntegrityError

    NewsletterSubscriber.objects.create(email="race@example.com", status="pending")

    def boom(*args, **kwargs):
        raise IntegrityError("duplicate key")

    monkeypatch.setattr(NewsletterSubscriber.objects, "get_or_create", boom)
    with settings_with(NEWSLETTER_DOUBLE_OPT_IN=False):
        res = api.post("/api/marketing/newsletter/subscribe", {"email": "race@example.com"})
    assert res.status_code == 202
    assert NewsletterSubscriber.objects.get().status == "subscribed"
