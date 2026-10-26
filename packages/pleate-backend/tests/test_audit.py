import datetime

import pytest
from django.contrib.auth import get_user_model
from django.test import modify_settings, override_settings
from django.utils import timezone

from pleate_backend import audit
from pleate_backend.audit.models import ActivityLog
from pleate_backend.audit.registry import unregister
from pleate_backend.audit.services import MASK
from pleate_backend.core.mongo import collection

from .conftest import PASSWORD

pytestmark = pytest.mark.django_db
User = get_user_model()

with_middleware = modify_settings(
    MIDDLEWARE={
        "append": "pleate_backend.audit.middleware.AuditContextMiddleware",
    }
)


def actions(**filters):
    return list(ActivityLog.objects.filter(**filters).order_by("created_at").values_list("action", flat=True))


# Automatic entries


def test_login_and_logout_are_logged(api, user):
    res = api.post(
        "/api/auth/login", {"email": user.email, "password": PASSWORD}, HTTP_USER_AGENT="TestAgent/1"
    )
    assert res.status_code == 200
    api.post("/api/auth/logout")
    assert actions(actor=user) == ["auth.login", "auth.logout"]
    login = ActivityLog.objects.get(action="auth.login")
    assert login.actor_email == user.email
    assert login.ip == "127.0.0.1"
    assert login.user_agent == "TestAgent/1"
    assert login.request_id
    assert login.target_type == "pleate_accounts.user"
    assert login.target_id == str(user.pk)


def test_login_failed_keeps_only_the_email(api, user):
    api.post("/api/auth/login", {"email": "ADA@example.com", "password": "wrong-secret-pass"})
    api.post("/api/auth/login", {"email": "ghost@example.com", "password": "another-wrong-pass"})
    rows = list(ActivityLog.objects.filter(action="auth.login_failed").order_by("created_at"))
    assert len(rows) == 2
    first, second = rows
    assert first.actor is None
    assert first.actor_email == "ada@example.com"
    assert first.metadata == {"email": "ada@example.com"}
    assert first.target_id == str(user.pk)
    assert second.actor_email == "ghost@example.com"
    assert second.target_id == ""
    raw = str(list(collection(ActivityLog).find({})))
    assert "wrong-secret-pass" not in raw and "another-wrong-pass" not in raw


def test_account_signals_are_logged(api, user):
    api.post("/api/auth/signup", {"email": "new@example.com", "password": PASSWORD})
    new = User.objects.get(email="new@example.com")
    assert "auth.signup" in actions(actor=new)

    api.force_authenticate(user)
    res = api.post(
        "/api/auth/password/change", {"current_password": PASSWORD, "new_password": "another-good-pass-42"}
    )
    assert res.status_code == 204, res.content
    api.post("/api/auth/sessions/revoke-others")
    assert "auth.password_changed" in actions(actor=user)
    revoked = ActivityLog.objects.get(action="auth.sessions_revoked")
    assert revoked.metadata == {"count": 0}


def test_email_change_is_logged_with_both_addresses(user):
    from pleate_backend.accounts import signals

    old = user.email
    user.email = "ada.new@example.com"
    user.save()
    signals.email_changed.send(sender=User, user=user, request=None, old_email=old)
    row = ActivityLog.objects.get(action="auth.email_changed")
    assert row.metadata == {"old_email": old, "new_email": "ada.new@example.com"}


def test_account_deletion_keeps_the_entry(auth_api, user):
    res = auth_api.delete("/api/auth/me", {"password": PASSWORD}, format="json")
    assert res.status_code == 204, res.content
    row = ActivityLog.objects.get(action="account.deleted")
    assert row.actor is None
    assert row.actor_email == "ada@example.com"


# log_activity


def test_log_activity_masks_sensitive_values(user):
    entry = audit.log_activity(
        "apikeys.created",
        actor=user,
        target=("apikey", "k1", "CI key"),
        changes={"name": ["", "CI key"], "key_hash": [None, "abc"]},
        token="pl_secret_value",
        nested={"password": "x", "ok": 1},
        scopes=["read"],
    )
    entry.refresh_from_db()
    assert entry.changes == {"name": ["", "CI key"], "key_hash": [None, MASK]}
    assert entry.metadata == {"token": MASK, "nested": {"password": MASK, "ok": 1}, "scopes": ["read"]}
    assert (entry.target_type, entry.target_id, entry.target_repr) == ("apikey", "k1", "CI key")


