import datetime
import hashlib
import hmac
import json
import socket
import sys
import time
import types
from concurrent.futures import ThreadPoolExecutor

import httpx
import pytest
import respx
from django.contrib.auth import get_user_model
from django.db import connections
from django.test import override_settings
from django.utils import timezone

from pleate_backend.webhooks import dispatch, register_event
from pleate_backend.webhooks.inbound import claim_inbound, mark_processed, release_inbound, verify_signature
from pleate_backend.webhooks.models import Delivery, Endpoint, InboundEvent
from pleate_backend.webhooks.security import signature_header
from pleate_backend.webhooks.tasks import deliver, retry_due

from .conftest import PASSWORD

pytestmark = pytest.mark.django_db
User = get_user_model()

URL = "https://hooks.example.com/in"
PUBLIC_IP = "93.184.216.34"

# Hostname -> address used by the fake resolver. Everything under example.com is public.
DNS: dict = {}


@pytest.fixture(autouse=True)
def fake_dns(monkeypatch):
    real = socket.getaddrinfo
    DNS.clear()

    def resolve(host, port, *args, **kwargs):
        if host in DNS:
            address = DNS[host]
        elif host.endswith("example.com"):
            address = PUBLIC_IP
        elif host.endswith(".invalid"):
            raise socket.gaierror("not found")
        else:
            return real(host, port, *args, **kwargs)
        family = socket.AF_INET6 if ":" in address else socket.AF_INET
        return [(family, socket.SOCK_STREAM, 6, "", (address, port))]

    monkeypatch.setattr(socket, "getaddrinfo", resolve)
    yield


@pytest.fixture
def mock_http():
    with respx.mock(assert_all_called=False) as router:
        yield router


def make_endpoint(owner, url=URL, events=("*",), **extra):
    return Endpoint.objects.create(
        owner=owner, url=url, secret="whsec_test_secret", events=list(events), **extra
    )


