"""
Activity log: who did what, when and from where.

Mounted at ``/api/activity/``.

Endpoints
    GET  /activity/              My activity, newest first. CursorPagination
                                 (``cursor``, ``page_size``). Filters: ``action``
                                 (exact), ``action__startswith`` (prefix, e.g. ``auth.``).
    GET  /activity/all           Staff only. Every entry. PagePagination. ``search``
                                 over actor_email, target_repr, action. Filters:
                                 ``action``, ``action__startswith``, ``actor`` (user id),
                                 ``target_type``, ``target_id``, ``created_after``,
                                 ``created_before`` (ISO 8601). ``ordering``: created_at.
    GET  /activity/all/<id>      Staff only. One entry.

    Entry: {id, actor, actor_email, action, target_type, target_id, target_repr,
            changes: {field: [before, after]}, metadata, ip, user_agent,
            request_id, created_at}

Recorded automatically
    auth.login, auth.logout, auth.login_failed (only the attempted email is
    kept), auth.signup, auth.email_verified, auth.password_changed,
    auth.password_reset, auth.email_changed, auth.sessions_revoked,
    account.deleted, and, when those apps are installed, mfa.enabled,
    mfa.disabled, mfa.backup_code_used, oauth.linked, oauth.unlinked.
    The user's entries are part of the account export (section ``activity``).

Helpers
    from pleate_backend.audit import log_activity, register

    log_activity("billing.plan_changed", target=subscription,
                 changes={"plan": ["free", "pro"]}, reason="upgrade")
        actor defaults to the signed in user of the current request, ip,
        user agent and request id come from it too. Never raises.
        Sensitive keys (password, secret, token, key_hash...) are masked.

    register(Project, fields=None, exclude=("password",))
        Logs ``<app_label>.<model>.created|updated|deleted`` with field diffs.

Middleware
    "pleate_backend.audit.middleware.AuditContextMiddleware", right after
    AuthenticationMiddleware. Makes the request available to ``log_activity``.

Settings (``PLEATE["AUDIT"]``)
    RETENTION_DAYS  365    entries expire after this many days (TTL index)
    LOG_READS       False  also log successful GET requests as ``api.read``
"""


def log_activity(action, *, actor=None, target=None, changes=None, request=None, **metadata):
    from .services import log_activity as _log

    return _log(action, actor=actor, target=target, changes=changes, request=request, **metadata)


def register(model, fields=None, exclude=("password",), action_prefix=None):
    from .registry import register as _register

    return _register(model, fields=fields, exclude=exclude, action_prefix=action_prefix)
