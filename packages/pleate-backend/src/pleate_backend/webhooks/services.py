import datetime
import json
import logging
import time
import uuid

import httpx
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import F
from django.utils import timezone
from django.utils.translation import gettext as _

from pleate_backend.core.conf import pleate_settings

from . import registry
from .models import Delivery, Endpoint
from .security import UrlNotAllowed, check_url, signature_header

logger = logging.getLogger("pleate.webhooks")

USER_AGENT = "pleate-webhooks/1"
RETRY_SCHEDULE = [60, 300, 1800, 7200, 18000, 36000, 86400]
DISABLE_AFTER_FAILURES = 20
MAX_ENDPOINTS = 20
EXCERPT_BYTES = 1024


def _conf(key, default):
    value = pleate_settings.WEBHOOKS.get(key)
    return default if value is None else value


def retry_delay(attempts: int) -> int:
    """Seconds to wait after the ``attempts``-th failed attempt."""
    schedule = _conf("RETRY_SCHEDULE", RETRY_SCHEDULE)
    return int(schedule[min(max(attempts, 1), len(schedule)) - 1])


def max_attempts() -> int:
    return int(_conf("MAX_ATTEMPTS", 8))


def _lease() -> datetime.timedelta:
    return datetime.timedelta(seconds=int(_conf("TIMEOUT_SECONDS", 10)) + 60)


def envelope(event: str, data, event_id: str | None = None) -> dict:
    body = {
        "id": event_id or f"evt_{uuid.uuid4().hex}",
        "type": event,
        "created_at": timezone.now().isoformat(),
        "data": data,
    }
    # Round trip so dates, ObjectIds and decimals become plain JSON.
    return json.loads(json.dumps(body, cls=DjangoJSONEncoder, default=str))


def encode(payload: dict) -> bytes:
    return json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode()


def matching_endpoints(event: str, owner=None, exclude_owner=None):
    qs = Endpoint.objects.filter(active=True)
    if owner is not None:
        qs = qs.filter(owner_id=owner.pk)
    else:
        staff = list(
            get_user_model().objects.filter(is_staff=True, is_active=True).values_list("pk", flat=True)
        )
        if not staff:
            return []
        qs = qs.filter(owner_id__in=staff)
    if exclude_owner is not None:
        qs = qs.exclude(owner_id=exclude_owner.pk)
    return [endpoint for endpoint in qs if endpoint.wants(event)]


def dispatch(event: str, data, owner=None, *, exclude_owner=None) -> list[Delivery]:
    """
    Sends ``event`` to the active endpoints that subscribe to it: the ones of
    ``owner``, or, when ``owner`` is None, the ones owned by staff users.
    Returns the created deliveries. Sending happens in a Celery task.
    """
    if not registry.is_registered(event):
        raise ValueError(f"Unknown webhook event {event!r}. Register it with register_event().")
    endpoints = matching_endpoints(event, owner, exclude_owner)
    if not endpoints:
        return []
    payload = envelope(event, data)
    now = timezone.now()
    deliveries = [
        Delivery.objects.create(
            endpoint=endpoint, event_id=payload["id"], event=event, payload=payload, next_attempt_at=now
        )
        for endpoint in endpoints
    ]
    for delivery in deliveries:
        enqueue(delivery)
    return deliveries


def enqueue(delivery: Delivery) -> None:
    """Runs the ``deliver`` task. If the queue is down ``retry_due`` picks it up later."""
    from .tasks import deliver

    if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
        deliver(str(delivery.pk))
        return
    try:
        deliver.delay(str(delivery.pk))
    except Exception:  # noqa: BLE001
        logger.warning("task queue unavailable, delivery %s waits for retry_due", delivery.pk, exc_info=True)


def claim(delivery_id) -> Delivery | None:
    """Takes a due delivery for this worker. None if another worker has it or nothing is due."""
    now = timezone.now()
    taken = (
        Delivery.objects.filter(pk=delivery_id, next_attempt_at__lte=now)
        .exclude(status=Delivery.SUCCESS)
        .update(next_attempt_at=now + _lease())
    )
    if not taken:
        return None
    return Delivery.objects.select_related("endpoint").filter(pk=delivery_id).first()


def send(delivery: Delivery) -> dict:
    """
    Makes one HTTP attempt and returns ``{ok, status_code, error, excerpt,
    duration_ms}``. Never raises for network problems.
    """
    endpoint = delivery.endpoint
    body = encode(delivery.payload)
    headers = {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        "Pleate-Event": delivery.event,
        "Pleate-Delivery": str(delivery.pk),
        "Pleate-Signature": signature_header(endpoint.secret, body),
    }
    result = {"ok": False, "status_code": None, "error": "", "excerpt": "", "duration_ms": 0}
    started = time.monotonic()
    try:
        check_url(endpoint.url)
        timeout = float(_conf("TIMEOUT_SECONDS", 10))
        with httpx.Client(timeout=timeout, follow_redirects=False) as client:
            with client.stream("POST", endpoint.url, content=body, headers=headers) as response:
                chunk = b""
                for part in response.iter_bytes():
                    chunk += part
                    if len(chunk) >= EXCERPT_BYTES:
                        break
                result["status_code"] = response.status_code
                result["excerpt"] = chunk[:EXCERPT_BYTES].decode("utf-8", "replace")
                result["ok"] = 200 <= response.status_code < 300
                if not result["ok"]:
                    result["error"] = f"HTTP {response.status_code}"
    except UrlNotAllowed as exc:
        result["error"] = f"url_not_allowed: {exc.message}"
    except httpx.TimeoutException:
        result["error"] = "timeout"
    except httpx.HTTPError as exc:
        result["error"] = f"{exc.__class__.__name__}: {exc}"[:500]
    except Exception as exc:  # noqa: BLE001
        logger.exception("webhook delivery %s crashed", delivery.pk)
        result["error"] = exc.__class__.__name__
    result["duration_ms"] = int((time.monotonic() - started) * 1000)
    return result