def test_log_activity_never_raises(user, monkeypatch, caplog):
    def boom(self, *args, **kwargs):
        raise RuntimeError("database down")

    monkeypatch.setattr(ActivityLog, "save", boom)
    assert audit.log_activity("thing.happened", actor=user) is None
    assert "could not record activity" in caplog.text


@with_middleware
def test_middleware_provides_request_and_actor(auth_api, user, monkeypatch):
    from pleate_backend.accounts.views import MeView

    original = MeView.patch

    def patched(self, request):
        response = original(self, request)
        audit.log_activity("profile.updated", fields=sorted(request.data))
        return response

    monkeypatch.setattr(MeView, "patch", patched)
    auth_api.patch(
        "/api/auth/me", {"name": "Ada L."}, HTTP_USER_AGENT="Agent/2", HTTP_X_REQUEST_ID="req-12345678"
    )
    row = ActivityLog.objects.get(action="profile.updated")
    assert row.actor_id == user.pk
    assert row.user_agent == "Agent/2"
    assert row.request_id == "req-12345678"
    assert row.metadata == {"fields": ["name"]}


@with_middleware
def test_log_reads_setting(auth_api, user):
    with override_settings(PLEATE={"AUDIT": {"LOG_READS": True}}):
        auth_api.get("/api/auth/me")
    row = ActivityLog.objects.get(action="api.read")
    assert row.metadata == {"path": "/api/auth/me", "status": 200}
    auth_api.get("/api/auth/me")
    assert ActivityLog.objects.filter(action="api.read").count() == 1


# Model auditing


@pytest.fixture
def audited_users():
    audit.register(User, exclude=("password", "last_login", "date_joined", "password_changed_at"))
    yield
    unregister(User)


def test_register_logs_create_update_delete_with_diffs(audited_users, make_user):
    u = make_user(email="diff@example.com", name="Old")
    created = ActivityLog.objects.get(action="pleate_accounts.user.created")
    assert created.changes["email"] == [None, "diff@example.com"]
    assert created.changes["name"] == [None, "Old"]
    assert "password" not in created.changes
    assert created.target_id == str(u.pk)
    assert created.target_repr == "diff@example.com"

    u.name = "New"
    u.is_staff = True
    u.save()
    updated = ActivityLog.objects.get(action="pleate_accounts.user.updated")
    assert updated.changes == {"name": ["Old", "New"], "is_staff": [False, True]}

    u.save()  # nothing changed, nothing logged
    assert ActivityLog.objects.filter(action="pleate_accounts.user.updated").count() == 1

    pk = str(u.pk)
    u.delete()
    deleted = ActivityLog.objects.get(action="pleate_accounts.user.deleted")
    assert deleted.target_id == pk


def test_register_masks_sensitive_fields_even_when_listed(make_user):
    audit.register(User, fields=["name", "password"], exclude=())
    try:
        u = make_user(name="A")
        u.set_password("brand-new-pass-1")
        u.name = "B"
        u.save()
    finally:
        unregister(User)
    row = ActivityLog.objects.get(action="pleate_accounts.user.updated")
    assert row.changes == {"name": ["A", "B"], "password": [MASK, MASK]}
    assert "brand-new-pass-1" not in str(row.changes)


# Endpoints


def test_my_activity_lists_only_mine_newest_first(auth_api, user, make_user):
    other = make_user()
    now = timezone.now()
    for i, action in enumerate(["auth.login", "billing.paid", "auth.logout"]):
        ActivityLog.objects.create(actor=user, action=action, created_at=now + datetime.timedelta(seconds=i))
    ActivityLog.objects.create(actor=other, action="auth.login")
    res = auth_api.get("/api/activity/")
    assert res.status_code == 200
    body = res.json()
    assert [r["action"] for r in body["results"]] == ["auth.logout", "billing.paid", "auth.login"]
    assert body["results"][0]["actor"] == str(user.pk)
    assert body["next_cursor"] is None

    res = auth_api.get("/api/activity/", {"action__startswith": "auth."})
    assert [r["action"] for r in res.json()["results"]] == ["auth.logout", "auth.login"]
    res = auth_api.get("/api/activity/", {"action": "billing.paid"})
    assert [r["action"] for r in res.json()["results"]] == ["billing.paid"]


