"""
Two factor signals. All send ``user`` and ``request`` (may be None).
"""

from django.dispatch import Signal

mfa_enabled = Signal()
mfa_disabled = Signal()
backup_code_used = Signal()
