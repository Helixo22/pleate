"""
Access to the ``PLEATE`` settings dict with defaults.

    from pleate_backend.core.conf import pleate_settings
    pleate_settings.SITE_NAME
    pleate_settings.get("AUTH")["SIGNUP_ENABLED"]

Nested dicts are merged one level deep with the defaults, so a project can
override a single key of a section.
"""

from django.conf import settings
from django.core.signals import setting_changed

DEFAULTS: dict = {
    "SITE_NAME": "pleate",
    "FRONTEND_URL": "http://localhost:3000",
    # Paths on the frontend that receive the links sent by email.
    "FRONTEND_PATHS": {
        "VERIFY_EMAIL": "/verify-email?token={token}",
        "RESET_PASSWORD": "/reset-password?token={token}",
        "CONFIRM_EMAIL_CHANGE": "/confirm-email?token={token}",
        "NEWSLETTER_CONFIRM": "/newsletter/confirm?token={token}",
        "NEWSLETTER_UNSUBSCRIBE": "/newsletter/unsubscribe?token={token}",
        "OAUTH_DONE": "/auth/oauth/done",
        "BILLING_SUCCESS": "/billing/success",
        "BILLING_CANCEL": "/pricing",
        "BILLING_PORTAL_RETURN": "/settings/billing",
        "WAITLIST_INVITE": "/signup?invite={code}&email={email}",
        "NOTIFICATIONS": "/notifications",
    },
    # Proxies whose X-Forwarded-For header is trusted. CIDR notation.
    "TRUSTED_PROXIES": ["127.0.0.1/32", "::1/128"],
    "REDIS_URL": None,
    "AUTH": {
        "SIGNUP_ENABLED": True,
        "REQUIRE_EMAIL_VERIFICATION": False,
        "LOGIN_MAX_ATTEMPTS": 5,
        "LOGIN_LOCKOUT_SECONDS": 15 * 60,
        "LOGIN_IP_MAX_ATTEMPTS": 30,
        "REMEMBER_ME_AGE": 60 * 60 * 24 * 365,
        "EMAIL_TOKEN_MAX_AGE": 60 * 60 * 24 * 3,
        "DELETE_ACCOUNT_REQUIRES_PASSWORD": True,
    },
    "MFA": {
        "ISSUER": None,
        "BACKUP_CODES": 10,
        "PENDING_LOGIN_SECONDS": 300,
        "ENCRYPTION_KEY": None,
    },
    "OAUTH": {
        "PROVIDERS": {},
        "ALLOW_SIGNUP": True,
    },
    "FILES": {
        "STORAGE": "pleate_backend.files.storage.GridFSStorage",
        "MAX_SIZE": 25 * 1024 * 1024,
        "ALLOWED_TYPES": [
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif",
            "application/pdf",
            "text/plain",
            "text/csv",
            "application/zip",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        "USER_QUOTA": 500 * 1024 * 1024,
        "IMAGE_MAX_DIMENSION": 2400,
        "AVATAR_MAX_SIZE": 2 * 1024 * 1024,
        "AVATAR_DIMENSION": 512,
        "PRESIGNED_UPLOADS": False,
    },
    "NOTIFICATIONS": {
        "CHANNELS": ["in_app", "email", "push"],
        "DEFAULT_CHANNELS": ["in_app"],
        "RETENTION_DAYS": 90,
        "VAPID_PUBLIC_KEY": None,
        "VAPID_PRIVATE_KEY": None,
        "VAPID_SUBJECT": "mailto:admin@localhost",
    },
    "EMAILS": {
        "ASYNC": True,
    },
    "AUDIT": {
        "RETENTION_DAYS": 365,
        "LOG_READS": False,
    },
    "REALTIME": {
        "BACKEND": "pleate_backend.core.realtime.MemoryBroker",
        "HEARTBEAT_SECONDS": 20,
    },
    "WEBHOOKS": {
        "MAX_ATTEMPTS": 8,
        "TIMEOUT_SECONDS": 10,
        "ALLOW_PRIVATE_URLS": False,
        "EVENTS": [],
    },
    "AI": {
        "PROVIDER": "pleate_backend.ai_chat.providers.EchoProvider",
        "PROVIDER_OPTIONS": {},
        "MODELS": [
            {"id": "echo", "name": "Echo", "description": "Repeats your message. For development."},
        ],
        "DEFAULT_MODEL": "echo",
        "SYSTEM_PROMPT": "You are a helpful assistant.",
        "DAILY_TOKEN_LIMIT": 200_000,
        "MAX_HISTORY_MESSAGES": 40,
        "SUGGESTIONS": [],
        "MAX_MESSAGE_CHARS": 32_000,
        "MAX_ATTACHMENTS": 10,
    },
    "MARKETING": {
        "CONTACT_RECIPIENTS": [],
        "NEWSLETTER_DOUBLE_OPT_IN": True,
        "WAITLIST_REFERRAL_BONUS": 5,
    },
    "BILLING": {
        "STRIPE_SECRET_KEY": None,
        "STRIPE_WEBHOOK_SECRET": None,
        "CURRENCY": "usd",
        # [{"id": "pro", "name": "Pro", "prices": {"month": "price_x", "year": "price_y"}, ...}]
        "PLANS": [],
        "TRIAL_DAYS": 0,
    },
}


class PleateSettings:
    def __init__(self):
        self._cache: dict = {}

    def get(self, key: str):
        if key in self._cache:
            return self._cache[key]
        user = getattr(settings, "PLEATE", {}) or {}
        default = DEFAULTS.get(key)
        if isinstance(default, dict):
            value = {**default, **(user.get(key) or {})}
        else:
            value = user.get(key, default)
        self._cache[key] = value
        return value

    def __getattr__(self, key: str):
        if key.startswith("_"):
            raise AttributeError(key)
        return self.get(key)

    def reload(self):
        self._cache = {}


pleate_settings = PleateSettings()


def _reload(*, setting, **kwargs):
    if setting == "PLEATE":
        pleate_settings.reload()


setting_changed.connect(_reload)


def frontend_url(path_key: str, **params) -> str:
    path = pleate_settings.FRONTEND_PATHS[path_key].format(**params)
    return pleate_settings.FRONTEND_URL.rstrip("/") + path
