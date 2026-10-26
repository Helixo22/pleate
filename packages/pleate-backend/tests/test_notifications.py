import json
from types import SimpleNamespace

import pytest
from django.conf import settings
from django.core import mail
from django.test import override_settings
from rest_framework.test import APIClient

from pleate_backend.core.conf import DEFAULTS
from pleate_backend.core.mongo import collection
from pleate_backend.core.realtime import broker
from pleate_backend.notifications import services
from pleate_backend.notifications.models import Notification, Preference, PushSubscription
from pleate_backend.notifications.services import notify

pytestmark = pytest.mark.django_db

ENDPOINT = "https://push.example.com/send/abc"


def notifications_conf(**overrides):
    return override_settings(
        PLEATE={**settings.PLEATE, "NOTIFICATIONS": {**DEFAULTS["NOTIFICATIONS"], **overrides}}
    )


def vapid():
    return notifications_conf(VAPID_PUBLIC_KEY="BPublicKey", VAPID_PRIVATE_KEY="private-key")


@pytest.fixture
def events(user):
    """Collects what is published on the user's realtime channel."""
    received = []
    real = broker()
    original = real.publish

    def publish(channel, event):
        if channel == f"user:{user.pk}":
            received.append(event)
        original(channel, event)

    real.publish = publish
    yield received
    real.publish = original


# notify()


def test_notify_defaults_to_in_app(user, events):
    n = notify(user, "mention", "Grace mentioned you", body="Look at this", url="/docs/1", data={"doc": 1})
    assert isinstance(n, Notification)
    assert (n.kind, n.title, n.body, n.url, n.data, n.read_at) == (
        "mention",
        "Grace mentioned you",
        "Look at this",
        "/docs/1",
        {"doc": 1},
        None,
    )
    assert mail.outbox == []
    assert [e["type"] for e in events] == ["notification", "unread_count"]
    assert events[0]["data"]["id"] == str(n.pk)
    assert events[1]["data"] == {"count": 1}


def test_notify_explicit_channels(user, events):
    assert notify(user, "billing", "Paid", channels=["email"]) is None
    assert Notification.objects.count() == 0
    assert len(mail.outbox) == 1
    assert events == []


def test_notify_ignores_unknown_channels(user):
    assert notify(user, "x", "Hi", channels=["sms"]) is None
    assert Notification.objects.count() == 0


def test_notify_skips_inactive_users(make_user):
    inactive = make_user(is_active=False)
    assert notify(inactive, "x", "Hi") is None
    assert Notification.objects.count() == 0


def test_preferences_route_channels(user):
    Preference.objects.create(user=user, channels={"*": ["in_app"], "billing": ["email"]})
    assert notify(user, "billing", "Invoice ready", body="Total 9 EUR", url="/billing") is None
    assert len(mail.outbox) == 1
    assert notify(user, "mention", "Hi") is not None
    assert len(mail.outbox) == 1


def test_star_preference_and_default_channels(user):
    with notifications_conf(DEFAULT_CHANNELS=["email"]):
        assert notify(user, "x", "Default") is None
        assert len(mail.outbox) == 1
        Preference.objects.create(user=user, channels={"*": ["in_app", "email"]})
        assert notify(user, "x", "Star") is not None
        assert len(mail.outbox) == 2


def test_email_channel_content(user):
    notify(user, "billing", "Payment failed", body="Update your card.", url="/billing", channels=["email"])
    message = mail.outbox[0]
    assert message.to == ["ada@example.com"]
    assert message.subject == "Payment failed"
    assert "Update your card." in message.body
    assert "http://app.test/billing" in message.body
    html = message.alternatives[0][0]
    assert "http://app.test/billing" in html and "Open" in html


def test_email_uses_user_locale(make_user, monkeypatch):
    calls = []
    monkeypatch.setattr("pleate_backend.emails.send_email", lambda *args, **kw: calls.append(args))
    italian = make_user(locale="it")
    notify(italian, "x", "Ciao", channels=["email"])
    template, to, context, language = calls[0]
    assert (template, to, language) == ("notification", italian.email, "it")
    assert context["action_url"] == "http://app.test/notifications"
    assert set(context) == {"title", "body", "action_url", "action_label"}


