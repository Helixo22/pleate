"""Periodic housekeeping. Each installed app can register a cleanup callable."""

import logging

from celery import shared_task

logger = logging.getLogger("pleate")

_cleanups: list = []


def register_cleanup(func):
    _cleanups.append(func)
    return func


@shared_task(name="pleate_backend.core.tasks.cleanup")
def cleanup():
    for func in _cleanups:
        try:
            func()
        except Exception:  # noqa: BLE001
            logger.exception("cleanup %s failed", func.__name__)
