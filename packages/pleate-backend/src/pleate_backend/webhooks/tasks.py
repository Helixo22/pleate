import logging

from celery import shared_task
from django.conf import settings

logger = logging.getLogger("pleate.webhooks")


@shared_task(name="pleate_backend.webhooks.tasks.deliver", acks_late=True)
def deliver(delivery_id: str) -> str | None:
    """One attempt for a due delivery. Does nothing if another worker took it."""
    from .services import attempt, claim

    delivery = claim(delivery_id)
    if delivery is None:
        return None
    return attempt(delivery).status


@shared_task(name="pleate_backend.webhooks.tasks.retry_due")
def retry_due() -> int:
    """Runs every minute (CELERY_BEAT_SCHEDULE): sends the deliveries whose retry is due."""
    from .services import due_ids

    ids = due_ids()
    eager = getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False)
    for pk in ids:
        try:
            if eager:
                deliver(str(pk))
            else:
                deliver.delay(str(pk))
        except Exception:  # noqa: BLE001
            logger.exception("could not run delivery %s", pk)
    return len(ids)
