"""
Settings of the demo project. Everything pleate related comes from
``pleate_backend.settings``; this file only sets what is specific to a
deployment. Every value can be changed with environment variables.
"""

import os
from pathlib import Path

from pleate_backend.settings import *  # noqa: F403
from pleate_backend.settings import INSTALLED_APPS, database, redis

BASE_DIR = Path(__file__).resolve().parent.parent
env = os.environ.get

SECRET_KEY = env("SECRET_KEY", "dev-only-secret-key-change-me-0123456789abcdef")
DEBUG = env("DEBUG", "1") == "1"
ALLOWED_HOSTS = env("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
CSRF_TRUSTED_ORIGINS = env("CSRF_TRUSTED_ORIGINS", "http://localhost:3000").split(",")

ROOT_URLCONF = "demo.urls"
WSGI_APPLICATION = "demo.wsgi.application"
ASGI_APPLICATION = "demo.asgi.application"

DATABASES = database(env("MONGODB_URI", "mongodb://localhost:27027/pleate_demo?directConnection=true"))

INSTALLED_APPS = [*INSTALLED_APPS, "demo.catalog"]

REDIS_URL = env("REDIS_URL")
if REDIS_URL:
    globals().update(redis(REDIS_URL))

MAILERS = {
    "default": {
        "BACKEND": "django.core.mail.backends.smtp.EmailBackend",
        "OPTIONS": {"host": env("SMTP_HOST", "localhost"), "port": int(env("SMTP_PORT", "1025"))},
    }
}
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", "Plate <hello@plate.test>")

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

AI_PROVIDER = (
    {
        "PROVIDER": "pleate_backend.ai_chat.providers.AnthropicProvider",
        "PROVIDER_OPTIONS": {"api_key": env("ANTHROPIC_API_KEY")},
        "MODELS": [
            {"id": "claude-sonnet-5-5", "name": "Claude Sonnet 5.5", "description": "Fast and capable."},
            {"id": "claude-opus-5-5", "name": "Claude Opus 5.5", "description": "Most capable."},
            {"id": "claude-haiku-4-5-20251001", "name": "Claude Haiku 4.5", "description": "Fastest."},
        ],
        "DEFAULT_MODEL": "claude-sonnet-5-5",
    }
    if env("ANTHROPIC_API_KEY")
    else {}
)

PLEATE = {
    "SITE_NAME": "Plate",
    "FRONTEND_URL": env("FRONTEND_URL", "http://localhost:3000"),
    "REDIS_URL": REDIS_URL,
    "REALTIME": {
        "BACKEND": "pleate_backend.core.realtime.RedisBroker"
        if REDIS_URL
        else "pleate_backend.core.realtime.MemoryBroker"
    },
    "EMAILS": {"ASYNC": bool(REDIS_URL)},
    "OAUTH": {
        "PROVIDERS": {
            name: {
                "client_id": env(f"{name.upper()}_CLIENT_ID"),
                "client_secret": env(f"{name.upper()}_CLIENT_SECRET"),
            }
            for name in ("google", "github")
            if env(f"{name.upper()}_CLIENT_ID")
        }
    },
    "AI": {
        **AI_PROVIDER,
        "SUGGESTIONS": [
            "Summarize the latest orders",
            "Write a welcome email for new customers",
            "Which products are low on stock?",
        ],
    },
    "BILLING": {
        "STRIPE_SECRET_KEY": env("STRIPE_SECRET_KEY"),
        "STRIPE_WEBHOOK_SECRET": env("STRIPE_WEBHOOK_SECRET"),
        "PLANS": [
            {
                "id": "free",
                "name": "Free",
                "description": "For trying things out.",
                "features": ["1 project", "Community support"],
                "prices": {"month": {"amount": 0}, "year": {"amount": 0}},
            },
            {
                "id": "pro",
                "name": "Pro",
                "description": "For growing teams.",
                "features": ["Unlimited projects", "Priority support", "Webhooks"],
                "highlighted": True,
                "prices": {
                    "month": {"price_id": env("STRIPE_PRICE_PRO_MONTH", "price_pro_month"), "amount": 1200},
                    "year": {"price_id": env("STRIPE_PRICE_PRO_YEAR", "price_pro_year"), "amount": 12000},
                },
            },
        ],
    },
    "MARKETING": {"CONTACT_RECIPIENTS": ["team@plate.test"]},
}

STATIC_ROOT = BASE_DIR / "static"