def test_my_activity_cursor_pagination(auth_api, user):
    now = timezone.now()
    for i in range(5):
        ActivityLog.objects.create(
            actor=user, action=f"a.{i}", created_at=now + datetime.timedelta(seconds=i)
        )
    first = auth_api.get("/api/activity/", {"page_size": 2}).json()
    assert [r["action"] for r in first["results"]] == ["a.4", "a.3"]
    second = auth_api.get("/api/activity/", {"page_size": 2, "cursor": first["next_cursor"]}).json()
    assert [r["action"] for r in second["results"]] == ["a.2", "a.1"]


def test_my_activity_requires_login(api):
    assert api.get("/api/activity/").status_code == 401


def test_all_activity_is_staff_only(auth_api, api, staff):
    assert auth_api.get("/api/activity/all").status_code == 403
    api.force_authenticate(staff)
    assert api.get("/api/activity/all").status_code == 200


def test_all_activity_filters_and_search(api, staff, user):
    now = timezone.now()
    old = ActivityLog.objects.create(
        actor=user,
        actor_email=user.email,
        action="auth.login",
        created_at=now - datetime.timedelta(days=3),
    )
    ActivityLog.objects.create(
        actor=staff,
        actor_email=staff.email,
        action="projects.project.updated",
        target_type="projects.project",
        target_id="p1",
        target_repr="Moon base",
    )
    api.force_authenticate(staff)

    def ids(**params):
        res = api.get("/api/activity/all", params)
        assert res.status_code == 200, res.content
        return [r["action"] for r in res.json()["results"]]

    assert api.get("/api/activity/all").json()["count"] == 2
    assert ids(actor=str(user.pk)) == ["auth.login"]
    assert ids(actor="not-an-id") == []
    assert ids(target_type="projects.project", target_id="p1") == ["projects.project.updated"]
    assert ids(search="moon") == ["projects.project.updated"]
    assert ids(search="ada@") == ["auth.login"]
    assert ids(action__startswith="auth") == ["auth.login"]
    cutoff = (now - datetime.timedelta(days=1)).isoformat()
    assert ids(created_before=cutoff) == ["auth.login"]
    assert ids(created_after=cutoff) == ["projects.project.updated"]
    assert ids(ordering="created_at") == ["auth.login", "projects.project.updated"]
    assert api.get("/api/activity/all", {"ordering": "ip"}).json()["error"]["code"] == "invalid_ordering"

    detail = api.get(f"/api/activity/all/{old.pk}")
    assert detail.status_code == 200
    assert detail.json()["actor_email"] == user.email
    assert api.get("/api/activity/all/nope").status_code == 404
    assert api.get("/api/activity/all/0123456789abcdef01234567").status_code == 404


def test_all_activity_detail_forbidden_for_users(auth_api, user):
    row = ActivityLog.objects.create(actor=user, action="auth.login")
    assert auth_api.get(f"/api/activity/all/{row.pk}").status_code == 403


def test_export_contains_my_activity(auth_api, user, make_user):
    ActivityLog.objects.create(actor=user, action="auth.login")
    ActivityLog.objects.create(actor=make_user(), action="auth.login")
    data = auth_api.get("/api/auth/me/export").json()
    assert [row["action"] for row in data["activity"]] == ["auth.login"]


def test_ttl_index_exists():
    from pleate_backend.audit.handlers import ensure_indexes

    ensure_indexes()
    indexes = collection(ActivityLog).index_information().values()
    ttl = [i for i in indexes if i.get("key") == [("created_at", 1)]]
    assert ttl and ttl[0]["expireAfterSeconds"] == 365 * 24 * 60 * 60


def test_optional_signals_are_connected_when_available():
    try:
        from pleate_backend.mfa import signals as mfa_signals
    except ImportError:
        pytest.skip("mfa app has no signals yet")
    signal = getattr(mfa_signals, "mfa_enabled", None)
    if signal is None:
        pytest.skip("mfa_enabled not defined")
    assert signal.has_listeners()