def expected_signature(secret: str, header: str, body: bytes) -> bool:
    parts = dict(p.split("=", 1) for p in header.split(","))
    mac = hmac.new(secret.encode(), f"{parts['t']}.".encode() + body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(mac, parts["v1"]) and abs(time.time() - int(parts["t"])) < 10


# Endpoint CRUD


def test_create_endpoint_shows_secret_once(auth_api):
    res = auth_api.post(
        "/api/webhooks/endpoints", {"url": URL, "description": "Prod", "events": ["user.created"]}
    )
    assert res.status_code == 201, res.content
    body = res.json()
    assert body["secret"].startswith("whsec_") and len(body["secret"]) > 30
    assert body["events"] == ["user.created"]
    assert body["active"] is True
    endpoint = Endpoint.objects.get(pk=body["id"])
    assert endpoint.secret == body["secret"]

    listed = auth_api.get("/api/webhooks/endpoints").json()
    assert listed["count"] == 1
    masked = listed["results"][0]["secret"]
    assert masked != body["secret"] and masked.endswith(body["secret"][-4:]) and "*" in masked
    assert auth_api.get(f"/api/webhooks/endpoints/{body['id']}").json()["secret"] == masked


def test_create_endpoint_defaults_to_every_event(auth_api):
    res = auth_api.post("/api/webhooks/endpoints", {"url": URL})
    assert res.json()["events"] == ["*"]
    res = auth_api.post("/api/webhooks/endpoints", {"url": URL, "events": ["user.created", "*"]})
    assert res.json()["events"] == ["*"]


def test_create_endpoint_validates_events(auth_api):
    res = auth_api.post("/api/webhooks/endpoints", {"url": URL, "events": ["nope.happened"]})
    assert res.json()["error"]["fields"]["events"][0]["code"] == "unknown_event"
    res = auth_api.post("/api/webhooks/endpoints", {"url": URL, "events": []})
    assert res.json()["error"]["fields"]["events"][0]["code"] == "events_required"
    with override_settings(PLEATE={"WEBHOOKS": {"EVENTS": [{"name": "order.paid", "description": "Paid"}]}}):
        res = auth_api.post("/api/webhooks/endpoints", {"url": URL, "events": ["order.paid"]})
        assert res.status_code == 201


@pytest.mark.parametrize(
    "url,dns",
    [
        ("http://hooks.example.com/in", None),
        ("ftp://hooks.example.com/in", None),
        ("https://127.0.0.1/in", None),
        ("https://[::1]/in", None),
        ("https://10.0.0.8/in", None),
        ("https://169.254.169.254/latest/meta-data", None),
        ("https://192.168.1.10/in", None),
        ("https://224.0.0.1/in", None),
        ("https://0.0.0.0/in", None),
        ("https://user:pw@hooks.example.com/in", None),
        ("https://rebind.attacker.test/in", "127.0.0.1"),
        ("https://internal.attacker.test/in", "10.1.2.3"),
        ("https://v6.attacker.test/in", "::ffff:127.0.0.1"),
        ("https://missing.invalid/in", None),
    ],
)
def test_create_endpoint_rejects_unsafe_urls(auth_api, url, dns):
    if dns:
        DNS[url.split("/")[2]] = dns
    res = auth_api.post("/api/webhooks/endpoints", {"url": url})
    assert res.status_code == 400, res.content
    assert res.json()["error"]["fields"]["url"][0]["code"] in ("url_not_allowed", "invalid")
    if url.startswith(("https://", "http://hooks")) and "user:pw" not in url:
        assert res.json()["error"]["fields"]["url"][0]["code"] == "url_not_allowed"


def test_private_urls_allowed_in_development(auth_api):
    with override_settings(PLEATE={"WEBHOOKS": {"ALLOW_PRIVATE_URLS": True}}):
        res = auth_api.post("/api/webhooks/endpoints", {"url": "http://localhost:8000/hooks"})
    assert res.status_code == 201, res.content


def test_endpoint_limit(auth_api, user):
    for _ in range(20):
        make_endpoint(user)
    res = auth_api.post("/api/webhooks/endpoints", {"url": URL})
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "endpoint_limit"


def test_update_rechecks_url_and_reactivation_resets(auth_api, user):
    endpoint = make_endpoint(user, active=False, consecutive_failures=20, disabled_at=timezone.now())
    DNS["evil.attacker.test"] = "127.0.0.1"
    res = auth_api.patch(f"/api/webhooks/endpoints/{endpoint.pk}", {"url": "https://evil.attacker.test/x"})
    assert res.json()["error"]["fields"]["url"][0]["code"] == "url_not_allowed"
    res = auth_api.patch(f"/api/webhooks/endpoints/{endpoint.pk}", {"active": True, "description": "Back"})
    assert res.status_code == 200
    assert res.json()["consecutive_failures"] == 0
    assert res.json()["disabled_at"] is None
    assert res.json()["description"] == "Back"


def test_endpoints_are_owner_scoped(auth_api, make_user):
    other = make_user()
    endpoint = make_endpoint(other)
    delivery = Delivery.objects.create(endpoint=endpoint, event_id="evt_1", event="ping", payload={})
    assert auth_api.get("/api/webhooks/endpoints").json()["count"] == 0
    for method, path in [
        ("get", f"/api/webhooks/endpoints/{endpoint.pk}"),
        ("patch", f"/api/webhooks/endpoints/{endpoint.pk}"),
        ("delete", f"/api/webhooks/endpoints/{endpoint.pk}"),
        ("post", f"/api/webhooks/endpoints/{endpoint.pk}/rotate-secret"),
        ("post", f"/api/webhooks/endpoints/{endpoint.pk}/test"),
        ("get", f"/api/webhooks/endpoints/{endpoint.pk}/deliveries"),
        ("get", f"/api/webhooks/deliveries/{delivery.pk}"),
        ("post", f"/api/webhooks/deliveries/{delivery.pk}/redeliver"),
        ("get", "/api/webhooks/endpoints/not-an-id"),
        ("get", "/api/webhooks/deliveries/not-an-id"),
    ]:
        assert getattr(auth_api, method)(path).status_code == 404, path
    assert Endpoint.objects.filter(pk=endpoint.pk).exists()


def test_requires_login(api):
    assert api.get("/api/webhooks/endpoints").status_code == 401
    assert api.get("/api/webhooks/events").status_code == 401


def test_delete_and_rotate_secret(auth_api, user):
    endpoint = make_endpoint(user)
    res = auth_api.post(f"/api/webhooks/endpoints/{endpoint.pk}/rotate-secret")
    assert res.status_code == 200
    secret = res.json()["secret"]
    assert secret.startswith("whsec_") and secret != "whsec_test_secret"
    endpoint.refresh_from_db()
    assert endpoint.secret == secret
    assert auth_api.delete(f"/api/webhooks/endpoints/{endpoint.pk}").status_code == 204
    assert not Endpoint.objects.filter(pk=endpoint.pk).exists()


def test_events_list(auth_api):
    register_event("invoice.paid", "An invoice was paid.")
    with override_settings(PLEATE={"WEBHOOKS": {"EVENTS": ["order.shipped"]}}):
        events = auth_api.get("/api/webhooks/events").json()
    names = [e["name"] for e in events]
    assert {"ping", "user.created", "user.deleted", "invoice.paid", "order.shipped"} <= set(names)
    assert names == sorted(names)
    assert next(e for e in events if e["name"] == "invoice.paid")["description"] == "An invoice was paid."


# Delivery


def test_test_ping_is_signed(auth_api, user, mock_http):
    route = mock_http.post(URL).mock(return_value=httpx.Response(200, text="ok"))
    endpoint = make_endpoint(user)
    res = auth_api.post(f"/api/webhooks/endpoints/{endpoint.pk}/test")
    assert res.status_code == 200, res.content
    body = res.json()
    assert body["status"] == "success" and body["status_code"] == 200
    assert body["duration_ms"] >= 0

    request = route.calls.last.request
    raw = request.content
    payload = json.loads(raw)
    assert payload["type"] == "ping"
    assert set(payload) == {"id", "type", "created_at", "data"}
    assert request.headers["content-type"] == "application/json"
    assert request.headers["user-agent"] == "pleate-webhooks/1"
    assert request.headers["pleate-event"] == "ping"
    assert request.headers["pleate-delivery"] == body["delivery"]
    assert expected_signature("whsec_test_secret", request.headers["pleate-signature"], raw)
    assert verify_signature("whsec_test_secret", raw, request.headers["pleate-signature"])
    delivery = Delivery.objects.get(pk=body["delivery"])
    assert delivery.response_excerpt == "ok"


def test_test_ping_failure_does_not_retry_or_count(auth_api, user, mock_http):
    mock_http.post(URL).mock(return_value=httpx.Response(500))
    endpoint = make_endpoint(user)
    body = auth_api.post(f"/api/webhooks/endpoints/{endpoint.pk}/test").json()
    assert body["status"] == "failed" and body["status_code"] == 500
    delivery = Delivery.objects.get(pk=body["delivery"])
    assert delivery.next_attempt_at is None
    endpoint.refresh_from_db()
    assert endpoint.consecutive_failures == 0


def test_dispatch_to_owner_matching_endpoints(user, make_user, mock_http):
    route = mock_http.post(URL).mock(return_value=httpx.Response(204))
    register_event("invoice.paid", "")
    wants = make_endpoint(user, events=["invoice.paid"])
    make_endpoint(user, events=["user.created"])
    make_endpoint(user, active=False)
    make_endpoint(make_user())
    deliveries = dispatch("invoice.paid", {"amount": 10, "at": timezone.now()}, owner=user)
    assert [d.endpoint_id for d in deliveries] == [wants.pk]
    assert route.call_count == 1
    delivery = Delivery.objects.get(pk=deliveries[0].pk)
    assert delivery.status == "success"
    assert delivery.attempts == 1
    assert delivery.delivered_at is not None
    assert delivery.next_attempt_at is None
    assert delivery.payload["data"]["amount"] == 10
    assert isinstance(delivery.payload["data"]["at"], str)
    assert json.loads(route.calls.last.request.content)["id"] == delivery.event_id


def test_dispatch_unknown_event():
    with pytest.raises(ValueError):
        dispatch("never.registered", {})


def test_user_events_go_to_staff_endpoints(api, staff, user, mock_http):
    route = mock_http.post(URL).mock(return_value=httpx.Response(200))
    staff_endpoint = make_endpoint(staff, events=["user.created", "user.deleted"])
    make_endpoint(user, events=["user.created"])
    res = api.post("/api/auth/signup", {"email": "new@example.com", "password": PASSWORD})
    assert res.status_code == 201
    created = Delivery.objects.get(event="user.created")
    assert created.endpoint_id == staff_endpoint.pk
    assert created.payload["data"]["email"] == "new@example.com"

    new = User.objects.get(email="new@example.com")
    new_id = str(new.pk)
    api.force_authenticate(new)
    assert api.delete("/api/auth/me", {"password": PASSWORD}, format="json").status_code == 204
    deleted = Delivery.objects.get(event="user.deleted")
    assert deleted.payload["data"] == {"id": new_id, "email": "new@example.com"}
    assert route.call_count == 2


def test_failed_delivery_follows_retry_schedule(user, mock_http):
    route = mock_http.post(URL).mock(return_value=httpx.Response(503, text="x" * 5000))
    make_endpoint(user)
    with override_settings(PLEATE={"WEBHOOKS": {"MAX_ATTEMPTS": 4}}):
        delivery = dispatch("ping", {}, owner=user)[0]
        delivery.refresh_from_db()
        assert delivery.status == "failed"
        assert delivery.attempts == 1
        assert delivery.last_status_code == 503
        assert len(delivery.response_excerpt) == 1024
        expected_delays = [60, 300, 1800]
        for i, delay in enumerate(expected_delays, start=1):
            wait = (delivery.next_attempt_at - timezone.now()).total_seconds()
            assert delay - 5 < wait <= delay, (i, wait)
            assert retry_due() == 0  # not due yet
            Delivery.objects.filter(pk=delivery.pk).update(
                next_attempt_at=timezone.now() - datetime.timedelta(seconds=1)
            )
            assert retry_due() == 1
            delivery.refresh_from_db()
            assert delivery.attempts == i + 1
        assert delivery.attempts == 4
        assert delivery.status == "failed"
        assert delivery.next_attempt_at is None
    assert route.call_count == 4


def test_retry_succeeds_and_resets_failures(user, mock_http):
    route = mock_http.post(URL)
    route.side_effect = [httpx.ConnectTimeout("slow"), httpx.Response(200)]
    endpoint = make_endpoint(user)
    delivery = dispatch("ping", {}, owner=user)[0]
    delivery.refresh_from_db()
    assert delivery.last_error == "timeout"
    endpoint.refresh_from_db()
    assert endpoint.consecutive_failures == 1
    Delivery.objects.filter(pk=delivery.pk).update(next_attempt_at=timezone.now())
    retry_due()
    delivery.refresh_from_db()
    assert delivery.status == "success"
    assert delivery.last_error == ""
    endpoint.refresh_from_db()
    assert endpoint.consecutive_failures == 0


def test_redirects_are_not_followed(user, mock_http):
    mock_http.post(URL).mock(return_value=httpx.Response(302, headers={"Location": "http://127.0.0.1/"}))
    other = mock_http.route(host="127.0.0.1").mock(return_value=httpx.Response(200))
    make_endpoint(user)
    delivery = dispatch("ping", {}, owner=user)[0]
    delivery.refresh_from_db()
    assert delivery.status == "failed"
    assert delivery.last_status_code == 302
    assert other.call_count == 0


def test_ssrf_is_checked_again_before_sending(user, mock_http):
    host_url = "https://moving.attacker.test/hook"
    route = mock_http.post(host_url).mock(return_value=httpx.Response(200))
    DNS["moving.attacker.test"] = PUBLIC_IP
    make_endpoint(user, url=host_url)
    DNS["moving.attacker.test"] = "127.0.0.1"
    delivery = dispatch("ping", {}, owner=user)[0]
    delivery.refresh_from_db()
    assert delivery.status == "failed"
    assert delivery.last_error.startswith("url_not_allowed")
    assert route.call_count == 0


def test_endpoint_disabled_after_20_failures(user, mock_http, monkeypatch):
    sent = []
    fake = types.ModuleType("pleate_backend.notifications.services")
    fake.notify = lambda user, kind, title, body="", url="", data=None: sent.append((user, kind, data))
    monkeypatch.setitem(sys.modules, "pleate_backend.notifications.services", fake)
    route = mock_http.post(URL).mock(return_value=httpx.Response(500))
    endpoint = make_endpoint(user)
    for _ in range(19):
        dispatch("ping", {}, owner=user)
    endpoint.refresh_from_db()
    assert endpoint.active is True and endpoint.consecutive_failures == 19
    dispatch("ping", {}, owner=user)
    endpoint.refresh_from_db()
    assert endpoint.active is False
    assert endpoint.disabled_at is not None
    assert sent == [(user, "webhook_disabled", {"endpoint_id": str(endpoint.pk)})]
    # Pending retries are cancelled and no more deliveries are made.
    assert not Delivery.objects.filter(next_attempt_at__isnull=False).exists()
    assert dispatch("ping", {}, owner=user) == []
    assert route.call_count == 20


def test_delivery_is_claimed_once(user, mock_http):
    route = mock_http.post(URL).mock(return_value=httpx.Response(200))
    endpoint = make_endpoint(user)
    delivery = Delivery.objects.create(
        endpoint=endpoint,
        event_id="evt_x",
        event="ping",
        payload={"id": "evt_x"},
        next_attempt_at=timezone.now(),
    )
    assert deliver(str(delivery.pk)) == "success"
    assert deliver(str(delivery.pk)) is None
    assert route.call_count == 1


def test_deliveries_list_detail_and_redeliver(auth_api, user, mock_http):
    route = mock_http.post(URL)
    route.side_effect = [
        httpx.Response(500, text="boom"),
        httpx.Response(200, text="fine"),
        httpx.Response(200),
    ]
    endpoint = make_endpoint(user)
    register_event("invoice.paid", "")
    failed = dispatch("invoice.paid", {"n": 1}, owner=user)[0]
    dispatch("ping", {}, owner=user)

    res = auth_api.get(f"/api/webhooks/endpoints/{endpoint.pk}/deliveries")
    assert res.status_code == 200
    assert res.json()["count"] == 2
    assert "payload" not in res.json()["results"][0]
    res = auth_api.get(f"/api/webhooks/endpoints/{endpoint.pk}/deliveries", {"status": "failed"})
    assert [r["event"] for r in res.json()["results"]] == ["invoice.paid"]
    res = auth_api.get(f"/api/webhooks/endpoints/{endpoint.pk}/deliveries", {"event": "ping"})
    assert [r["status"] for r in res.json()["results"]] == ["success"]

    detail = auth_api.get(f"/api/webhooks/deliveries/{failed.pk}").json()
    assert detail["payload"]["data"] == {"n": 1}
    assert detail["response_excerpt"] == "boom"
    assert detail["last_status_code"] == 500

    res = auth_api.post(f"/api/webhooks/deliveries/{failed.pk}/redeliver")
    assert res.status_code == 202, res.content
    again = res.json()
    assert again["id"] != str(failed.pk)
    assert again["event_id"] == failed.event_id
    assert again["status"] == "success"

    endpoint.active = False
    endpoint.save()
    res = auth_api.post(f"/api/webhooks/deliveries/{failed.pk}/redeliver")
    assert res.json()["error"]["code"] == "endpoint_inactive"


def test_deleting_the_account_removes_endpoints(auth_api, user):
    endpoint = make_endpoint(user)
    Delivery.objects.create(endpoint=endpoint, event_id="evt_1", event="ping", payload={})
    assert auth_api.delete("/api/auth/me", {"password": PASSWORD}, format="json").status_code == 204
    assert not Endpoint.objects.exists()
    assert not Delivery.objects.exists()


def test_ttl_indexes():
    from pleate_backend.core.mongo import collection
    from pleate_backend.webhooks.handlers import ensure_indexes

    ensure_indexes()
    for model, field in [(Delivery, "created_at"), (InboundEvent, "received_at")]:
        info = [i for i in collection(model).index_information().values() if i.get("key") == [(field, 1)]]
        assert info and info[0]["expireAfterSeconds"] == 30 * 24 * 60 * 60


# Inbound


def test_verify_signature():
    secret = "whsec_abc"
    body = b'{"id":"evt_1","type":"ping"}'
    header = signature_header(secret, body)
    assert verify_signature(secret, body, header)
    assert not verify_signature(secret, body + b" ", header)
    assert not verify_signature("whsec_other", body, header)
    assert not verify_signature(secret, body, "")
    assert not verify_signature(secret, body, "garbage")
    assert not verify_signature(secret, body, "t=abc,v1=00")
    old = signature_header(secret, body, timestamp=int(time.time()) - 301)
    assert not verify_signature(secret, body, old)
    assert verify_signature(secret, body, old, tolerance=600)
    # Several signatures (secret rotation): any match passes.
    ts = header.split(",")[0]
    assert verify_signature(secret, body, f"{ts},v1=deadbeef,{header.split(',')[1]}")


def test_claim_inbound_is_idempotent():
    assert claim_inbound("stripe", "evt_1", {"a": 1}) is True
    assert claim_inbound("stripe", "evt_1", {"a": 1}) is False
    assert claim_inbound("github", "evt_1") is True
    mark_processed("stripe", "evt_1")
    assert InboundEvent.objects.get(provider="stripe").processed_at is not None
    release_inbound("stripe", "evt_1")  # processed: kept
    assert InboundEvent.objects.filter(provider="stripe").exists()
    release_inbound("github", "evt_1")
    assert claim_inbound("github", "evt_1") is True


def test_claim_inbound_race():
    def claim(_):
        try:
            return claim_inbound("stripe", "evt_race", {})
        finally:
            connections.close_all()

    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(claim, range(8)))
    assert results.count(True) == 1
    assert InboundEvent.objects.filter(event_id="evt_race").count() == 1
