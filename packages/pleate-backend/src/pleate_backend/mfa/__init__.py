"""
Two factor authentication with TOTP authenticator apps and single use backup codes.

Mounted at ``/api/auth/mfa/``. Every endpoint needs a signed in user, except ``verify``.

Endpoints
---------

``GET  /api/auth/mfa/``
    ``{enabled, confirmed_at, backup_codes_remaining}``.
``POST /api/auth/mfa/setup``
    Starts the enrollment (or restarts an unfinished one). Returns
    ``{secret, otpauth_url, qr_svg}``. Error ``mfa_already_enabled`` (409).
``POST /api/auth/mfa/confirm`` ``{code}``
    Checks the first code from the app and turns 2FA on. Returns
    ``{backup_codes: ["abcd-efgh", ...]}``, shown only once.
    Errors ``mfa_setup_required``, ``mfa_already_enabled``, ``invalid_code``.
``POST /api/auth/mfa/disable`` ``{password, code}``
    ``password`` only when the user has one, ``code`` is a TOTP or a backup code. 204.
    Errors ``mfa_not_enabled``, ``wrong_password``, ``invalid_code``.
``POST /api/auth/mfa/backup-codes`` ``{code}``
    Replaces every backup code. Returns ``{backup_codes}``.
``POST /api/auth/mfa/verify`` ``{code}`` or ``{backup_code}``
    Second step of a login. ``POST /api/auth/login`` (or an OAuth callback) answers
    ``{"mfa_required": true, "methods": ["totp", "backup_code"]}`` and keeps a pending
    login in the session for ``PENDING_LOGIN_SECONDS``. Returns ``{user, mfa_required: false}``.
    Errors ``mfa_pending_expired`` (no pending login, expired, or 5 wrong codes) and
    ``invalid_code`` (with ``attempts_left``). CSRF protected, throttle scope ``auth``.

Settings (``PLEATE["MFA"]``)
----------------------------

``ISSUER``
    Name shown in authenticator apps. Defaults to ``SITE_NAME``.
``BACKUP_CODES``
    How many backup codes are generated (10).
``PENDING_LOGIN_SECONDS``
    Time to type the code after the password (300).
``ENCRYPTION_KEY``
    Key that encrypts TOTP secrets at rest (Fernet). A Fernet key, or any string that is
    stretched with HKDF. Defaults to a key derived from ``SECRET_KEY`` (secrets encrypted
    with a key derived from ``SECRET_KEY_FALLBACKS`` can still be read).

Signals (``pleate_backend.mfa.signals``)
-----------------------------------------

``mfa_enabled``, ``mfa_disabled``, ``backup_code_used``: all send ``user`` and ``request``.

Also: ``mfa_enabled`` in ``/auth/me`` ``extra``, a ``mfa`` section in the data export
(state and dates only, never secrets), security emails on enable and disable.
"""