def attempt(delivery: Delivery, *, manual: bool = False) -> Delivery:
    """
    Sends ``delivery`` and records the outcome. Failures schedule the next
    retry and count toward disabling the endpoint, unless ``manual`` (test
    pings), which never retries nor counts.
    """
    endpoint = delivery.endpoint
    now = timezone.now()
    if not endpoint.active and not manual:
        delivery.status = Delivery.FAILED
        delivery.last_error = "endpoint_disabled"
        delivery.next_attempt_at = None
        delivery.save(update_fields=["status", "last_error", "next_attempt_at"])
        return delivery

    result = send(delivery)
    delivery.attempts += 1
    delivery.last_status_code = result["status_code"]
    delivery.last_error = result["error"][:500]
    delivery.response_excerpt = result["excerpt"]
    delivery.duration_ms = result["duration_ms"]
    if result["ok"]:
        delivery.status = Delivery.SUCCESS
        delivery.delivered_at = now
        delivery.next_attempt_at = None
    else:
        delivery.status = Delivery.FAILED
        if manual or delivery.attempts >= max_attempts():
            delivery.next_attempt_at = None
        else:
            delivery.next_attempt_at = now + datetime.timedelta(seconds=retry_delay(delivery.attempts))
    delivery.save()
    if not manual:
        _record_outcome(endpoint, result["ok"])
    return delivery


def _record_outcome(endpoint: Endpoint, ok: bool) -> None:
    if ok:
        if endpoint.consecutive_failures:
            Endpoint.objects.filter(pk=endpoint.pk).update(consecutive_failures=0)
            endpoint.consecutive_failures = 0
        return
    Endpoint.objects.filter(pk=endpoint.pk).update(consecutive_failures=F("consecutive_failures") + 1)
    endpoint.refresh_from_db(fields=["consecutive_failures", "active", "disabled_at"])
    limit = int(_conf("DISABLE_AFTER_FAILURES", DISABLE_AFTER_FAILURES))
    if endpoint.active and endpoint.consecutive_failures >= limit:
        disable(endpoint)


def disable(endpoint: Endpoint) -> None:
    """Turns an endpoint off after too many failures and tells its owner."""
    now = timezone.now()
    updated = Endpoint.objects.filter(pk=endpoint.pk, active=True).update(active=False, disabled_at=now)
    endpoint.active, endpoint.disabled_at = False, now
    # Pending retries stop here.
    Delivery.objects.filter(endpoint_id=endpoint.pk, next_attempt_at__isnull=False).exclude(
        status=Delivery.SUCCESS
    ).update(next_attempt_at=None, status=Delivery.FAILED, last_error="endpoint_disabled")
    if not updated:
        return
    logger.warning("webhook endpoint %s disabled after repeated failures", endpoint.pk)
    try:
        from pleate_backend.notifications.services import notify
    except ImportError:
        return
    try:
        notify(
            endpoint.owner,
            "webhook_disabled",
            _("A webhook endpoint was disabled"),
            body=_("%(url)s failed too many times in a row. Fix it, then turn it back on.")
            % {"url": endpoint.url},
            data={"endpoint_id": str(endpoint.pk)},
        )
    except Exception:  # noqa: BLE001
        logger.exception("could not notify about disabled endpoint %s", endpoint.pk)


def redeliver(delivery: Delivery) -> Delivery:
    """A new delivery of the same event (same id and payload) to the same endpoint."""
    copy = Delivery.objects.create(
        endpoint=delivery.endpoint,
        event_id=delivery.event_id,
        event=delivery.event,
        payload=delivery.payload,
        next_attempt_at=timezone.now(),
    )
    enqueue(copy)
    copy.refresh_from_db()
    return copy


def send_test(endpoint: Endpoint) -> Delivery:
    """Sends a ``ping`` to ``endpoint`` right now and returns the recorded delivery."""
    payload = envelope("ping", {"endpoint_id": str(endpoint.pk), "message": "pong"})
    delivery = Delivery.objects.create(
        endpoint=endpoint, event_id=payload["id"], event="ping", payload=payload
    )
    return attempt(delivery, manual=True)


def due_ids(limit: int = 500) -> list:
    return list(
        Delivery.objects.filter(next_attempt_at__lte=timezone.now())
        .exclude(status=Delivery.SUCCESS)
        .order_by("next_attempt_at")
        .values_list("pk", flat=True)[:limit]
    )
