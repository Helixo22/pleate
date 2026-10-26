"""
Sign in with Google, GitHub, Apple or any OpenID Connect provider.

Mounted at ``/api/auth/oauth/``.

Endpoints
---------

``GET /api/auth/oauth/providers``
    Public. The enabled providers: ``[{id, name}]``.
``GET /api/auth/oauth/<provider>/start?next=/path&mode=login|link&remember=1``
    Browser navigation. Stores state, nonce and a PKCE (S256) verifier in the session
    and redirects (302) to the provider. ``next`` must be a path on the frontend
    (``/...``, anything else becomes ``/``). ``mode=link`` needs a signed in user.
    Errors (JSON): ``oauth_unknown_provider`` (404), ``invalid_mode``, ``not_authenticated``.
``GET|POST /api/auth/oauth/<provider>/callback``
    Where the provider sends the browser back. POST (Apple ``form_post``) is answered
    with a 303 to the same URL with GET, so the SameSite=Lax session cookie is sent.
    Always ends with a 302 to ``FRONTEND_PATHS["OAUTH_DONE"]`` with
    ``?status=ok|error|mfa_required&code=<error_code>&next=<next>``.

    - Known identity: signs in. When a login challenge applies (2FA), the pending login
      is stored and ``status=mfa_required``: the frontend then calls
      ``POST /api/auth/mfa/verify``.
    - New identity: the provider must report a verified email. If an account already
      uses that email: ``oauth_email_exists`` (never linked automatically, the user
      signs in and links from the settings). Else a user is created (no password,
      email verified) when ``ALLOW_SIGNUP``.
    - ``mode=link``: attaches the identity to the signed in user.

    Error codes: ``oauth_state_mismatch``, ``oauth_provider_error``, ``oauth_email_unverified``,
    ``oauth_email_exists``, ``oauth_signup_disabled``, ``oauth_already_linked``, ``account_inactive``.
``GET /api/auth/oauth/accounts``
    Linked accounts of the user: ``[{id, provider, email, created_at, last_login_at}]``.
``DELETE /api/auth/oauth/accounts/<id>``
    Unlinks. 204. Error ``last_login_method`` when the user has no password and no
    other linked account.

Settings (``PLEATE["OAUTH"]``)
------------------------------

``PROVIDERS``
    Only the providers listed here are enabled::

        {
            "google": {"client_id": "...", "client_secret": "..."},
            "github": {"client_id": "...", "client_secret": "..."},
            "apple": {"client_id": "com.example.web", "team_id": "...", "key_id": "...",
                      "private_key": "-----BEGIN PRIVATE KEY-----..."},
            "okta": {"type": "oidc", "name": "Okta", "client_id": "...", "client_secret": "...",
                     "discovery_url": "https://example.okta.com/.well-known/openid-configuration",
                     "scopes": ["openid", "email", "profile"]},
        }

    ``type`` picks the provider class (defaults to the key). Every entry accepts ``name``
    and ``scopes``. Add types with ``pleate_backend.oauth.providers.register_provider``.
``ALLOW_SIGNUP``
    Create accounts for new identities (True).
``CALLBACK_BASE_URL``
    Optional origin of the callback URL registered at the provider (for example
    ``https://api.example.com``). Defaults to the origin of the request.

``FRONTEND_PATHS["OAUTH_DONE"]`` is the frontend page that reads the result.

Signals (``pleate_backend.oauth.signals``)
-------------------------------------------

``social_account_linked``, ``social_account_unlinked``: send ``user``, ``request`` and
``social_account``. A signup through OAuth also sends ``accounts.signals.user_signed_up``.

Also: ``oauth_providers`` (linked provider ids) in ``/auth/me`` ``extra``, an ``oauth``
section in the data export, security emails on link and unlink.
"""
