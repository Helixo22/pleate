"""
Base settings for a project that uses pleate-backend.

    from pleate_backend.settings import *  # noqa: F403

    DATABASES = database("mongodb://localhost:27017/myapp")
    INSTALLED_APPS = [*DJANGO_APPS, *PLEATE_APPS, "myapp"]
    PLEATE = {"SITE_NAME": "Plate", "FRONTEND_URL": "https://plate.app"}

Every value can be overridden after the import. Only the apps listed in
INSTALLED_APPS are mounted by ``pleate_backend.urls``.
"""

from pathlib import Path
from urllib.parse import urlparse


def database(uri: str, name: str | None = None) -> dict:
    """Return a DATABASES dict for a MongoDB connection string."""
    db_name = name or urlparse(uri).path.lstrip("/") or "pleate"
    return {"default": {"ENGINE": "django_mongodb_backend", "HOST": uri, "NAME": db_name}}


# MongoDB primary keys are ObjectIds. The contrib apps get Mongo aware configs
# and ship with migrations generated for ObjectIdAutoField.
DEFAULT_AUTO_FIELD = "django_mongodb_backend.fields.ObjectIdAutoField"

DJANGO_APPS = [
    "pleate_backend.contrib.apps.MongoAdminConfig",
    "pleate_backend.contrib.apps.MongoAuthConfig",
    "pleate_backend.contrib.apps.MongoContentTypesConfig",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django_mongodb_backend",
    "rest_framework",
    "django_filters",
    "drf_spectacular",
]

# Order matters only for dependencies: accounts holds the user model.
PLEATE_APPS = [
    "pleate_backend.core",
    "pleate_backend.accounts",
    "pleate_backend.mfa",
    "pleate_backend.oauth",
    "pleate_backend.rbac",
    "pleate_backend.apikeys",
    "pleate_backend.files",
    "pleate_backend.notifications",
    "pleate_backend.emails",
    "pleate_backend.audit",
    "pleate_backend.ratelimit",
    "pleate_backend.webhooks",
    "pleate_backend.ai_chat",
    "pleate_backend.marketing",
    "pleate_backend.billing",
    "pleate_backend.staff",
]

INSTALLED_APPS = [*DJANGO_APPS, *PLEATE_APPS]

MIGRATION_MODULES = {
    "admin": "pleate_backend.contrib.migrations.admin",
    "auth": "pleate_backend.contrib.migrations.auth",
    "contenttypes": "pleate_backend.contrib.migrations.contenttypes",
}

AUTH_USER_MODEL = "pleate_accounts.User"

AUTHENTICATION_BACKENDS = [
    "pleate_backend.accounts.backends.EmailBackend",
    "pleate_backend.rbac.backends.ObjectPermissionBackend",
]

SESSION_ENGINE = "pleate_backend.accounts.sessions"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 60 * 60 * 24 * 14
SESSION_SAVE_EVERY_REQUEST = False
PASSWORD_RESET_TIMEOUT = 60 * 60
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

MIDDLEWARE = [
    "pleate_backend.core.middleware.RequestIdMiddleware",
    "pleate_backend.ratelimit.middleware.RateLimitHeadersMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "pleate_backend.staff.middleware.BanMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "pleate_backend.core.middleware.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "pleate_backend.audit.middleware.AuditContextMiddleware",
    "pleate_backend.accounts.middleware.SessionActivityMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "pleate_backend.apikeys.authentication.APIKeyAuthentication",
        "pleate_backend.accounts.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "pleate_backend.core.pagination.PagePagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "pleate_backend.core.filters.SearchFilter",
        "pleate_backend.core.filters.OrderingFilter",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "pleate_backend.ratelimit.throttles.UserRateThrottle",
        "pleate_backend.ratelimit.throttles.AnonRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "user": "600/min",
        "anon": "120/min",
        "auth": "10/min",
        "signup": "5/hour",
        "contact": "5/hour",
        "upload": "60/hour",
        "ai": "30/min",
    },
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
    ],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "EXCEPTION_HANDLER": "pleate_backend.core.exceptions.exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "pleate-backend API",
    "DESCRIPTION": "REST API that backs the pleate components.",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": r"/api/",
    "PREPROCESSING_HOOKS": ["pleate_backend.core.schema.drop_slash_twins"],
    "ENUM_NAME_OVERRIDES": {
        "WebhookDeliveryStatusEnum": "pleate_backend.webhooks.models.Delivery.STATUSES",
        "NewsletterStatusEnum": "pleate_backend.marketing.models.NewsletterSubscriber.Status",
        "ContactMessageStatusEnum": "pleate_backend.marketing.models.ContactMessage.Status",
        "SubscriptionStatusEnum": "pleate_backend.billing.models.Subscription.Status",
        "BillingIntervalEnum": "pleate_backend.billing.services.INTERVALS",
    },
}

LANGUAGE_CODE = "en"
LANGUAGES = [("en", "English"), ("it", "Italiano"), ("es", "Español")]
# Every app lives in the pleate_backend package, so the catalogs sit in one place.
LOCALE_PATHS = [Path(__file__).resolve().parent / "locale"]
USE_I18N = True
USE_TZ = True
TIME_ZONE = "UTC"

STATIC_URL = "static/"

CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_BEAT_SCHEDULE = {
    "pleate-cleanup": {"task": "pleate_backend.core.tasks.cleanup", "schedule": 60 * 60},
    "pleate-webhook-retries": {"task": "pleate_backend.webhooks.tasks.retry_due", "schedule": 60},
}

# Django 6.1 mailers. Swap the backend for django-anymail to use Resend, Postmark, SES...
MAILERS = {"default": {"BACKEND": "django.core.mail.backends.smtp.EmailBackend"}}
DEFAULT_FROM_EMAIL = "no-reply@localhost"

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"json": {"()": "pleate_backend.core.logging.JsonFormatter"}},
    "filters": {"request_id": {"()": "pleate_backend.core.logging.RequestIdFilter"}},
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "json", "filters": ["request_id"]}
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}

# pleate specific settings, see pleate_backend.core.conf for every key.
PLEATE: dict = {}


def redis(url: str) -> dict:
    """
    One Redis for cache, rate limits, Celery and realtime events:

        globals().update(redis("redis://localhost:6379/0"))
        PLEATE["REDIS_URL"] = "redis://localhost:6379/0"   # also set it in PLEATE
    """
    return {
        "CACHES": {"default": {"BACKEND": "django.core.cache.backends.redis.RedisCache", "LOCATION": url}},
        "CELERY_BROKER_URL": url,
        "CELERY_RESULT_BACKEND": None,
    }
