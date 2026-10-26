"""
Generation engine shared by the send and regenerate endpoints.

``generate`` yields SSE event dicts (``{"type": ..., "data": ...}``) and owns
the lifecycle of the assistant message: progressive saves, stop flag, usage,
auto title. It never raises: provider failures become an ``error`` event.
"""

import logging
import re
import time
from collections.abc import Iterator

from bson import ObjectId
from django.apps import apps
from django.core.cache import cache
from django.db import IntegrityError
from django.db.models import F
from django.utils import timezone
from django.utils.module_loading import import_string
from django.utils.translation import gettext as _

from pleate_backend.core.conf import pleate_settings
from pleate_backend.core.exceptions import ApiError

from .models import Conversation, DailyUsage, Message
from .providers import Provider, ProviderError
from .serializers import MessageSerializer

logger = logging.getLogger(__name__)

SAVE_INTERVAL = 1.0
STOP_TTL = 60 * 15
TITLE_LENGTH = 60


# Models and providers


def model_entries() -> list[dict]:
    return list(pleate_settings.AI["MODELS"] or [])


def default_model_id() -> str:
    entries = model_entries()
    return pleate_settings.AI["DEFAULT_MODEL"] or (entries[0]["id"] if entries else "")


def resolve_model(model_id: str | None) -> dict:
    """The MODELS entry for ``model_id`` (blank means the default). Unknown ids raise ``invalid_model``."""
    model_id = model_id or default_model_id()
    for entry in model_entries():
        if entry["id"] == model_id:
            return entry
    raise ApiError("invalid_model", _("This model is not available."), 400)


def get_provider(entry: dict) -> Provider:
    conf = pleate_settings.AI
    path = entry.get("provider") or conf["PROVIDER"]
    options = dict(conf["PROVIDER_OPTIONS"] or {}) if path == conf["PROVIDER"] else {}
    options.update(entry.get("options") or {})
    return import_string(path)(**options)


# Quota


def today():
    return timezone.now().date()


def usage_today(user) -> DailyUsage:
    return DailyUsage.objects.filter(user=user, day=today()).first() or DailyUsage(user=user, day=today())


def check_quota(user) -> None:
    limit = pleate_settings.AI["DAILY_TOKEN_LIMIT"]
    if limit and usage_today(user).total_tokens >= limit:
        raise ApiError("quota_exceeded", _("You reached the daily limit. Try again tomorrow."), 429)


def record_usage(user_id, input_tokens: int, output_tokens: int) -> None:
    if not input_tokens and not output_tokens:
        return
    day = today()
    updated = DailyUsage.objects.filter(user_id=user_id, day=day).update(
        input_tokens=F("input_tokens") + input_tokens, output_tokens=F("output_tokens") + output_tokens
    )
    if updated:
        return
    try:
        DailyUsage.objects.create(
            user_id=user_id, day=day, input_tokens=input_tokens, output_tokens=output_tokens
        )
    except IntegrityError:
        DailyUsage.objects.filter(user_id=user_id, day=day).update(
            input_tokens=F("input_tokens") + input_tokens, output_tokens=F("output_tokens") + output_tokens
        )


# Attachments


def validate_attachments(user, ids: list[str]) -> list[str]:
    """Every id must be a file of ``user``, else ``attachment_not_found``."""
    if not ids:
        return []
    error = ApiError("attachment_not_found", _("One of the attached files does not exist."), 400)
    if not apps.is_installed("pleate_backend.files") or not all(ObjectId.is_valid(i) for i in ids):
        raise error
    from pleate_backend.files.models import File

    if File.objects.filter(pk__in=ids, owner=user).count() != len(set(ids)):
        raise error
    return ids


def load_attachments(user_id, ids: list[str]) -> list[dict]:
    """``[{name, content_type, data}]`` for the provider. Files deleted since are skipped."""
    if not ids or not apps.is_installed("pleate_backend.files"):
        return []
    from pleate_backend.files.models import File
    from pleate_backend.files.services import open_file

    files = {
        str(f.pk): f
        for f in File.objects.filter(pk__in=[i for i in ids if ObjectId.is_valid(i)], owner_id=user_id)
    }
    out = []
    for i in ids:
        f = files.get(i)
        if f is None:
            continue
        try:
            handle = open_file(f)
            try:
                data = handle.read()
            finally:
                close = getattr(handle, "close", None)
                if close:
                    close()
        except Exception:
            logger.warning("ai_chat: could not read attachment %s", i, exc_info=True)
            continue
        out.append({"name": f.name, "content_type": f.content_type, "data": data})
    return out


# History


def build_history(conversation: Conversation, before: Message) -> list[dict]:
    """The last ``MAX_HISTORY_MESSAGES`` usable messages created before ``before``."""
    limit = pleate_settings.AI["MAX_HISTORY_MESSAGES"] or 40
    rows = list(
        Message.objects.filter(conversation=conversation, created_at__lte=before.created_at)
        .exclude(pk=before.pk)
        .exclude(status__in=[Message.Status.ERROR, Message.Status.STREAMING])
        .order_by("-created_at", "-id")[:limit]
    )
    rows.reverse()
    history = []
    for m in rows:
        if m.role == Message.Role.ASSISTANT and not m.content:
            continue
        history.append(
            {
                "role": m.role,
                "content": m.content,
                "attachments": load_attachments(conversation.user_id, m.attachments) if m.attachments else [],
            }
        )
    return history


def system_prompt(conversation: Conversation) -> str:
    return conversation.system_prompt or pleate_settings.AI["SYSTEM_PROMPT"] or ""


