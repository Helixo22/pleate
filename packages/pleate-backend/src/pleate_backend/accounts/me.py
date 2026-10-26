"""
Other apps add fields to the ``/auth/me`` payload:

    from pleate_backend.accounts.me import register_me_field
    register_me_field("roles", lambda user: [...])
"""

_fields: dict = {}


def register_me_field(name: str, func):
    _fields[name] = func


def extra_fields(user) -> dict:
    return {name: func(user) for name, func in _fields.items()}
