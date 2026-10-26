# backend-demo

A complete Django project wired with pleate-backend. The docs and the end to end tests
of pleate-client run against it.

```bash
docker compose up -d                       # from the repo root: MongoDB, Redis, Mailpit
cd apps/backend-demo
uv sync
uv run python manage.py migrate
uv run python manage.py seed               # demo users, roles, 120 products, notifications
uv run python manage.py runserver 8000
```

Log in as `ada@plate.dev` / `plate-demo-2026` (staff). Emails land in Mailpit at
http://localhost:8025, the API schema is at http://localhost:8000/api/docs and the
admin at http://localhost:8000/admin.

`demo/catalog` shows how a project resource gets pagination, search, ordering and
filters from the pleate-backend defaults with a plain DRF `ModelViewSet`.

Optional environment variables: `REDIS_URL` (enables Celery, Redis cache and realtime
across processes; run `uv run celery -A demo worker -B -l info`), `ANTHROPIC_API_KEY`
(real AI answers instead of the echo provider), `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`,
`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`, `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`.

End to end tests of the TypeScript client against this server:

```bash
npm run build -w pleate-client
PLEATE_E2E_URL=http://localhost:8000/api node --test packages/pleate-client/e2e/backend.e2e.mjs
```
