"""
Helpers for receiving webhooks.

    from pleate_backend.webhooks.inbound import verify_signature, claim_inbound, mark_processed

    if not verify_signature(secret, request.body, request.headers.get("Pleate-Signature", "")):
        return 400
    if not claim_inbound("pleate", event["id"], event):
        return 200          # already seen, do nothing
    handle(event)
    mark_processed("pleate", event["id"])

If handling fails and the sender should retry, call ``release_inbound``.
"""

import hmac
import time

from django.db import IntegrityError
from django.utils import timezone

from .security import sign


def parse_signature_header(header: str) -> tuple[int | None, list[str]]:
    timestamp, signatures = None, []
    for part in (header or "").split(","):
        key, _sep, value = part.strip().partition("=")
        if key == "t":
            try:
                timestamp = int(value)
            except ValueError:
                return None, []
        elif key == "v1" and value:
            signatures.append(value)
    return timestamp, signatures


def verify_signature(secret: str, raw_body: bytes, header: str, tolerance: int = 300) -> bool:
    """
    Checks a ``Pleate-Signature`` header (``t=<unix>,v1=<hex>``, several v1
    allowed) in constant time. Rejects timestamps more than ``tolerance``
    seconds away from now (replays).
    """
    if not secret or not header:
        return False
    timestamp, signatures = parse_signature_header(header)
    if timestamp is None or not signatures:
        return False
    if tolerance and abs(time.time() - timestamp) > tolerance:
        return False
    expected = sign(secret, timestamp, raw_body if isinstance(raw_body, bytes) else str(raw_body).encode())
    ok = False
    for candidate in signatures:
        # No early exit: every candidate is compared.
        ok = hmac.compare_digest(expected, candidate) or ok
    return ok


def claim_inbound(provider: str, event_id: str, payload=None) -> bool:
    """True the first time ``(provider, event_id)`` is seen, False afterwards. Race safe."""
    from .models import InboundEvent

    try:
        InboundEvent.objects.create(provider=provider, event_id=str(event_id), payload=payload or {})
    except IntegrityError:
        return False
    return True


def mark_processed(provider: str, event_id: str) -> None:
    from .models import InboundEvent

    InboundEvent.objects.filter(provider=provider, event_id=str(event_id)).update(processed_at=timezone.now())


def release_inbound(provider: str, event_id: str) -> None:
    """Forget an unprocessed claim so a retry from the sender is handled again."""
    from .models import InboundEvent

    InboundEvent.objects.filter(provider=provider, event_id=str(event_id), processed_at=None).delete()
