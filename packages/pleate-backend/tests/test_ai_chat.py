import json
from datetime import timedelta

import httpx2
import pytest
from django.conf import settings
from django.test import override_settings
from django.utils import timezone

from pleate_backend.ai_chat import services
from pleate_backend.ai_chat.models import Conversation, DailyUsage, Message
from pleate_backend.ai_chat.providers import AnthropicProvider, OpenAIProvider, ProviderError

pytestmark = pytest.mark.django_db

try:
    from pleate_backend.files import models as _files_models

    HAS_FILES = hasattr(_files_models, "File")
except ImportError:
    HAS_FILES = False

needs_files = pytest.mark.skipif(not HAS_FILES, reason="pleate_backend.files has no File model yet")

AI_DEFAULTS = {
    "PROVIDER": "pleate_backend.ai_chat.providers.EchoProvider",
    "MODELS": [
        {"id": "echo", "name": "Echo", "description": "Repeats"},
        {"id": "echo-2", "name": "Echo 2", "description": "Repeats again", "options": {"secret": "x"}},
    ],
    "DEFAULT_MODEL": "echo",
    "SUGGESTIONS": [
        {"id": "trip", "title": "Plan a trip", "description": "Three days", "prompt": "Plan a trip"}
    ],
}


def ai_settings(**ai):
    return override_settings(PLEATE={**settings.PLEATE, "AI": {**AI_DEFAULTS, **ai}})


@pytest.fixture(autouse=True)
def _ai_settings():
    with ai_settings():
        yield


def parse_sse(body: str) -> list[tuple[str, dict]]:
    events = []
    for block in body.split("\n\n"):
        name, data = None, None
        for line in block.splitlines():
            if line.startswith("event: "):
                name = line[7:]
            elif line.startswith("data: "):
                data = json.loads(line[6:])
        if name:
            events.append((name, data))
    return events


def stream_events(res) -> list[tuple[str, dict]]:
    assert res.status_code == 200, res.content
    assert res["Content-Type"].startswith("text/event-stream")
    return parse_sse(b"".join(res.streaming_content).decode())


def conversation(api, **data):
    res = api.post("/api/ai/conversations", data, format="json")
    assert res.status_code == 201, res.content
    return res.json()


def send(api, conv_id, content="Hello there", **extra):
    return api.post(f"/api/ai/conversations/{conv_id}/messages", {"content": content, **extra}, format="json")


def send_json(api, conv_id, content="Hello there", **extra):
    return api.post(
        f"/api/ai/conversations/{conv_id}/messages",
        {"content": content, **extra},
        format="json",
        HTTP_ACCEPT="application/json",
    )


@pytest.fixture
def other_api(make_user):
    from rest_framework.test import APIClient

    client = APIClient()
    client.force_authenticate(make_user(email="eve@example.com"))
    return client


# Catalog


def test_models_hide_private_keys(auth_api):
    body = auth_api.get("/api/ai/models").json()
    assert body["default"] == "echo"
    assert body["models"][1] == {"id": "echo-2", "name": "Echo 2", "description": "Repeats again"}


def test_suggestions(auth_api):
    res = auth_api.get("/api/ai/suggestions")
    assert res.json()[0]["prompt"] == "Plan a trip"


def test_requires_login(api):
    assert api.get("/api/ai/conversations").status_code == 401


# Conversations


def test_conversation_crud(auth_api):
    conv = conversation(auth_api, title="Ideas")
    assert conv["model"] == "echo"
    res = auth_api.patch(
        f"/api/ai/conversations/{conv['id']}", {"pinned": True, "model": "echo-2"}, format="json"
    )
    assert res.status_code == 200
    assert res.json()["pinned"] is True and res.json()["model"] == "echo-2"
    assert auth_api.get(f"/api/ai/conversations/{conv['id']}").json()["title"] == "Ideas"
    assert auth_api.delete(f"/api/ai/conversations/{conv['id']}").status_code == 204
    assert auth_api.get(f"/api/ai/conversations/{conv['id']}").status_code == 404


