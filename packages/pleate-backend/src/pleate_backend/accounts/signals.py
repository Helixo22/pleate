"""
Account lifecycle signals. Other apps (audit, notifications, webhooks) listen
to them; projects can too.

All send ``user`` and ``request`` (may be None).
"""

from django.dispatch import Signal

user_signed_up = Signal()
email_verified = Signal()
password_changed = Signal()
password_reset = Signal()
email_changed = Signal()  # also sends old_email
sessions_revoked = Signal()  # also sends count
account_deleted = Signal()  # sent before deletion, also sends email

# Collects the user's data for the export endpoint. Receivers return
# ``(section_name, json_serializable_data)``.
collect_user_data = Signal()