# Push


def _sub(user, endpoint=ENDPOINT):
    return PushSubscription.objects.create(user=user, endpoint=endpoint, p256dh="key", auth="secret")


def test_push_skipped_without_vapid(user, monkeypatch):
    import pywebpush

    called = []
    monkeypatch.setattr(pywebpush, "webpush", lambda **kw: called.append(kw))
    _sub(user)
    notify(user, "x", "Hi", channels=["push"])
    assert called == []


def test_push_sends_and_removes_gone_subscriptions(user, monkeypatch):
    import pywebpush

    gone = "https://push.example.com/send/gone"
    calls = []

    def fake_webpush(**kw):
        calls.append(kw)
        if kw["subscription_info"]["endpoint"] == gone:
            raise pywebpush.WebPushException("gone", response=SimpleNamespace(status_code=410))
        return SimpleNamespace(status_code=201)

    monkeypatch.setattr(pywebpush, "webpush", fake_webpush)
    _sub(user)
    _sub(user, gone)
    with vapid():
        n = notify(user, "mention", "Hi", body="Body", url="/x", channels=["in_app", "push"])
    assert len(calls) == 2
    sent = next(c for c in calls if c["subscription_info"]["endpoint"] == ENDPOINT)
    assert sent["subscription_info"]["keys"] == {"p256dh": "key", "auth": "secret"}
    assert sent["vapid_private_key"] == "private-key"
    assert sent["vapid_claims"] == {"sub": "mailto:admin@localhost"}
    payload = json.loads(sent["data"])
    assert payload == {
        "id": str(n.pk),
        "kind": "mention",
        "title": "Hi",
        "body": "Body",
        "url": "/x",
        "data": {},
    }
    assert list(PushSubscription.objects.values_list("endpoint", flat=True)) == [ENDPOINT]


def test_push_keeps_subscription_on_other_errors(user, monkeypatch):
    import pywebpush

    def failing(**kw):
        raise pywebpush.WebPushException("busy", response=SimpleNamespace(status_code=500))

    monkeypatch.setattr(pywebpush, "webpush", failing)
    _sub(user)
    with vapid():
        notify(user, "x", "Hi", channels=["push"])
    assert PushSubscription.objects.count() == 1


def test_push_public_key(auth_api):
    assert auth_api.get("/api/notifications/push/public-key").json() == {"key": None}
    with vapid():
        assert auth_api.get("/api/notifications/push/public-key").json() == {"key": "BPublicKey"}


def test_push_subscribe_and_unsubscribe(auth_api, user, make_user):
    payload = {"endpoint": ENDPOINT, "keys": {"p256dh": "p", "auth": "a"}}
    res = auth_api.post("/api/notifications/push/subscriptions", payload, HTTP_USER_AGENT="Firefox")
    assert res.status_code == 201, res.content
    assert res.json()["endpoint"] == ENDPOINT
    sub = PushSubscription.objects.get()
    assert (sub.user_id, sub.user_agent) == (user.pk, "Firefox")
    # Re-subscribing updates the keys, no duplicates.
    auth_api.post(
        "/api/notifications/push/subscriptions", {**payload, "keys": {"p256dh": "p2", "auth": "a2"}}
    )
    assert PushSubscription.objects.get().p256dh == "p2"
    # Another account cannot remove it.
    other = APIClient()
    other.force_authenticate(make_user())
    assert other.delete("/api/notifications/push/subscriptions", {"endpoint": ENDPOINT}).status_code == 404
    assert auth_api.delete("/api/notifications/push/subscriptions", {"endpoint": ENDPOINT}).status_code == 204
    assert PushSubscription.objects.count() == 0