def test_conversation_invalid_model(auth_api):
    res = auth_api.post("/api/ai/conversations", {"model": "gpt-nope"}, format="json")
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "invalid_model"


def test_conversation_list_filters_search_ordering(auth_api):
    a = conversation(auth_api, title="Banana bread")
    conversation(auth_api, title="Apple pie")
    auth_api.patch(f"/api/ai/conversations/{a['id']}", {"archived": True}, format="json")
    body = auth_api.get("/api/ai/conversations").json()
    assert body["count"] == 2 and body["results"][0]["title"] == "Apple pie"
    assert [c["title"] for c in auth_api.get("/api/ai/conversations?archived=true").json()["results"]] == [
        "Banana bread"
    ]
    assert auth_api.get("/api/ai/conversations?search=apple").json()["count"] == 1
    titles = [c["title"] for c in auth_api.get("/api/ai/conversations?ordering=title").json()["results"]]
    assert titles == ["Apple pie", "Banana bread"]


def test_ownership_isolation(auth_api, other_api):
    conv = conversation(auth_api)
    events = stream_events(send(auth_api, conv["id"]))
    assistant_id = events[-1][1]["message"]["id"]
    cid = conv["id"]
    assert other_api.get(f"/api/ai/conversations/{cid}").status_code == 404
    assert other_api.patch(f"/api/ai/conversations/{cid}", {"title": "x"}, format="json").status_code == 404
    assert other_api.delete(f"/api/ai/conversations/{cid}").status_code == 404
    assert other_api.get(f"/api/ai/conversations/{cid}/messages").status_code == 404
    assert send(other_api, cid).status_code == 404
    assert other_api.post(f"/api/ai/messages/{assistant_id}/stop").status_code == 404
    assert other_api.post(f"/api/ai/messages/{assistant_id}/regenerate").status_code == 404
    assert other_api.get("/api/ai/conversations").json()["count"] == 0
    assert auth_api.get("/api/ai/conversations/not-an-id").status_code == 404


# Streaming


def test_send_streams_full_event_sequence(auth_api, user):
    conv = conversation(auth_api)
    events = stream_events(send(auth_api, conv["id"], "Hello there [sources]"))
    names = [n for n, _ in events]
    assert names[:2] == ["user_message", "start"]
    assert names[-1] == "done"
    assert "reasoning" in names and "sources" in names and "error" not in names
    assert events[0][1]["message"]["role"] == "user"
    assert events[1][1]["message"]["status"] == "streaming"
    text = "".join(d["text"] for n, d in events if n == "delta")
    assert text == "You said: Hello there [sources]"
    sources = next(d for n, d in events if n == "sources")["sources"]
    assert sources[0]["url"] == "https://example.com"

    final = events[-1][1]["message"]
    assert final["status"] == "complete" and final["content"] == text
    assert final["reasoning"] == "The user wrote 3 words."
    assert final["sources"] == sources
    assert final["output_tokens"] == 5 and final["input_tokens"] > 0
    stored = Message.objects.get(pk=final["id"])
    assert stored.content == text and stored.status == "complete"

    usage = auth_api.get("/api/ai/usage").json()["today"]
    assert usage["output_tokens"] == 5 and usage["limit"] == 200_000


def test_json_mode(auth_api):
    conv = conversation(auth_api)
    res = send_json(auth_api, conv["id"], "Hi")
    assert res.status_code == 201, res.content
    body = res.json()
    assert body["user_message"]["content"] == "Hi"
    assert body["assistant_message"]["content"] == "You said: Hi"
    assert body["assistant_message"]["status"] == "complete"


