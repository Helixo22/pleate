"""
Transactional emails rendered from templates, localized and sent through the
task queue.

    from pleate_backend.emails import send_email
    send_email("verify_email", to="ada@example.com", context={"url": url}, language="it")

A template is ``pleate/emails/<name>.subject.txt``, ``<name>.txt`` and
optionally ``<name>.html``. Projects override them by placing files with the
same path in their own templates directory. Delivery uses Django's
EMAIL_BACKEND, so SMTP, django-anymail (Resend, Postmark, SES...) or the
console backend all work.
"""

from .sending import render_email, send_email

__all__ = ["send_email", "render_email"]
