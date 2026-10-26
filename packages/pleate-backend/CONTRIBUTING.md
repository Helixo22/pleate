# Contributing to pleate-backend

## Layout

```
src/pleate_backend/
  settings.py        base settings, projects do `from pleate_backend.settings import *`
  urls.py            mounts every installed app under its prefix (see PREFIXES)
  contrib/           Mongo aware configs and migrations for admin, auth, contenttypes
  core/              conf, errors, pagination, filters, csrf, realtime (SSE), utils, tasks
  accounts/          user model, sessions, signup/login, reset, verify, profile, export/delete
  <app>/             one reusable Django app per feature
tests/               pytest, one file per app (test_<app>.py), real MongoDB
```

## Running

```
docker compose up -d mongo redis      # from the repo root (Mongo is a single node replica set)
uv run pytest                         # all tests
PLEATE_TEST_DB=pleate_files uv run pytest tests/test_files.py   # isolated database
uv run python -m django makemigrations pleate_<app> --settings=tests.settings --pythonpath=.
```

Tests default to `mongodb://localhost:27027/?directConnection=true`. MongoDB has no
rollback for Django's TestCase, so every test flushes the database: keep tests
independent.

## Conventions

- **App label** is `pleate_<name>`, so collections are `pleate_<name>_<model>`.
- **Primary keys** are ObjectIds. Expose them as strings (`serializers.CharField(read_only=True)`).
  URL params use `<str:pk>`.
- **Settings** live in the `PLEATE` dict, read through
  `from pleate_backend.core.conf import pleate_settings` (`pleate_settings.FILES["MAX_SIZE"]`).
  Defaults are in `core/conf.py`.
- **Errors**: raise `ApiError("stable_code", _("Human message."), status)`. Validation errors
  use `serializers.ValidationError(..., code="stable_code")`. Every error body is
  `{"error": {"status", "code", "message", "fields"?}}`. Codes are snake_case and never change.
- **Lists** use the default `PagePagination` (`page`, `page_size`, response has `count` and
  `page_count`) or `CursorPagination` for feeds. Declare `search_fields`, `ordering_fields`,
  `ordering` and `filterset_fields` on the view. Query params: `search`, `ordering`
  (comma separated, `-` for descending), field filters.
- **Auth**: default permission is `IsAuthenticated`. Unsafe endpoints that work without a
  user (login like flows) mix in `core.csrf.CsrfProtectedMixin`.
- **Rate limits**: `throttle_classes = [ScopedRateThrottle]` + `throttle_scope = "<scope>"`,
  scopes are in `REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]`. For security counters use
  `ratelimit.limits.hit/peek/reset` with `fail_closed=True`.
- **Emails**: `from pleate_backend.emails import send_email`, templates in
  `<app>/templates/pleate/emails/<name>.subject.txt|.txt|.html`, extend `pleate/emails/base.html`.
- **Background work**: Celery `@shared_task(name="pleate_backend.<app>.<task>")`. Housekeeping
  registers with `core.tasks.register_cleanup`.
- **Realtime**: `core.realtime.broker().publish(channel, {"type": ..., "data": ...})` and
  `channel_stream(channel)` + `sse_response` for SSE endpoints.
- **TTL**: `core.mongo.ensure_ttl_index(Model, "field", seconds)` from a `post_migrate` handler.
- **Account hooks**: listen to `accounts.signals` (signup, password change, deletion...).
  Contribute to `/auth/me` with `accounts.me.register_me_field`, and to the data export with
  the `collect_user_data` signal. Deleting a user cascades through FKs: clean external
  blobs (files in storage) in a `pre_delete` handler.
- **OpenAPI**: annotate views with `extend_schema` (request, responses, `tags=["<app>"]`) so the
  generated TypeScript client has precise types. `uv run python -m django spectacular
  --settings=tests.settings --pythonpath=. --validate` must not report errors for your app.
- **i18n**: every human string goes through `gettext` / `gettext_lazy`. English source strings.
- **Copy**: no em dashes, no `--` in user visible text.
- Every app has a docstring in `<app>/__init__.py` that lists its endpoints and settings: the
  docs site is written from it.
