"""
    from pleate_backend.billing.signals import subscription_changed

Sent when a subscription is created or its status changes, with ``user``,
``subscription`` and ``previous_status`` (None for a new subscription).
"""

from django.dispatch import Signal

subscription_changed = Signal()