def test_messages_list_cursor_is_chronological_within_pages(auth_api):
    conv = conversation(auth_api)
    for i in range(3):
        send_json(auth_api, conv["id"], f"m{i}")
    url = f"/api/ai/conversations/{conv['id']}/messages"
    first = auth_api.get(url + "?page_size=4").json()
    assert [m["content"] for m in first["results"]] == ["m1", "You said: m1", "m2", "You said: m2"]
    older = auth_api.get(url + f"?page_size=4&cursor={first['next_cursor']}").json()
    assert [m["content"] for m in older["results"]] == ["m0", "You said: m0"]
    assert older["next_cursor"] is None


def test_history_is_sent_and_limited(auth_api, monkeypatch):
    seen = {}

    def spy(history, *a, **kw):
        seen["history"] = history
        return iter([{"type": "delta", "text": "ok"}])

    conv = conversation(auth_api, system_prompt="Be brief.")
    with ai_settings(MAX_HISTORY_MESSAGES=3):
        for i in range(3):
            send_json(auth_api, conv["id"], f"m{i}")
        monkeypatch.setattr(
            "pleate_backend.ai_chat.providers.EchoProvider.stream", lambda self, h, **kw: spy(h)
        )
        send_json(auth_api, conv["id"], "last")
    assert [m["content"] for m in seen["history"]] == ["m2", "You said: m2", "last"]


def test_validation_errors(auth_api):
    conv = conversation(auth_api)
    assert send(auth_api, conv["id"], "   ").json()["error"]["code"] == "empty_message"
    res = send(auth_api, conv["id"], "x" * 32_001)
    assert res.status_code == 400
    assert res.json()["error"]["fields"]["content"][0]["code"] == "message_too_long"
    assert send(auth_api, conv["id"], "hi", model="nope").json()["error"]["code"] == "invalid_model"
    res = send(auth_api, conv["id"], "hi", attachments=["507f1f77bcf86cd799439011"])
    assert res.json()["error"]["code"] == "attachment_not_found"
    assert (
        send(auth_api, conv["id"], "hi", attachments=["bogus"]).json()["error"]["code"]
        == "attachment_not_found"
    )
    assert Message.objects.count() == 0


def test_errors_are_json_even_when_asking_for_a_stream(auth_api):
    conv = conversation(auth_api)
    res = auth_api.post(
        f"/api/ai/conversations/{conv['id']}/messages",
        {"content": ""},
        format="json",
        HTTP_ACCEPT="text/event-stream",
    )
    assert res.status_code == 400
    assert res["Content-Type"] == "application/json"
    assert res.json()["error"]["code"] == "empty_message"


def test_model_choice_is_remembered(auth_api):
    conv = conversation(auth_api)
    body = send_json(auth_api, conv["id"], "hi", model="echo-2").json()
    assert body["assistant_message"]["model"] == "echo-2"
    assert Conversation.objects.get(pk=conv["id"]).model == "echo-2"


def test_provider_error_becomes_error_event(auth_api):
    conv = conversation(auth_api)
    events = stream_events(send(auth_api, conv["id"], "Boom [error]"))
    names = [n for n, _ in events]
    assert names[-2:] == ["error", "done"]
    err = events[-2][1]
    assert err["code"] == "provider_error" and err["message"]
    final = events[-1][1]["message"]
    assert final["status"] == "error" and final["error_code"] == "provider_error"
    assert final["content"] == "You"
    assert Message.objects.get(pk=final["id"]).status == "error"


def test_unexpected_exception_never_breaks_the_stream(auth_api, monkeypatch):
    def broken(self, *a, **kw):
        yield {"type": "delta", "text": "Hi"}
        raise RuntimeError("boom")

    monkeypatch.setattr("pleate_backend.ai_chat.providers.EchoProvider.stream", broken)
    conv = conversation(auth_api)
    events = stream_events(send(auth_api, conv["id"]))
    assert [n for n, _ in events][-2:] == ["error", "done"]
    assert events[-1][1]["message"]["status"] == "error"


def test_errored_messages_are_left_out_of_history(auth_api, monkeypatch):
    conv = conversation(auth_api)
    send_json(auth_api, conv["id"], "first [error]")
    seen = {}
    monkeypatch.setattr(
        "pleate_backend.ai_chat.providers.EchoProvider.stream",
        lambda self, h, **kw: seen.setdefault("h", h) and iter(()),
    )
    send_json(auth_api, conv["id"], "second")
    assert [m["role"] for m in seen["h"]] == ["user", "user"]


