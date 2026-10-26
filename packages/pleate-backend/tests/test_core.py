import pytest
from django.test import RequestFactory, override_settings

from pleate_backend.core.conf import pleate_settings
from pleate_backend.core.utils import client_ip

pytestmark = pytest.mark.django_db


def test_health(api):
    res = api.get("/api/health")
    assert res.status_code == 200
    assert res.json()["checks"]["mongodb"] == "ok"
    assert res["X-Request-ID"]


def test_request_id_is_propagated(api):
    res = api.get("/api/health", HTTP_X_REQUEST_ID="abc12345-trace")
    assert res["X-Request-ID"] == "abc12345-trace"


def test_csrf_endpoint_sets_cookie(api):
    res = api.get("/api/csrf")
    assert res.status_code == 200
    assert "csrftoken" in res.cookies


def test_openapi_schema(api):
    res = api.get("/api/schema", HTTP_ACCEPT="application/vnd.oai.openapi+json")
    assert res.status_code == 200
    assert b"/api/auth/login" in res.content


def test_unauthenticated_error_format(api):
    res = api.get("/api/auth/me")
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "not_authenticated"


def test_validation_error_format(api):
    res = api.post("/api/auth/login", {"email": "nope"}, format="json")
    body = res.json()["error"]
    assert res.status_code == 400
    assert body["code"] == "validation_error"
    assert body["fields"]["email"][0]["code"] == "invalid"
    assert body["fields"]["password"][0]["code"] == "required"


def test_client_ip_ignores_spoofed_header_from_untrusted_peer():
    req = RequestFactory().get("/", REMOTE_ADDR="8.8.8.8", HTTP_X_FORWARDED_FOR="1.1.1.1")
    assert client_ip(req) == "8.8.8.8"


def test_client_ip_reads_forwarded_header_from_trusted_proxy():
    req = RequestFactory().get("/", REMOTE_ADDR="127.0.0.1", HTTP_X_FORWARDED_FOR="9.9.9.9, 127.0.0.1")
    assert client_ip(req) == "9.9.9.9"


def test_settings_merge_sections():
    with override_settings(PLEATE={"AUTH": {"SIGNUP_ENABLED": False}}):
        assert pleate_settings.AUTH["SIGNUP_ENABLED"] is False
        assert pleate_settings.AUTH["LOGIN_MAX_ATTEMPTS"] == 5
    assert pleate_settings.AUTH["SIGNUP_ENABLED"] is True


def test_locale_from_cookie(api):
    api.cookies["locale"] = "it"
    res = api.post("/api/auth/login", {}, format="json")
    assert res["Content-Language"] == "it"


def test_cached_decorator():
    from pleate_backend.core.cache import cached, invalidate

    calls = []

    @cached(lambda n: f"square:{n}", ttl=60)
    def square(n):
        calls.append(n)
        return n * n

    assert square(3) == 9
    assert square(3) == 9
    assert calls == [3]
    square.invalidate(3)
    assert square(3) == 9
    assert calls == [3, 3]
    invalidate("square:3")


def test_etag_mixin():
    from rest_framework.response import Response
    from rest_framework.test import APIRequestFactory
    from rest_framework.views import APIView

    from pleate_backend.core.cache import ETagMixin

    class View(ETagMixin, APIView):
        authentication_classes = []
        permission_classes = []

        def get(self, request):
            return Response({"results": [1, 2, 3]})

    factory = APIRequestFactory()
    first = View.as_view()(factory.get("/"))
    tag = first["ETag"]
    assert tag
    second = View.as_view()(factory.get("/", HTTP_IF_NONE_MATCH=tag))
    assert second.status_code == 304


def test_ratelimit_sliding_window():
    from pleate_backend.ratelimit import limits

    for _ in range(3):
        assert limits.hit("t:k", 3, 60)[0]
    allowed, retry = limits.hit("t:k", 3, 60)
    assert not allowed and retry > 0
    assert limits.remaining("t:k", 3, 60) == 0
    limits.reset("t:k", 60)
    assert limits.hit("t:k", 3, 60)[0]


def test_ratelimit_fail_closed(monkeypatch):
    from pleate_backend.ratelimit import limits

    def boom(*a, **k):
        raise ConnectionError

    monkeypatch.setattr(limits.cache, "get_many", boom)
    assert limits.hit("x", 1, 60, fail_closed=True)[0] is False
    assert limits.hit("x", 1, 60)[0] is True


def test_realtime_memory_broker():
    import threading

    from pleate_backend.core.realtime import MemoryBroker, sse_format

    b = MemoryBroker()
    stream = b.listen("c", timeout=0.05)
    assert next(stream) is None  # heartbeat, also registers the subscriber
    threading.Timer(0.01, lambda: b.publish("c", {"type": "hello", "data": {"x": 1}})).start()
    event = next(e for e in stream if e is not None)
    assert sse_format(event) == 'event: hello\ndata: {"x": 1}\n\n'
    stream.close()


def test_emails_render_localized():
    from pleate_backend.emails import render_email

    subject, text, html = render_email("verify_email", {"name": "Ada", "action_url": "http://x/y"}, "en")
    assert subject == "Confirm your email for Plate"
    assert "http://x/y" in text and html and "<html" in html


def test_drf_csrf_failure_has_stable_code(user):
    from rest_framework.test import APIClient

    from .conftest import PASSWORD

    client = APIClient(enforce_csrf_checks=True)
    token = client.get("/api/csrf").json()["csrf_token"]
    client.post(
        "/api/auth/login", {"email": user.email, "password": PASSWORD}, format="json", HTTP_X_CSRFTOKEN=token
    )
    res = client.patch("/api/auth/me", {"name": "x"}, format="json", HTTP_X_CSRFTOKEN="stale")
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "csrf_failed"


def test_email_failure_does_not_break_request(api, monkeypatch, user):
    from pleate_backend.emails import sending

    def boom(*a, **k):
        raise ConnectionRefusedError

    monkeypatch.setattr(sending, "_deliver", boom)
    assert api.post("/api/auth/password/reset", {"email": user.email}).status_code == 202


def test_sse_response_streams_chunks_under_asgi():
    import asyncio

    from django.test import AsyncRequestFactory

    from pleate_backend.core.realtime import sse_response

    seen = []

    def stream():
        for i in range(3):
            seen.append(i)
            yield f"data: {i}\n\n"

    request = AsyncRequestFactory().get("/")
    response = sse_response(stream(), request=request)
    assert response.is_async

    async def first():
        iterator = response.streaming_content.__aiter__()
        chunk = await iterator.__anext__()
        return chunk, list(seen)

    chunk, consumed = asyncio.run(first())
    assert chunk == b"data: 0\n\n"
    # Only the first item was pulled: nothing was buffered.
    assert consumed == [0]