def test_push_subscription_requires_https(auth_api):
    res = auth_api.post(
        "/api/notifications/push/subscriptions",
        {"endpoint": "http://push.example.com/x", "keys": {"p256dh": "p", "auth": "a"}},
    )
    assert res.status_code == 400
    assert res.json()["error"]["fields"]["endpoint"][0]["code"] == "insecure_endpoint"
    res = auth_api.post("/api/notifications/push/subscriptions", {"endpoint": ENDPOINT})
    assert res.json()["error"]["fields"]["keys"][0]["code"] == "required"


# Endpoints


def test_list_cursor_pagination_newest_first(auth_api, user):
    for i in range(5):
        notify(user, "x", f"n{i}")
    first = auth_api.get("/api/notifications/?page_size=2").json()
    assert [n["title"] for n in first["results"]] == ["n4", "n3"]
    assert first["previous_cursor"] is None and first["next_cursor"]
    second = auth_api.get(f"/api/notifications/?page_size=2&cursor={first['next_cursor']}").json()
    assert [n["title"] for n in second["results"]] == ["n2", "n1"]
    item = first["results"][0]
    assert set(item) == {"id", "kind", "title", "body", "url", "data", "read", "read_at", "created_at"}
    assert item["read"] is False


def test_list_filters(auth_api, user):
    a = notify(user, "billing", "a")
    notify(user, "mention", "b")
    auth_api.post(f"/api/notifications/{a.pk}/read")
    assert [n["title"] for n in auth_api.get("/api/notifications/?unread=true").json()["results"]] == ["b"]
    assert [n["title"] for n in auth_api.get("/api/notifications/?unread=false").json()["results"]] == ["a"]
    assert [n["title"] for n in auth_api.get("/api/notifications/?kind=billing").json()["results"]] == ["a"]


def test_read_unread_and_count(auth_api, user, events):
    n = notify(user, "x", "Hi")
    notify(user, "x", "Two")
    assert auth_api.get("/api/notifications/unread-count").json() == {"count": 2}
    events.clear()
    res = auth_api.post(f"/api/notifications/{n.pk}/read")
    assert res.json()["read"] is True and res.json()["read_at"]
    assert events == [{"type": "unread_count", "data": {"count": 1}}]
    assert auth_api.get("/api/notifications/unread-count").json() == {"count": 1}
    res = auth_api.post(f"/api/notifications/{n.pk}/unread")
    assert res.json()["read"] is False
    assert auth_api.get("/api/notifications/unread-count").json() == {"count": 2}
    assert auth_api.post("/api/notifications/read-all").json() == {"count": 2}
    assert auth_api.get("/api/notifications/unread-count").json() == {"count": 0}
    assert auth_api.post("/api/notifications/read-all").json() == {"count": 0}


def test_delete_one_and_clear_read(auth_api, user):
    a = notify(user, "x", "a")
    b = notify(user, "x", "b")
    notify(user, "x", "c")
    assert auth_api.delete(f"/api/notifications/{a.pk}").status_code == 204
    assert auth_api.delete(f"/api/notifications/{a.pk}").status_code == 404
    auth_api.post(f"/api/notifications/{b.pk}/read")
    assert auth_api.delete("/api/notifications/").json() == {"count": 1}
    assert list(Notification.objects.values_list("title", flat=True)) == ["c"]


def test_ownership_isolation(auth_api, user, make_user):
    n = notify(user, "x", "Private")
    other_user = make_user()
    notify(other_user, "x", "Theirs")
    other = APIClient()
    other.force_authenticate(other_user)
    assert [i["title"] for i in other.get("/api/notifications/").json()["results"]] == ["Theirs"]
    assert other.post(f"/api/notifications/{n.pk}/read").status_code == 404
    assert other.delete(f"/api/notifications/{n.pk}").status_code == 404
    assert other.post("/api/notifications/read-all").json() == {"count": 1}
    assert auth_api.get("/api/notifications/unread-count").json() == {"count": 1}


def test_requires_auth(api):
    assert api.get("/api/notifications/").status_code == 401
    assert api.get("/api/notifications/stream", HTTP_ACCEPT="text/event-stream").status_code == 401