def test_stop_during_stream(auth_api):
    conv = conversation(auth_api)
    res = send(auth_api, conv["id"], "one two three four five six seven")
    chunks = iter(res.streaming_content)
    events = []
    for chunk in chunks:
        events += parse_sse(chunk.decode())
        if events[-1][0] == "delta":
            break
    assistant_id = events[1][1]["message"]["id"]
    stop = auth_api.post(f"/api/ai/messages/{assistant_id}/stop")
    assert stop.status_code == 202
    for chunk in chunks:
        events += parse_sse(chunk.decode())
    final = events[-1][1]["message"]
    assert events[-1][0] == "done"
    assert final["status"] == "stopped"
    assert final["content"] == "You"
    assert Message.objects.get(pk=assistant_id).status == "stopped"


def test_stop_finished_message_is_a_no_op(auth_api):
    conv = conversation(auth_api)
    final = send_json(auth_api, conv["id"]).json()["assistant_message"]
    res = auth_api.post(f"/api/ai/messages/{final['id']}/stop")
    assert res.status_code == 202 and res.json()["status"] == "complete"


def test_stop_stale_stream_marks_it_stopped(auth_api, user):
    conv = Conversation.objects.create(user=user, title="x")
    msg = Message.objects.create(
        conversation=conv,
        role="assistant",
        status="streaming",
        created_at=timezone.now() - timedelta(hours=1),
    )
    assert auth_api.post(f"/api/ai/messages/{msg.pk}/stop").json()["status"] == "stopped"


def test_client_disconnect_saves_partial_answer(auth_api):
    conv = conversation(auth_api)
    res = send(auth_api, conv["id"], "a b c d e")
    chunks = iter(res.streaming_content)
    events = []
    for chunk in chunks:
        events += parse_sse(chunk.decode())
        if events[-1][0] == "delta":
            break
    res.close()
    msg = Message.objects.get(pk=events[1][1]["message"]["id"])
    assert msg.status == "stopped"
    assert msg.content == "You"


# Regenerate


def test_regenerate_keeps_variants(auth_api):
    conv = conversation(auth_api)
    first = send_json(auth_api, conv["id"], "Hi").json()["assistant_message"]
    events = stream_events(auth_api.post(f"/api/ai/messages/{first['id']}/regenerate", {}, format="json"))
    names = [n for n, _ in events]
    assert names[0] == "start" and names[-1] == "done" and "user_message" not in names
    final = events[-1][1]["message"]
    assert final["id"] == first["id"]
    assert final["variants"] == ["You said: Hi"]
    assert final["content"] == "You said: Hi"

    res = auth_api.post(
        f"/api/ai/messages/{first['id']}/regenerate",
        {"model": "echo-2"},
        format="json",
        HTTP_ACCEPT="application/json",
    )
    assert res.status_code == 200
    body = res.json()["assistant_message"]
    assert body["variants"] == ["You said: Hi", "You said: Hi"] and body["model"] == "echo-2"
    assert Message.objects.filter(conversation_id=conv["id"]).count() == 2


def test_regenerate_only_last_assistant_message(auth_api):
    conv = conversation(auth_api)
    body = send_json(auth_api, conv["id"], "one").json()
    send_json(auth_api, conv["id"], "two")
    res = auth_api.post(f"/api/ai/messages/{body['assistant_message']['id']}/regenerate")
    assert res.status_code == 409 and res.json()["error"]["code"] == "cannot_regenerate"
    res = auth_api.post(f"/api/ai/messages/{body['user_message']['id']}/regenerate")
    assert res.json()["error"]["code"] == "cannot_regenerate"


