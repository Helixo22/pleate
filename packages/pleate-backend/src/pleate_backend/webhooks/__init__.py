"""
Outgoing webhooks with signatures, retries and delivery logs, plus helpers to
receive webhooks safely.

Mounted at ``/api/webhooks/``. Every endpoint is scoped to the signed in user
(session or API key).

Endpoints
    GET    /webhooks/endpoints                    My endpoints. PagePagination, ordering created_at.
    POST   /webhooks/endpoints                    {url, description?, events?: ["*"] | [names], active?}
                                                  201 with the full ``secret`` (only time it is shown).
                                                  Errors: url_not_allowed, unknown_event,
                                                  events_required, endpoint_limit (20 per user).
    GET    /webhooks/endpoints/<id>               Endpoint, ``secret`` masked.
    PATCH  /webhooks/endpoints/<id>               url, description, events, active. Turning an
                                                  endpoint back on resets its failure counter.
    DELETE /webhooks/endpoints/<id>               204.
    POST   /webhooks/endpoints/<id>/rotate-secret {secret}
    POST   /webhooks/endpoints/<id>/test          Sends a ``ping`` now:
                                                  {delivery, status, status_code, duration_ms, error}
    GET    /webhooks/endpoints/<id>/deliveries    PagePagination. Filters ``status``, ``event``.
                                                  ordering created_at.
    GET    /webhooks/deliveries/<id>              Delivery with ``payload`` and ``response_excerpt``.
    POST   /webhooks/deliveries/<id>/redeliver    202, the new delivery (same event id and payload).
                                                  Error endpoint_inactive (409).
    GET    /webhooks/events                       [{name, description}]

Delivery format
    POST <url> with JSON body {"id": "evt_...", "type": "<event>", "created_at": ISO, "data": {...}}
    Headers: Content-Type: application/json, User-Agent: pleate-webhooks/1,
    Pleate-Event, Pleate-Delivery (delivery id),
    Pleate-Signature: t=<unix seconds>,v1=<hex HMAC SHA256 of "<t>.<raw body>" keyed with the secret>.
    Any 2xx is a success. Redirects are not followed. A failure is retried after
    60s, 5m, 30m, 2h, 5h, 10h, then daily, up to MAX_ATTEMPTS. Delivery
    ``status`` is pending, success or failed; a failed delivery with
    ``next_attempt_at`` set will be retried. After 20 consecutive failed
    attempts the endpoint is disabled (``active`` false, ``disabled_at`` set)
    and the owner gets a notification when the notifications app is installed.
    Delivery logs expire after 30 days.

SSRF guard
    URLs must be https and resolve only to public addresses (no loopback,
    private, link local, reserved or multicast). Checked on create, update and
    before every attempt. ``ALLOW_PRIVATE_URLS`` lifts it for development.

Helpers
    from pleate_backend.webhooks import dispatch, register_event

    register_event("invoice.paid", "An invoice was paid.")
    dispatch("invoice.paid", {"id": "..."}, owner=user)   # that user's endpoints
    dispatch("invoice.paid", {"id": "..."})               # endpoints of staff users

    Built in events: ping, user.created, user.deleted (sent to staff endpoints).

    Receiving (pleate_backend.webhooks.inbound):
    verify_signature(secret, raw_body, header, tolerance=300) -> bool
    claim_inbound(provider, event_id, payload) -> bool   True only the first time
    mark_processed(provider, event_id)
    release_inbound(provider, event_id)                  let a retry be handled again

Celery
    pleate_backend.webhooks.tasks.deliver(delivery_id)
    pleate_backend.webhooks.tasks.retry_due()            every minute via CELERY_BEAT_SCHEDULE

Settings (``PLEATE["WEBHOOKS"]``)
    MAX_ATTEMPTS            8
    TIMEOUT_SECONDS         10
    ALLOW_PRIVATE_URLS      False
    EVENTS                  []     extra event names or {"name", "description"} dicts
    RETRY_SCHEDULE          optional list of delays in seconds
    DISABLE_AFTER_FAILURES  optional, default 20
"""


def dispatch(event, data, owner=None, **kwargs):
    from .services import dispatch as _dispatch

    return _dispatch(event, data, owner, **kwargs)


def register_event(name, description=""):
    from .registry import register_event as _register

    return _register(name, description)
