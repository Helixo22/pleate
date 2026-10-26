"""
OAuth signals. Both send ``user``, ``request`` (may be None) and ``social_account``.
"""

from django.dispatch import Signal

social_account_linked = Signal()
social_account_unlinked = Signal()