# Titles


def auto_title(text: str, length: int = TITLE_LENGTH) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    if len(text) <= length:
        return text
    cut = text[: length - 1]
    if " " in cut and text[length - 1] != " ":
        cut = cut.rsplit(" ", 1)[0]
    return cut.rstrip(" ,.;:") + "…"


# Stop flag


def stop_key(message_id) -> str:
    return f"pleate:ai:stop:{message_id}"


def request_stop(message_id) -> None:
    cache.set(stop_key(message_id), True, STOP_TTL)


def stop_requested(message_id) -> bool:
    try:
        return bool(cache.get(stop_key(message_id)))
    except Exception:
        return False


# Generation


def event(kind: str, data: dict) -> dict:
    return {"type": kind, "data": data}


def message_data(message: Message) -> dict:
    return MessageSerializer(message).data


def _merge_sources(current: list[dict], new: list) -> list[dict]:
    seen = {s.get("url") for s in current}
    for src in new or []:
        if not isinstance(src, dict) or not src.get("url") or src["url"] in seen:
            continue
        seen.add(src["url"])
        current.append(
            {
                "title": str(src.get("title") or src["url"]),
                "url": str(src["url"]),
                "snippet": str(src.get("snippet") or ""),
            }
        )
    return current


def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4) if text else 0


def generate(
    conversation: Conversation,
    assistant: Message,
    history: list[dict],
    entry: dict,
    *,
    user_message: Message | None = None,
) -> Iterator[dict]:
    cache.delete(stop_key(assistant.pk))
    content: list[str] = []
    reasoning: list[str] = []
    sources: list[dict] = []
    usage: dict | None = None
    status = Message.Status.COMPLETE
    error: tuple[str, str] | None = None
    last_save = time.monotonic()
    system = system_prompt(conversation)

    try:
        if user_message is not None:
            yield event("user_message", {"message": message_data(user_message)})
        yield event("start", {"message": message_data(assistant)})
        provider = get_provider(entry)
        chunks = provider.stream(
            history,
            model=entry.get("api_model") or entry["id"],
            system=system,
            options=dict(entry.get("params") or {}),
        )
        try:
            for chunk in chunks:
                if stop_requested(assistant.pk):
                    status = Message.Status.STOPPED
                    break
                kind = chunk.get("type")
                if kind == "delta" and chunk.get("text"):
                    content.append(chunk["text"])
                    yield event("delta", {"text": chunk["text"]})
                elif kind == "reasoning" and chunk.get("text"):
                    reasoning.append(chunk["text"])
                    yield event("reasoning", {"text": chunk["text"]})
                elif kind == "sources":
                    _merge_sources(sources, chunk.get("sources"))
                    yield event("sources", {"sources": list(sources)})
                elif kind == "usage":
                    usage = {
                        "input_tokens": int(chunk.get("input_tokens") or 0),
                        "output_tokens": int(chunk.get("output_tokens") or 0),
                    }
                if time.monotonic() - last_save >= SAVE_INTERVAL:
                    Message.objects.filter(pk=assistant.pk).update(
                        content="".join(content), reasoning="".join(reasoning)
                    )
                    last_save = time.monotonic()
        finally:
            close = getattr(chunks, "close", None)
            if close:
                close()
    except GeneratorExit:
        # The client went away: keep what was produced.
        status = Message.Status.STOPPED
        raise
    except ProviderError as exc:
        status = Message.Status.ERROR
        error = (exc.code, str(exc.message))
    except Exception:
        logger.exception("ai_chat: provider failed")
        status = Message.Status.ERROR
        error = ("provider_error", str(ProviderError.default_message))
    finally:
        try:
            _finish(
                conversation,
                assistant,
                history,
                system,
                content,
                reasoning,
                sources,
                usage,
                status,
                error,
                user_message,
            )
        except Exception:
            logger.exception("ai_chat: could not save the assistant message")

    if error:
        yield event("error", {"code": error[0], "message": error[1], "message_id": str(assistant.pk)})
    yield event("done", {"message": message_data(assistant)})


def _finish(
    conversation, assistant, history, system, content, reasoning, sources, usage, status, error, user_message
):
    text = "".join(content)
    if usage is None:
        usage = {
            "input_tokens": _estimate_tokens(system) + sum(_estimate_tokens(m["content"]) for m in history),
            "output_tokens": _estimate_tokens(text) + _estimate_tokens("".join(reasoning)),
        }
    assistant.content = text
    assistant.reasoning = "".join(reasoning)
    assistant.sources = sources
    assistant.status = status
    assistant.error_code = error[0] if error else ""
    assistant.input_tokens = usage["input_tokens"]
    assistant.output_tokens = usage["output_tokens"]
    assistant.save()
    record_usage(conversation.user_id, usage["input_tokens"], usage["output_tokens"])

    fields = {"last_message_at": timezone.now()}
    if not conversation.title:
        first = (
            user_message or Message.objects.filter(conversation=conversation, role=Message.Role.USER).first()
        )
        if first is not None:
            title = auto_title(first.content)
            if not title and first.attachments:
                from .serializers import attachment_details

                title = auto_title(attachment_details(first.attachments[:1])[0]["name"])
            if title:
                fields["title"] = title
    for key, value in fields.items():
        setattr(conversation, key, value)
    Conversation.objects.filter(pk=conversation.pk).update(updated_at=timezone.now(), **fields)
    cache.delete(stop_key(assistant.pk))