def test_preferences_get_and_put(auth_api, user):
    res = auth_api.get("/api/notifications/preferences")
    assert res.json() == {"channels": {"*": ["in_app"]}, "available_channels": ["in_app", "email", "push"]}
    payload = {"channels": {"*": ["in_app", "push"], "billing": ["email", "email"], "mention": []}}
    res = auth_api.put("/api/notifications/preferences", payload)
    assert res.status_code == 200, res.content
    assert res.json()["channels"] == {"*": ["in_app", "push"], "billing": ["email"], "mention": []}
    assert services.resolve_channels(user, "billing") == ["email"]
    assert services.resolve_channels(user, "mention") == []
    assert services.resolve_channels(user, "other") == ["in_app", "push"]
    assert notify(user, "mention", "muted") is None


def test_preferences_reject_unknown_channel(auth_api):
    res = auth_api.put("/api/notifications/preferences", {"channels": {"*": ["sms"]}})
    assert res.status_code == 400
    assert res.json()["error"]["fields"]["channels"][0]["code"] == "invalid_channel"
    with notifications_conf(CHANNELS=["in_app"]):
        res = auth_api.put("/api/notifications/preferences", {"channels": {"*": ["email"]}})
    assert res.status_code == 400


# Server-Sent Events


def test_stream_sends_unread_count_then_live_events(auth_api, user):
    notify(user, "x", "Earlier")
    with override_settings(
        PLEATE={**settings.PLEATE, "REALTIME": {**DEFAULTS["REALTIME"], "HEARTBEAT_SECONDS": 0.05}}
    ):
        res = auth_api.get("/api/notifications/stream", HTTP_ACCEPT="text/event-stream")
        assert res.status_code == 200
        assert res["Content-Type"].startswith("text/event-stream")
        assert res["Cache-Control"] == "no-cache"
        chunks = iter(res.streaming_content)
        assert next(chunks) == b"retry: 3000\n\n"
        assert next(chunks) == b'event: unread_count\ndata: {"count": 1}\n\n'
        assert next(chunks) == b": ping\n\n"  # subscribed now
        n = notify(user, "mention", "Live")
        event = next(chunks).decode()
        assert event.startswith("event: notification\n")
        assert json.loads(event.split("data: ", 1)[1])["id"] == str(n.pk)
        assert next(chunks) == b'event: unread_count\ndata: {"count": 2}\n\n'
        res.close()


def test_stream_does_not_leak_other_users(auth_api, user, make_user):
    with override_settings(
        PLEATE={**settings.PLEATE, "REALTIME": {**DEFAULTS["REALTIME"], "HEARTBEAT_SECONDS": 0.05}}
    ):
        res = auth_api.get("/api/notifications/stream")
        chunks = iter(res.streaming_content)
        next(chunks), next(chunks), next(chunks)
        notify(make_user(), "x", "Not for Ada")
        assert next(chunks) == b": ping\n\n"
        res.close()


# Storage and lifecycle


def test_ttl_index_on_created_at():
    indexes = collection(Notification).index_information().values()
    ttl = [i for i in indexes if i.get("key") == [("created_at", 1)]]
    assert ttl and ttl[0]["expireAfterSeconds"] == 90 * 24 * 60 * 60


def test_export_includes_notifications(auth_api, user):
    notify(user, "x", "Exported")
    Preference.objects.create(user=user, channels={"*": ["email"]})
    _sub(user)
    data = auth_api.get("/api/auth/me/export").json()["notifications"]
    assert data["items"][0]["title"] == "Exported"
    assert data["preferences"] == {"*": ["email"]}
    assert data["push_subscriptions"][0]["endpoint"] == ENDPOINT


def test_user_deletion_cascades(user):
    notify(user, "x", "Bye")
    _sub(user)
    Preference.objects.create(user=user, channels={})
    user.delete()
    assert Notification.objects.count() == PushSubscription.objects.count() == Preference.objects.count() == 0
