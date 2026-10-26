import { C, Callout, Code, H2, P, Step, Steps, Table } from "@/components/backend/prose";

export default function Installation() {
  return (
    <>
      <P>
        You need Python 3.12 or newer, Node 20 or newer, and Docker for the development services. The steps below create a
        Django project next to a Next.js app; <C>apps/backend-demo</C> in the repository is the finished result if you
        prefer to start from it.
      </P>

      <H2>Backend</H2>
      <Steps>
        <Step title="Start MongoDB, Redis and Mailpit">
          <P>
            The repository ships a <C>docker-compose.yml</C> with a single node MongoDB replica set (transactions need a
            replica set), Redis and Mailpit, which catches every email and shows it at <C>http://localhost:8025</C>.
          </P>
          <Code lang="sh">{`docker compose up -d`}</Code>
          <Table
            head={["Service", "Port", "Used for"]}
            mono={[0, 1]}
            rows={[
              ["mongo", "27027", "Database, sessions, GridFS files"],
              ["redis", "6389", "Cache, rate limits, Celery broker, realtime events"],
              ["mailpit", "1025, 8025", "SMTP server and web inbox"],
            ]}
          />
        </Step>

        <Step title="Install the package">
          <P>
            The base install covers accounts, 2FA, OAuth, roles, API keys, files on GridFS, notifications, emails over
            SMTP, audit, rate limits, webhooks and marketing. Extras add the integrations; <C>all</C> takes every one.
          </P>
          <Code lang="sh">{`uv add "pleate-backend[all]"
# or
pip install "pleate-backend[all]"`}</Code>
          <Table
            head={["Extra", "Adds", "For"]}
            mono={[0, 1]}
            rows={[
              ["s3", "django-storages[s3]", "Files on S3 or compatible storage, presigned uploads"],
              ["stripe", "stripe", "Billing"],
              ["anthropic", "anthropic", "AI chat with Claude models"],
              ["openai", "openai", "AI chat with OpenAI and compatible servers (LiteLLM, vLLM, Ollama)"],
              ["push", "pywebpush", "Web Push notifications"],
              ["anymail", "django-anymail", "Resend, Postmark, SES and other email APIs"],
            ]}
          />
        </Step>

        <Step title="Import the settings">
          <P>
            <C>pleate_backend.settings</C> holds a complete configuration: installed apps, middleware, DRF, sessions,
            password hashing, logging and Celery. Import it, then set what belongs to your deployment. Every value can be
            overridden after the import.
          </P>
          <Code lang="python" title="myproject/settings.py">{`
import os
from pleate_backend.settings import *  # noqa: F403
from pleate_backend.settings import INSTALLED_APPS, database, redis

env = os.environ.get

SECRET_KEY = env("SECRET_KEY", "dev-only-change-me")
DEBUG = env("DEBUG", "1") == "1"
ALLOWED_HOSTS = env("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
CSRF_TRUSTED_ORIGINS = env("CSRF_TRUSTED_ORIGINS", "http://localhost:3000").split(",")
ROOT_URLCONF = "myproject.urls"

DATABASES = database(env("MONGODB_URI", "mongodb://localhost:27027/myapp?directConnection=true"))
INSTALLED_APPS = [*INSTALLED_APPS, "catalog"]   # your own apps after pleate's

REDIS_URL = env("REDIS_URL")                    # redis://localhost:6389/0
if REDIS_URL:
    globals().update(redis(REDIS_URL))          # cache, rate limits and Celery on Redis

MAILERS = {
    "default": {
        "BACKEND": "django.core.mail.backends.smtp.EmailBackend",
        "OPTIONS": {"host": "localhost", "port": 1025},   # Mailpit
    }
}
DEFAULT_FROM_EMAIL = "Plate <hello@plate.test>"

PLEATE = {
    "SITE_NAME": "Plate",
    "FRONTEND_URL": env("FRONTEND_URL", "http://localhost:3000"),
    "REDIS_URL": REDIS_URL,
    "REALTIME": {"BACKEND": "pleate_backend.core.realtime.RedisBroker" if REDIS_URL
                 else "pleate_backend.core.realtime.MemoryBroker"},
    "EMAILS": {"ASYNC": bool(REDIS_URL)},       # send inline when there is no worker
}
`}</Code>
          <P>
            Only the apps you list are mounted. To leave one out, build the list yourself from <C>DJANGO_APPS</C> and{" "}
            <C>PLEATE_APPS</C>:
          </P>
          <Code lang="python">{`
from pleate_backend.settings import DJANGO_APPS, PLEATE_APPS

INSTALLED_APPS = [
    *DJANGO_APPS,
    *[app for app in PLEATE_APPS if app != "pleate_backend.billing"],
    "catalog",
]
`}</Code>
        </Step>

        <Step title="Mount the URLs">
          <P>
            One include mounts every installed app under its prefix, the OpenAPI schema at <C>/api/schema</C> and a
            Swagger UI at <C>/api/docs</C>. Your own resources go under <C>/api</C> too, so the client reaches them with the
            same cookies and conventions.
          </P>
          <Code lang="python" title="myproject/urls.py">{`
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("pleate_backend.urls")),
    path("api/catalog/", include("catalog.urls")),
]
`}</Code>
        </Step>

        <Step title="Create the collections and a staff user">
          <Code lang="sh">{`python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000`}</Code>
          <P>
            Open <C>http://localhost:8000/api/health</C>: it answers{" "}
            <C>{`{"status": "ok", "checks": {"mongodb": "ok", "redis": "ok"}}`}</C> when both services are reachable, and
            503 with <C>degraded</C> otherwise.
          </P>
        </Step>

        <Step title="Run the worker">
          <P>
            Emails, webhook deliveries and housekeeping run on Celery. Add the usual <C>celery.py</C> and start one worker
            with the beat scheduler embedded. Without Redis, set <C>{`PLEATE["EMAILS"]["ASYNC"] = False`}</C> and emails are
            sent inline.
          </P>
          <Code lang="python" title="myproject/celery.py">{`
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")

app = Celery("myproject")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
`}</Code>
          <Code lang="sh">{`celery -A myproject worker -B -l info`}</Code>
        </Step>
      </Steps>

      <H2>Frontend</H2>
      <Steps>
        <Step title="Install the client">
          <P>
            The hooks use TanStack Query, a peer dependency. <C>pleate</C> provides the components the hooks feed.
          </P>
          <Code lang="sh">{`npm install pleate pleate-client @tanstack/react-query`}</Code>
        </Step>

        <Step title="Proxy /api to Django">
          <P>
            Rewrite <C>/api/*</C> to Django so that the browser sees one origin. The session and CSRF cookies are then first
            party, <C>SameSite=Lax</C> works, and there is no CORS to configure.
          </P>
          <Code lang="ts" title="next.config.ts">{`
import type { NextConfig } from "next";

const API = process.env.PLEATE_API_ORIGIN ?? "http://localhost:8000";

const config: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: \`\${API}/api/:path*\` }];
  },
};

export default config;
`}</Code>
          <Callout>
            Keep the frontend origin in Django&apos;s <C>CSRF_TRUSTED_ORIGINS</C> (for example{" "}
            <C>http://localhost:3000</C>) and in <C>{`PLEATE["FRONTEND_URL"]`}</C>, which builds the links sent by email.
          </Callout>
        </Step>

        <Step title="Add the provider">
          <P>
            <C>PleateProvider</C> creates the client and a QueryClient (or takes yours) and makes them available to every
            hook. It is a client component: put it in a providers file and wrap the root layout with it.
          </P>
          <Code lang="tsx" title="app/providers.tsx">{`
"use client";
import { PleateProvider } from "pleate-client/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PleateProvider
      options={{
        baseUrl: "/api",
        onUnauthorized: () => location.assign("/login"),
      }}
    >
      {children}
    </PleateProvider>
  );
}
`}</Code>
          <Code lang="tsx" title="app/layout.tsx">{`
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`}</Code>
        </Step>

        <Step title="Use a hook">
          <Code lang="tsx">{`
"use client";
import { useMe } from "pleate-client/react";

export function Greeting() {
  const { user, isPending } = useMe();
  if (isPending) return null;
  return <p>{user ? \`Hello, \${user.display_name}\` : "Signed out"}</p>;
}
`}</Code>
        </Step>
      </Steps>

      <H2>Types from the schema</H2>
      <P>
        Every response type in pleate-client is generated from the backend&apos;s OpenAPI document, so the client always
        matches the server. Regenerate it after adding fields with <C>npm run schema</C> in <C>packages/pleate-client</C>, or
        point <C>openapi-typescript</C> at <C>/api/schema</C> of your own project to type your resources the same way.
      </P>
    </>
  );
}
