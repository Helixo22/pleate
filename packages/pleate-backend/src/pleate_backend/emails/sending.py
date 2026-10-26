import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template import TemplateDoesNotExist
from django.template.loader import render_to_string
from django.utils import translation

from pleate_backend.core.conf import pleate_settings

logger = logging.getLogger("pleate.emails")


def render_email(template: str, context: dict, language: str | None = None) -> tuple[str, str, str | None]:
    ctx = {"site_name": pleate_settings.SITE_NAME, "frontend_url": pleate_settings.FRONTEND_URL, **context}
    with translation.override(language or settings.LANGUAGE_CODE):
        subject = render_to_string(f"pleate/emails/{template}.subject.txt", ctx).strip()
        text = render_to_string(f"pleate/emails/{template}.txt", ctx)
        try:
            html = render_to_string(f"pleate/emails/{template}.html", ctx)
        except TemplateDoesNotExist:
            html = None
    return " ".join(subject.split()), text, html


def _deliver(template: str, to: list[str], context: dict, language: str | None, reply_to: list[str] | None):
    subject, text, html = render_email(template, context, language)
    message = EmailMultiAlternatives(
        subject=subject, body=text, from_email=settings.DEFAULT_FROM_EMAIL, to=to, reply_to=reply_to
    )
    if html:
        message.attach_alternative(html, "text/html")
    message.send()


@shared_task(
    name="pleate_backend.emails.send",
    autoretry_for=(OSError,),
    retry_backoff=30,
    retry_kwargs={"max_retries": 5},
)
def send_email_task(template, to, context, language=None, reply_to=None):
    _deliver(template, to, context, language, reply_to)


def send_email(
    template: str,
    to: str | list[str],
    context: dict | None = None,
    language: str | None = None,
    reply_to: list[str] | None = None,
) -> None:
    """Queue an email. Context values must be JSON serializable."""
    recipients = [to] if isinstance(to, str) else list(to)
    args = (template, recipients, context or {}, language, reply_to)
    if pleate_settings.EMAILS["ASYNC"]:
        try:
            send_email_task.delay(*args)
            return
        except Exception:  # noqa: BLE001
            logger.warning("task queue unavailable, sending %s inline", template, exc_info=True)
    try:
        _deliver(*args)
    except Exception:  # noqa: BLE001
        # A mail server outage must not fail the user's request.
        logger.exception("could not send email %s", template)
