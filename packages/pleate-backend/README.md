# pleate-backend

Reusable Django apps on MongoDB that give every [pleate](../pleate) component a ready
backend: authentication, two factor, OAuth, roles, API keys, lists with pagination,
files, notifications, emails, activity log, rate limiting, cache, background tasks,
webhooks, AI chat with streaming, marketing forms and Stripe billing. Everything is a
REST API with an OpenAPI schema, and [pleate-client](../pleate-client) turns it into
typed calls and React hooks.

```
pleate component  ->  pleate-client hook  ->  REST /api  ->  Django app  ->  MongoDB
<DataTable/>          useList()               /api/...       pleate_backend.*   django-mongodb-backend
```

## Why django-mongodb-backend

MongoDB is plugged in through the official [django-mongodb-backend](https://github.com/mongodb/django-mongodb-backend),
so the apps are ordinary Django apps: the ORM, `django.contrib.auth`, the admin, migrations,
DRF serializers and viewsets, django-filter and drf-spectacular all work unchanged. Using
PyMongo directly would mean rewriting each of those by hand, and MongoEngine has weak DRF
support and little activity. Things to know: primary keys are ObjectIds (exposed as strings),
`prefetch_related` is not supported, and transactions need a replica set (the compose file
runs a single node one).

## Install

```bash
uv add "pleate-backend[all]"        # or pip install "pleate-backend[all]"
docker compose up -d                # MongoDB (replica set), Redis, Mailpit
```

```python
# settings.py
from pleate_backend.settings import *  # noqa: F403
from pleate_backend.settings import INSTALLED_APPS, database, redis

SECRET_KEY = "..."
DATABASES = database("mongodb://localhost:27027/myapp?directConnection=true")
INSTALLED_APPS = [*INSTALLED_APPS, "myapp"]
globals().update(redis("redis://localhost:6389/0"))
PLEATE = {"SITE_NAME": "Plate", "FRONTEND_URL": "https://plate.app", "REDIS_URL": "redis://localhost:6389/0"}

# urls.py
urlpatterns = [path("admin/", admin.site.urls), path("api/", include("pleate_backend.urls"))]
```

```bash
python manage.py migrate
python manage.py createsuperuser
celery -A myproject worker -B -l info
```

Remove an app from `INSTALLED_APPS` and its routes disappear. Every option lives in the
`PLEATE` dict, see `src/pleate_backend/core/conf.py` for the defaults.

## Apps

| App | Prefix | What it does |
|---|---|---|
| core | `/api/` | health, CSRF, list conventions, error format, realtime (SSE), cache, request id, JSON logs |
| accounts | `/api/auth/` | signup, login, sessions with devices, password reset, email verification and change, avatar, export, account deletion |
| mfa | `/api/auth/mfa/` | TOTP with encrypted secrets, anti replay, backup codes, login challenge |
| oauth | `/api/auth/oauth/` | Google, GitHub, Apple and any OIDC provider, PKCE, linking |
| rbac | `/api/rbac/` | roles (groups), object permissions, feature flags, DRF permission classes |
| apikeys | `/api/api-keys/` | hashed personal keys with scopes and expiry, Bearer authentication |
| files | `/api/files/` | uploads checked on the bytes, quotas, image re-encoding, GridFS or S3, presigned uploads |
| notifications | `/api/notifications/` | inbox, preferences per channel, email, web push, live stream |
| emails | | localized templates, sent through Celery, any Django mail backend |
| audit | `/api/activity/` | security and model change log with diffs and retention |
| ratelimit | | sliding window throttles with RateLimit headers, fail closed on auth |
| webhooks | `/api/webhooks/` | signed outgoing events with retries, SSRF guard, inbound helpers |
| ai_chat | `/api/ai/` | conversations, streaming answers (SSE), stop, regenerate, quotas, Anthropic and OpenAI compatible providers |
| marketing | `/api/marketing/` | newsletter with double opt in, contact form with honeypot, waitlist with referrals |
| billing | `/api/billing/` | Stripe Checkout, customer portal, subscriptions, idempotent webhook |
| staff | `/api/staff/` | back office API: users, roles, sessions, IP bans, stats |

The OpenAPI schema is served at `/api/schema` and Swagger UI at `/api/docs`.
Messages are translated in English, Italian and Spanish.

## Development

```bash
docker compose up -d mongo redis    # from the repo root
uv sync --all-extras
uv run pytest                       # runs against a real MongoDB
uv run ruff check src tests
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the conventions every app follows, and
[apps/backend-demo](../../apps/backend-demo) for a complete example project.
