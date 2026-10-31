"""
Publish/subscribe used by the Server-Sent Events endpoints (notifications,
chat). Two brokers:

- ``MemoryBroker``: in process. Fine for development and tests, but events do
  not cross processes.
- ``RedisBroker``: Redis pub/sub, for production. Needs ``PLEATE["REDIS_URL"]``.

    from pleate_backend.core.realtime import broker
    broker().publish("user:42", {"type": "notification", "data": {...}})
"""

import asyncio
import json
import queue
import threading
import time
from collections import defaultdict
from collections.abc import Iterator

from django.http import StreamingHttpResponse
from django.utils.module_loading import import_string
from rest_framework.renderers import BaseRenderer

from .conf import pleate_settings


class MemoryBroker:
    def __init__(self):
        self._lock = threading.Lock()
        self._subs: dict[str, list[queue.Queue]] = defaultdict(list)

    def publish(self, channel: str, event: dict) -> None:
        with self._lock:
            targets = list(self._subs.get(channel, ()))
        for q in targets:
            q.put(event)

    def listen(self, channel: str, timeout: float) -> Iterator[dict | None]:
        """Yields events, or ``None`` after ``timeout`` seconds of silence."""
        q: queue.Queue = queue.Queue()
        with self._lock:
            self._subs[channel].append(q)
        try:
            while True:
                try:
                    yield q.get(timeout=timeout)
                except queue.Empty:
                    yield None
        finally:
            with self._lock:
                self._subs[channel].remove(q)
                if not self._subs[channel]:
                    del self._subs[channel]


class RedisBroker:
    def __init__(self):
        import redis

        url = pleate_settings.REDIS_URL
        if not url:
            raise RuntimeError('RedisBroker needs PLEATE["REDIS_URL"].')
        self._redis = redis.Redis.from_url(url)

    def publish(self, channel: str, event: dict) -> None:
        self._redis.publish(f"pleate:{channel}", json.dumps(event, default=str))

    def listen(self, channel: str, timeout: float) -> Iterator[dict | None]:
        pubsub = self._redis.pubsub(ignore_subscribe_messages=True)
        pubsub.subscribe(f"pleate:{channel}")
        try:
            while True:
                message = pubsub.get_message(timeout=timeout)
                if message is None:
                    yield None
                    continue
                yield json.loads(message["data"])
        finally:
            pubsub.close()


_broker = None
_broker_path = None


def broker():
    global _broker, _broker_path
    path = pleate_settings.REALTIME["BACKEND"]
    if _broker is None or path != _broker_path:
        _broker = import_string(path)()
        _broker_path = path
    return _broker


def sse_format(event: dict | None, event_id: str | None = None) -> str:
    if event is None:
        return ": ping\n\n"
    lines = []
    if event_id:
        lines.append(f"id: {event_id}")
    if event.get("type"):
        lines.append(f"event: {event['type']}")
    lines.append(f"data: {json.dumps(event.get('data', event), default=str)}")
    return "\n".join(lines) + "\n\n"


def _async_iter(stream: Iterator[str]):
    """Runs a sync generator in a worker thread, one chunk at a time, so ASGI streams it."""
    from asgiref.sync import sync_to_async

    done = object()

    def step():
        try:
            return next(stream)
        except StopIteration:
            return done

    async def gen():
        pending = None
        try:
            while True:
                pending = asyncio.ensure_future(sync_to_async(step, thread_sensitive=False)())
                # Shielded: on disconnect the worker thread keeps running next(stream).
                chunk = await asyncio.shield(pending)
                pending = None
                if chunk is done:
                    return
                yield chunk
        finally:
            if pending is not None:
                # close() while next() runs raises "generator already executing".
                await asyncio.wait([pending])
            close = getattr(stream, "close", None)
            if close:
                await sync_to_async(close, thread_sensitive=False)()

    return gen()


def sse_response(stream: Iterator[str], request=None) -> StreamingHttpResponse:
    """
    Server-Sent Events response. Pass ``request`` so that under ASGI the stream
    is served chunk by chunk (Django would otherwise buffer a sync iterator).
    """
    from django.core.handlers.asgi import ASGIRequest

    raw = getattr(request, "_request", request)
    if isinstance(raw, ASGIRequest):
        stream = _async_iter(stream)
    response = StreamingHttpResponse(stream, content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response


class EventStreamRenderer(BaseRenderer):
    """Lets DRF accept ``Accept: text/event-stream``. Errors are still written as JSON."""

    media_type = "text/event-stream"
    format = "sse"
    charset = "utf-8"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return b"" if data is None else json.dumps(data, default=str).encode()


def channel_stream(channel: str, *, initial: list[dict] | None = None, max_seconds: float | None = None):
    """
    SSE body for a channel. It ends after ``max_seconds`` (default
    ``REALTIME["MAX_STREAM_SECONDS"]``, 0 for never) so workers are not held
    forever; clients reconnect after the ``retry`` delay.
    """
    heartbeat = pleate_settings.REALTIME["HEARTBEAT_SECONDS"]
    if max_seconds is None:
        max_seconds = pleate_settings.REALTIME.get("MAX_STREAM_SECONDS")
    started = time.monotonic()
    yield "retry: 3000\n\n"
    for event in initial or ():
        yield sse_format(event)
    for event in broker().listen(channel, timeout=min(heartbeat, max_seconds) if max_seconds else heartbeat):
        yield sse_format(event)
        if max_seconds and time.monotonic() - started > max_seconds:
            return
