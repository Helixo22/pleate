from celery import shared_task
from django.contrib.auth import get_user_model


@shared_task(name="pleate_backend.notifications.tasks.send_push")
def send_push_task(user_id: str, payload: dict) -> int:
    from .services import send_push

    user = get_user_model().objects.filter(pk=user_id, is_active=True).first()
    return send_push(user, payload) if user else 0