def test_regenerate_after_stop_is_not_stopped_again(auth_api):
    conv = conversation(auth_api)
    first = send_json(auth_api, conv["id"], "Hi").json()["assistant_message"]
    services.request_stop(first["id"])
    res = auth_api.post(f"/api/ai/messages/{first['id']}/regenerate", HTTP_ACCEPT="application/json")
    assert res.json()["assistant_message"]["status"] == "complete"


# Quota, throttle, title


def test_quota_exceeded(auth_api, user):
    conv = conversation(auth_api)
    with ai_settings(DAILY_TOKEN_LIMIT=10):
        DailyUsage.objects.create(user=user, day=services.today(), input_tokens=6, output_tokens=4)
        res = send(auth_api, conv["id"])
        assert res.status_code == 429
        assert res.json()["error"]["code"] == "quota_exceeded"
        assert auth_api.get("/api/ai/usage").json()["today"] == {
            "input_tokens": 6,
            "output_tokens": 4,
            "limit": 10,
        }
    assert Message.objects.count() == 0


def test_usage_accumulates(auth_api, user):
    conv = conversation(auth_api)
    send_json(auth_api, conv["id"], "a b")
    send_json(auth_api, conv["id"], "c d")
    usage = DailyUsage.objects.get(user=user)
    assert usage.output_tokens == 8
    assert DailyUsage.objects.count() == 1


