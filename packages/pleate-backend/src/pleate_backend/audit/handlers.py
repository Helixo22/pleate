"""Signal listeners that turn account events into activity entries."""

import importlib
import logging

from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed

from pleate_backend.accounts import signals as account_signals
from pleate_backend.core.conf import pleate_settings
from pleate_backend.core.mongo import ensure_ttl_index

from .services import log_activity

logger = logging.getLogger("pleate.audit")

_SIMPLE = (str, int, float, bool)


def _extra(kwargs: dict) -> dict:
    """Plain scalar signal arguments become metadata. Objects are skipped."""
    skip = {"signal", "sender", "user", "request", "credentials"}
    return {k: v for k, v in kwargs.items() if k not in skip and (v is None or isinstance(v, _SIMPLE))}


def _receiver(action: str):
    def receiver(sender, user=None, request=None, **kwargs):
        log_activity(action, actor=user, target=user, request=request, **_extra(kwargs))

    receiver.__name__ = f"audit_{action.replace('.', '_')}"
    return receiver


def on_login(sender, request, user, **kwargs):
    log_activity("auth.login", actor=user, target=user, request=request)


def on_logout(sender, request, user, **kwargs):
    if user is not None and getattr(user, "is_authenticated", False):
        log_activity("auth.logout", actor=user, target=user, request=request)


def on_login_failed(sender, credentials, request=None, **kwargs):
    # Only the attempted identifier is kept, never anything else from the credentials.
    attempted = str(credentials.get("email") or credentials.get("username") or "").strip().lower()[:254]
    target = None
    if attempted:
        from django.contrib.auth import get_user_model

        user = get_user_model().objects.filter(email=attempted).only("pk", "email").first()
        target = user
    log_activity("auth.login_failed", target=target, request=request, actor_email=attempted, email=attempted)


def on_email_changed(sender, user=None, request=None, old_email="", **kwargs):
    log_activity(
        "auth.email_changed",
        actor=user,
        target=user,
        request=request,
        old_email=old_email,
        new_email=getattr(user, "email", ""),
    )


ACCOUNT_ACTIONS = {
    "user_signed_up": "auth.signup",
    "email_verified": "auth.email_verified",
    "password_changed": "auth.password_changed",
    "password_reset": "auth.password_reset",
    "sessions_revoked": "auth.sessions_revoked",
    "account_deleted": "account.deleted",
}

# Optional apps: connected only when importable.
OPTIONAL_ACTIONS = {
    "pleate_backend.mfa.signals": {
        "mfa_enabled": "mfa.enabled",
        "mfa_disabled": "mfa.disabled",
        "backup_code_used": "mfa.backup_code_used",
        "backup_codes_regenerated": "mfa.backup_codes_regenerated",
    },
    "pleate_backend.oauth.signals": {
        "social_account_linked": "oauth.linked",
        "social_account_unlinked": "oauth.unlinked",
    },
}

_receivers: list = []


def collect_activity(sender, user, **kwargs):
    from .models import ActivityLog
    from .serializers import ActivityLogSerializer

    rows = ActivityLog.objects.filter(actor=user).order_by("-created_at")
    return "activity", [dict(row) for row in ActivityLogSerializer(rows, many=True).data]


def connect():
    user_logged_in.connect(on_login, dispatch_uid="pleate_audit_login")
    user_logged_out.connect(on_logout, dispatch_uid="pleate_audit_logout")
    user_login_failed.connect(on_login_failed, dispatch_uid="pleate_audit_login_failed")
    account_signals.email_changed.connect(on_email_changed, dispatch_uid="pleate_audit_email_changed")
    account_signals.collect_user_data.connect(collect_activity, dispatch_uid="pleate_audit_export")
    for name, action in ACCOUNT_ACTIONS.items():
        _connect(getattr(account_signals, name), action)
    for module_name, mapping in OPTIONAL_ACTIONS.items():
        try:
            module = importlib.import_module(module_name)
        except ImportError:
            continue
        for name, action in mapping.items():
            signal = getattr(module, name, None)
            if signal is not None:
                _connect(signal, action)


def _connect(signal, action):
    receiver = _receiver(action)
    _receivers.append(receiver)
    signal.connect(receiver, weak=False, dispatch_uid=f"pleate_audit_{action}")


def ensure_indexes(**kwargs):
    from .models import ActivityLog

    days = pleate_settings.AUDIT["RETENTION_DAYS"]
    if days:
        ensure_ttl_index(ActivityLog, "created_at", int(days) * 24 * 60 * 60)
