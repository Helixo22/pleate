"""
Personal API keys.

A key looks like ``pl_<prefix>_<secret>``: 8 alphanumeric characters of prefix
(stored and indexed) and 32 random bytes of secret. Only the SHA-256 of the
full key is stored; the key itself is returned once, by the create endpoint.

Clients send ``Authorization: Bearer pl_...``. ``APIKeyAuthentication`` finds the
key by prefix, compares the hash in constant time, and refuses revoked keys and
keys of deactivated users (401 ``invalid_api_key``) and expired keys (401
``api_key_expired``). Keys with only the ``read`` scope may only use GET, HEAD
and OPTIONS (403 ``insufficient_scope``). ``request.auth`` is the ``APIKey``.
``last_used_at`` and ``last_used_ip`` are written at most once a minute. Key
requests skip CSRF, as they carry no cookie.

Endpoints (mounted at ``/api/api-keys/``), session only: a request made with an
API key gets 403 ``api_key_not_allowed``.

    GET    /api/api-keys/        my keys, page list, ?search= (name, prefix),
                                 ?ordering=created_at,name,last_used_at,expires_at
    POST   /api/api-keys/        {name, scopes?: ["read"] | ["read", "write"], expires_in_days?: 1..3650}
                                 -> 201 {id, name, prefix, display, scopes, status, expires_at,
                                         last_used_at, last_used_ip, created_at, revoked_at, key}
    GET    /api/api-keys/<id>    the same without ``key``
    PATCH  /api/api-keys/<id>    {name}
    DELETE /api/api-keys/<id>    204, revokes the key (sets revoked_at)

``status`` is ``active``, ``expired`` or ``revoked``. ``write`` implies ``read``.
A user may hold up to 25 active keys (400 ``api_key_limit``). The data export
lists keys without hashes.

Helpers::

    from pleate_backend.apikeys.services import create_key, find_key
    key, raw = create_key(user, "CI", scopes=["read"], expires_in_days=90)

    from pleate_backend.apikeys.permissions import DenyAPIKey   # session only views

Settings: none. Admin: APIKey (the hash is never shown).
"""