def test_throttle_scope_ai(auth_api):
    conv = conversation(auth_api)
    rf = {
        **settings.REST_FRAMEWORK,
        "DEFAULT_THROTTLE_RATES": {**settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"], "ai": "2/min"},
    }
    with override_settings(REST_FRAMEWORK=rf):
        assert send_json(auth_api, conv["id"]).status_code == 201
        assert send_json(auth_api, conv["id"]).status_code == 201
        res = send_json(auth_api, conv["id"])
        assert res.status_code == 429 and res.json()["error"]["code"] == "throttled"
        assert auth_api.get(f"/api/ai/conversations/{conv['id']}/messages").status_code == 200


def test_auto_title(auth_api):
    conv = conversation(auth_api)
    long = "Help me plan a weekend in Lisbon with good food, museums and a day trip to Sintra please"
    send_json(auth_api, conv["id"], long)
    title = auth_api.get(f"/api/ai/conversations/{conv['id']}").json()["title"]
    assert len(title) <= 60 and title.endswith("…")
    assert long.startswith(title[:-1])
    assert long[len(title) - 1] == " "
    send_json(auth_api, conv["id"], "Another question")
    assert auth_api.get(f"/api/ai/conversations/{conv['id']}").json()["title"] == title


def test_auto_title_keeps_explicit_title(auth_api):
    conv = conversation(auth_api, title="Mine")
    send_json(auth_api, conv["id"], "Hello")
    assert Conversation.objects.get(pk=conv["id"]).title == "Mine"


def test_auto_title_helper():
    assert services.auto_title("  short\n text ") == "short text"
    assert services.auto_title("x" * 80) == "x" * 59 + "…"


# Export and deletion


def test_export_and_cascade(auth_api, user):
    conv = conversation(auth_api, title="Export me")
    send_json(auth_api, conv["id"], "Hi")
    data = auth_api.get("/api/auth/me/export").json()
    section = data["ai_conversations"]
    assert section[0]["title"] == "Export me"
    assert [m["role"] for m in section[0]["messages"]] == ["user", "assistant"]
    user.delete()
    assert (
        Conversation.objects.count() == 0 and Message.objects.count() == 0 and DailyUsage.objects.count() == 0
    )


# Attachments (need the files app)


@needs_files
def test_attachments_are_sent_to_the_provider(auth_api, user, make_user, monkeypatch):
    from django.core.files.base import ContentFile

    from pleate_backend.files.models import File
    from pleate_backend.files.storage import get_storage

    key = get_storage().save("ai-test/note.txt", ContentFile(b"hello file"))
    f = File.objects.create(
        owner=user, name="note.txt", key=key, size=10, content_type="text/plain", purpose="attachment"
    )
    other = File.objects.create(
        owner=make_user(), name="x.txt", key=key, size=10, content_type="text/plain", purpose="attachment"
    )
    seen = {}
    monkeypatch.setattr(
        "pleate_backend.ai_chat.providers.EchoProvider.stream",
        lambda self, h, **kw: seen.setdefault("h", h) and iter([{"type": "delta", "text": "ok"}]),
    )
    conv = conversation(auth_api)
    res = send_json(auth_api, conv["id"], "", attachments=[str(other.pk)])
    assert res.json()["error"]["code"] == "attachment_not_found"
    res = send_json(auth_api, conv["id"], "", attachments=[str(f.pk)])
    assert res.status_code == 201, res.content
    assert res.json()["user_message"]["attachments"][0]["name"] == "note.txt"
    att = seen["h"][-1]["attachments"][0]
    assert att["name"] == "note.txt" and att["data"] == b"hello file"
    assert Conversation.objects.get(pk=conv["id"]).title == "note.txt"


# Providers with mocked HTTP


def _openai_sse(*payloads) -> bytes:
    return "".join(f"data: {json.dumps(p)}\n\n" for p in payloads).encode() + b"data: [DONE]\n\n"


def _chunk(delta=None, usage=None, choices=True):
    return {
        "id": "c1",
        "object": "chat.completion.chunk",
        "created": 1,
        "model": "gpt-test",
        "choices": [{"index": 0, "delta": delta or {}, "finish_reason": None}] if choices else [],
        "usage": usage,
    }


def openai_client(captured):
    def handler(request):
        captured["url"] = str(request.url)
        captured["body"] = json.loads(request.content)
        captured["auth"] = request.headers.get("authorization")
        body = _openai_sse(
            _chunk({"role": "assistant", "content": ""}),
            _chunk({"reasoning_content": "Thinking"}),
            _chunk({"content": "Hel"}),
            _chunk({"content": "lo"}),
            _chunk(choices=False, usage={"prompt_tokens": 11, "completion_tokens": 2, "total_tokens": 13}),
        )
        return httpx2.Response(200, content=body, headers={"content-type": "text/event-stream"})

    return httpx2.Client(transport=httpx2.MockTransport(handler))


def test_openai_provider_streams_with_usage_and_images():
    captured = {}
    provider = OpenAIProvider(
        api_key="sk-test",
        base_url="http://litellm.test/v1",
        max_retries=0,
        http_client=openai_client(captured),
    )
    messages = [
        {
            "role": "user",
            "content": "What is this?",
            "attachments": [{"name": "a.png", "content_type": "image/png", "data": b"\x89PNG"}],
        }
    ]
    chunks = list(
        provider.stream(messages, model="gpt-test", system="Be nice.", options={"temperature": 0.2})
    )
    assert chunks == [
        {"type": "reasoning", "text": "Thinking"},
        {"type": "delta", "text": "Hel"},
        {"type": "delta", "text": "lo"},
        {"type": "usage", "input_tokens": 11, "output_tokens": 2},
    ]
    body = captured["body"]
    assert captured["url"] == "http://litellm.test/v1/chat/completions"
    assert captured["auth"] == "Bearer sk-test"
    assert body["stream"] is True and body["stream_options"] == {"include_usage": True}
    assert body["temperature"] == 0.2
    assert body["messages"][0] == {"role": "system", "content": "Be nice."}
    parts = body["messages"][1]["content"]
    assert parts[0] == {"type": "text", "text": "What is this?"}
    assert parts[1]["image_url"]["url"].startswith("data:image/png;base64,")


def test_openai_provider_maps_http_errors():
    def handler(request):
        return httpx2.Response(429, json={"error": {"message": "slow down", "type": "rate_limit"}})

    provider = OpenAIProvider(
        api_key="k", max_retries=0, http_client=httpx2.Client(transport=httpx2.MockTransport(handler))
    )
    with pytest.raises(ProviderError) as exc:
        list(provider.stream([{"role": "user", "content": "x"}], model="m", system="", options={}))
    assert exc.value.code == "provider_rate_limited"


def test_openai_compatible_server_end_to_end(auth_api):
    captured = {}
    models = [
        {
            "id": "local",
            "name": "Local",
            "description": "LiteLLM",
            "api_model": "llama-3.3-70b",
            "provider": "pleate_backend.ai_chat.providers.OpenAIProvider",
            "options": {
                "base_url": "http://litellm.test/v1",
                "api_key": "k",
                "max_retries": 0,
                "http_client": openai_client(captured),
            },
        }
    ]
    with ai_settings(MODELS=models, DEFAULT_MODEL="local"):
        conv = conversation(auth_api)
        events = stream_events(send(auth_api, conv["id"], "Hi"))
    final = events[-1][1]["message"]
    assert final["content"] == "Hello" and final["reasoning"] == "Thinking"
    assert final["input_tokens"] == 11 and final["model"] == "local"
    assert captured["body"]["model"] == "llama-3.3-70b"
    assert captured["body"]["messages"][-1] == {"role": "user", "content": "Hi"}


def _anthropic_sse() -> bytes:
    events = [
        (
            "message_start",
            {
                "type": "message_start",
                "message": {
                    "id": "msg_1",
                    "type": "message",
                    "role": "assistant",
                    "model": "claude-sonnet-5-5",
                    "content": [],
                    "stop_reason": None,
                    "stop_sequence": None,
                    "usage": {"input_tokens": 20, "output_tokens": 1},
                },
            },
        ),
        (
            "content_block_start",
            {
                "type": "content_block_start",
                "index": 0,
                "content_block": {"type": "thinking", "thinking": "", "signature": ""},
            },
        ),
        (
            "content_block_delta",
            {
                "type": "content_block_delta",
                "index": 0,
                "delta": {"type": "thinking_delta", "thinking": "Let me think."},
            },
        ),
        (
            "content_block_delta",
            {
                "type": "content_block_delta",
                "index": 0,
                "delta": {"type": "signature_delta", "signature": "sig"},
            },
        ),
        ("content_block_stop", {"type": "content_block_stop", "index": 0}),
        (
            "content_block_start",
            {
                "type": "content_block_start",
                "index": 1,
                "content_block": {"type": "text", "text": "", "citations": None},
            },
        ),
        (
            "content_block_delta",
            {"type": "content_block_delta", "index": 1, "delta": {"type": "text_delta", "text": "Hello"}},
        ),
        (
            "content_block_delta",
            {
                "type": "content_block_delta",
                "index": 1,
                "delta": {
                    "type": "citations_delta",
                    "citation": {
                        "type": "web_search_result_location",
                        "url": "https://docs.example.com",
                        "title": "Docs",
                        "cited_text": "Snippet",
                        "encrypted_index": "x",
                    },
                },
            },
        ),
        (
            "content_block_delta",
            {"type": "content_block_delta", "index": 1, "delta": {"type": "text_delta", "text": " there"}},
        ),
        ("content_block_stop", {"type": "content_block_stop", "index": 1}),
        (
            "message_delta",
            {
                "type": "message_delta",
                "delta": {
                    "stop_reason": "end_turn",
                    "stop_sequence": None,
                    "stop_details": None,
                    "container": None,
                },
                "usage": {"output_tokens": 9},
            },
        ),
        ("message_stop", {"type": "message_stop"}),
    ]
    return "".join(f"event: {name}\ndata: {json.dumps(data)}\n\n" for name, data in events).encode()


def anthropic_client(captured):
    def handler(request):
        captured["url"] = str(request.url)
        captured["body"] = json.loads(request.content)
        captured["key"] = request.headers.get("x-api-key") or request.headers.get(
            "authorization", ""
        ).removeprefix("Bearer ")
        return httpx2.Response(200, content=_anthropic_sse(), headers={"content-type": "text/event-stream"})

    return httpx2.Client(transport=httpx2.MockTransport(handler))


def test_anthropic_provider_streams_thinking_text_sources_usage():
    captured = {}
    provider = AnthropicProvider(api_key="sk-ant", max_retries=0, http_client=anthropic_client(captured))
    messages = [
        {"role": "system", "content": "Extra rule."},
        {"role": "user", "content": "First", "attachments": []},
        {
            "role": "user",
            "content": "Read this",
            "attachments": [
                {"name": "doc.pdf", "content_type": "application/pdf", "data": b"%PDF-1.4"},
                {"name": "a.jpg", "content_type": "image/jpeg", "data": b"\xff\xd8"},
            ],
        },
    ]
    chunks = list(
        provider.stream(
            messages, model="claude-sonnet-5-5", system="Be nice.", options={"thinking": {"type": "adaptive"}}
        )
    )
    assert chunks == [
        {"type": "reasoning", "text": "Let me think."},
        {"type": "delta", "text": "Hello"},
        {
            "type": "sources",
            "sources": [{"title": "Docs", "url": "https://docs.example.com", "snippet": "Snippet"}],
        },
        {"type": "delta", "text": " there"},
        {"type": "usage", "input_tokens": 20, "output_tokens": 9},
    ]
    body = captured["body"]
    assert captured["url"].endswith("/v1/messages") and captured["key"] == "sk-ant"
    assert body["stream"] is True and body["model"] == "claude-sonnet-5-5"
    assert body["max_tokens"] == 4096 and body["thinking"] == {"type": "adaptive"}
    assert body["system"] == "Be nice.\n\nExtra rule."
    assert len(body["messages"]) == 1  # consecutive user turns are merged
    blocks = body["messages"][0]["content"]
    assert blocks[0] == {"type": "text", "text": "First"}
    assert blocks[1]["type"] == "document" and blocks[1]["source"]["media_type"] == "application/pdf"
    assert blocks[2]["type"] == "image" and blocks[2]["source"]["type"] == "base64"
    assert blocks[3] == {"type": "text", "text": "Read this"}


def test_anthropic_end_to_end(auth_api):
    captured = {}
    models = [{"id": "claude-sonnet-5-5", "name": "Sonnet", "description": "Balanced"}]
    with ai_settings(
        PROVIDER="pleate_backend.ai_chat.providers.AnthropicProvider",
        PROVIDER_OPTIONS={"api_key": "sk-ant", "max_retries": 0, "http_client": anthropic_client(captured)},
        MODELS=models,
        DEFAULT_MODEL="claude-sonnet-5-5",
    ):
        conv = conversation(auth_api)
        events = stream_events(send(auth_api, conv["id"], "Hi"))
    names = [n for n, _ in events]
    assert names == ["user_message", "start", "reasoning", "delta", "sources", "delta", "done"]
    final = events[-1][1]["message"]
    assert final["content"] == "Hello there" and final["reasoning"] == "Let me think."
    assert final["sources"][0]["title"] == "Docs"
    assert (final["input_tokens"], final["output_tokens"]) == (20, 9)
    assert captured["body"]["system"] == "You are a helpful assistant."


def test_anthropic_connection_error_is_an_error_event(auth_api):
    def handler(request):
        raise httpx2.ConnectError("down", request=request)

    with ai_settings(
        PROVIDER="pleate_backend.ai_chat.providers.AnthropicProvider",
        PROVIDER_OPTIONS={
            "api_key": "k",
            "max_retries": 0,
            "http_client": httpx2.Client(transport=httpx2.MockTransport(handler)),
        },
        MODELS=[{"id": "claude-haiku-4-5-20251001", "name": "Haiku", "description": ""}],
        DEFAULT_MODEL="claude-haiku-4-5-20251001",
    ):
        conv = conversation(auth_api)
        events = stream_events(send(auth_api, conv["id"], "Hi"))
    assert events[-2] == ("error", {**events[-2][1], "code": "provider_unavailable"})
    assert events[-1][1]["message"]["status"] == "error"
