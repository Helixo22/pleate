"""The request being served, so ``log_activity`` works from deep inside services."""

import contextvars

current_request: contextvars.ContextVar = contextvars.ContextVar("pleate_audit_request", default=None)


def get_current_request():
    return current_request.get()
