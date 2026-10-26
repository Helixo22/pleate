"""
Notifications: in app inbox with realtime updates, email and Web Push, routed by
per user preferences.

Endpoints (mounted under ``/api/notifications/``), signed in users only:

- ``GET    /notifications``                    ``CursorPagination``, newest first
  (``cursor``, ``page_size``). Filters ``unread=true|false`` and ``kind``.
- ``DELETE /notifications``                    deletes every read notification, ``{"count"}``.
- ``GET    /notifications/unread-count``       ``{"count"}``.
- ``POST   /notifications/<id>/read``          marks read, returns the notification.
- ``POST   /notifications/<id>/unread``        marks unread, returns the notification.
- ``POST   /notifications/read-all``           ``{"count"}`` of notifications marked read.
- ``DELETE /notifications/<id>``               deletes one.
- ``GET    /notifications/preferences``        ``{"channels": {"*": [...], "<kind>": [...]},
  "available_channels": [...]}``.
- ``PUT    /notifications/preferences``        ``{"channels": {...}}``, replaces the routing.
  Unknown channels fail with ``invalid_channel``.
- ``GET    /notifications/stream``             Server-Sent Events. Sends ``unread_count``
  (``{"count"}``) on connect, then ``notification`` (a Notification) and ``unread_count``
  whenever something changes. Use ``EventSource`` with credentials.
- ``GET    /notifications/push/public-key``    ``{"key"}``: VAPID public key for
  ``pushManager.subscribe`` (null when push is not configured).
- ``POST   /notifications/push/subscriptions`` ``{"endpoint", "keys": {"p256dh", "auth"}}``,
  the JSON of a ``PushSubscription``.
- ``DELETE /notifications/push/subscriptions`` ``{"endpoint"}``.

Sending, from any app:

    from pleate_backend.notifications.services import notify
    notify(user, "billing.payment_failed", "Payment failed", body="...", url="/billing",
           data={"invoice": "in_1"}, channels=None)

``notify`` returns the in app ``Notification`` (or None when ``in_app`` is not used).
Channels are ``channels`` when given, else the user's preference for ``kind``, else their
``"*"`` preference, else ``DEFAULT_CHANNELS``:

- ``in_app``: stored, and published on the realtime channel ``user:<id>`` as
  ``{"type": "notification", "data": ...}`` followed by ``{"type": "unread_count", ...}``.
- ``email``: the ``notification`` email template (``title``, ``body``, ``action_url``,
  ``action_label``) in the user's locale. Relative URLs are joined to ``FRONTEND_URL``.
- ``push``: Web Push through pywebpush (``pip install pleate-backend[push]``) with the
  VAPID keys. Skipped when keys are not set. Subscriptions answering 404 or 410 are deleted.

Settings, ``PLEATE["NOTIFICATIONS"]``:

- ``CHANNELS`` (``["in_app", "email", "push"]``), ``DEFAULT_CHANNELS`` (``["in_app"]``).
- ``RETENTION_DAYS`` (90): MongoDB TTL index on ``created_at``, applied on migrate.
- ``VAPID_PUBLIC_KEY``, ``VAPID_PRIVATE_KEY``, ``VAPID_SUBJECT`` (``mailto:...``).
- Realtime transport: ``PLEATE["REALTIME"]["BACKEND"]`` (use ``RedisBroker`` with several
  processes) and ``HEARTBEAT_SECONDS``.

Notifications, preferences and push subscriptions are part of the account data export.
"""
