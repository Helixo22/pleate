import Link from "next/link";
import { C, Callout, Code, H2, LI, P, Table, UL } from "@/components/backend/prose";
import { BACKEND_PAGES } from "@/lib/backend-pages";

const LAYERS = [
  { name: "pleate component", detail: "<LoginForm>, <DataTable>, <Composer>…", where: "Your Next.js app" },
  { name: "Hook", detail: "useLogin(), useList(), useChat()…", where: "pleate-client/react" },
  { name: "Client", detail: "createPleateClient(): CSRF, errors, SSE, uploads", where: "pleate-client" },
  { name: "REST API", detail: "/api/auth, /api/files, /api/ai… JSON and SSE", where: "HTTP, same origin" },
  { name: "Django app", detail: "pleate_backend.accounts, .files, .ai_chat…", where: "pleate-backend" },
  { name: "MongoDB", detail: "django-mongodb-backend, GridFS for files", where: "Replica set" },
];

function Architecture() {
  return (
    <figure className="my-8" aria-label="Request path from a component to the database">
      <ol className="grid gap-0">
        {LAYERS.map((layer, i) => (
          <li key={layer.name} className="flex flex-col items-center">
            <div
              className={
                "grid w-full max-w-xl gap-1 rounded-2xl px-5 py-3.5 shadow-xs sm:grid-cols-[11rem_1fr] sm:items-center sm:gap-4 " +
                (i < 3 ? "bg-surface" : "bg-accent-soft")
              }
            >
              <div>
                <p className="text-headline">{layer.name}</p>
                <p className="text-caption1 text-fg-muted">{layer.where}</p>
              </div>
              <p className="font-mono text-footnote break-words text-fg-muted">{layer.detail}</p>
            </div>
            {i < LAYERS.length - 1 && (
              <span aria-hidden className="flex h-7 flex-col items-center">
                <span className="w-px flex-1 bg-separator" />
                <span className="size-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-fg-subtle" />
              </span>
            )}
          </li>
        ))}
      </ol>
      <figcaption className="mt-4 text-center text-footnote text-fg-muted">
        Browser layers on a white card, server layers tinted. Everything above the REST API runs in the browser.
      </figcaption>
    </figure>
  );
}

export default function Overview() {
  return (
    <>
      <P>
        The components in this library are only half of a product: a <C>LoginForm</C> needs an account system, a{" "}
        <C>DataTable</C> needs a paginated endpoint, a <C>Composer</C> needs a model that streams. The Backend section
        documents three packages that provide that other half, designed together so that the props a component takes
        are exactly what the API returns.
      </P>
      <Table
        head={["Package", "Language", "What it is"]}
        mono={[0]}
        rows={[
          ["pleate-backend", "Python", "Reusable Django 6.1 apps with Django REST Framework and an OpenAPI schema, on MongoDB."],
          ["pleate-client", "TypeScript", "A typed fetch client, Server-Sent Events, list helpers and React hooks that return props for pleate components."],
          ["apps/backend-demo", "Python", "An example Django project wired with every app, plus a Product resource that shows how to add your own."],
        ]}
      />

      <H2>How a request travels</H2>
      <P>
        Take the login screen. <C>LoginForm</C> calls <C>onSubmit</C>, which comes from <C>useLogin().loginFormProps</C>.
        The hook calls <C>client.auth.login()</C>, which fetches a CSRF cookie if needed and posts JSON to{" "}
        <C>/api/auth/login</C>. Django checks the rate limits, the password and the 2FA state, writes the session to MongoDB
        and answers either the user or <C>{"{mfa_required: true}"}</C>. The hook flips to the second step and the page
        renders <C>TwoFactorForm</C> with <C>twoFactorFormProps</C>. Errors come back in one format, so the same hook can
        put field messages under the right inputs.
      </P>
      <Architecture />
      <Code lang="tsx" title="app/login/page.tsx">{`
"use client";
import { LoginForm } from "pleate/auth/login-form";
import { TwoFactorForm } from "pleate/auth/two-factor-form";
import { useLogin } from "pleate-client/react";

export default function Login() {
  const login = useLogin({ onSuccess: () => location.assign("/") });
  return login.mfaRequired
    ? <TwoFactorForm {...login.twoFactorFormProps} />
    : <LoginForm {...login.loginFormProps} />;
}
`}</Code>

      <H2>The apps</H2>
      <P>
        Each feature is its own Django app, mounted under its own prefix by <C>pleate_backend.urls</C>. Remove an app from{" "}
        <C>INSTALLED_APPS</C> and its routes, its <C>/auth/me</C> fields and its section of the data export disappear with it.
      </P>
      <Table
        head={["App", "Prefix", "Backs"]}
        mono={[0, 1]}
        rows={[
          ["core", "/api", "Health, CSRF, errors, pagination, filters, realtime, cache, tasks"],
          ["accounts", "/api/auth", "LoginForm, SignupForm, ForgotPasswordForm, ResetPasswordForm, SessionList"],
          ["mfa", "/api/auth/mfa", "TwoFactorForm, TwoFactorSetup"],
          ["oauth", "/api/auth/oauth", "OAuthButtons"],
          ["rbac", "/api/rbac", "Roles, object permissions, feature flags"],
          ["apikeys", "/api/api-keys", "ApiKeyList"],
          ["files", "/api/files", "FileUpload"],
          ["notifications", "/api/notifications", "NotificationBell, NotificationCenter"],
          ["emails", "", "Transactional emails for every other app"],
          ["audit", "/api/activity", "Timeline, DataTable of activity"],
          ["ratelimit", "", "Throttles and RateLimit headers"],
          ["webhooks", "/api/webhooks", "Outgoing and incoming webhooks"],
          ["ai_chat", "/api/ai", "ChatThread, Composer, ModelPicker, PromptSuggestions, Reasoning"],
          ["marketing", "/api/marketing", "Newsletter, ContactForm, waitlist"],
          ["billing", "/api/billing", "Pricing"],
          ["staff", "/api/staff", "Back office tables and StatCard"],
        ]}
      />

      <H2>Why Django on MongoDB</H2>
      <P>
        The backend uses <C>django-mongodb-backend</C>, the official MongoDB backend for the Django ORM, instead of talking
        to MongoDB through PyMongo or an ODM such as MongoEngine. The choice is about what comes for free:
      </P>
      <UL>
        <LI>
          <strong>The Django ORM.</strong> Models, migrations, querysets, <C>select_related</C>, signals and transactions,
          the API every Django developer already knows. Your own models sit next to pleate&apos;s and can point at its{" "}
          <C>User</C> with a plain <C>ForeignKey</C>.
        </LI>
        <LI>
          <strong>Django auth.</strong> Password hashing (Argon2), permissions, groups, sessions and{" "}
          <C>authenticate()</C> work unchanged, so roles and object permissions build on them instead of reinventing them.
        </LI>
        <LI>
          <strong>The admin.</strong> Every app registers its models, so staff can browse users, files, bans or webhook
          deliveries on day one.
        </LI>
        <LI>
          <strong>Django REST Framework and OpenAPI.</strong> Serializers, permissions, throttles, filters and
          drf-spectacular all need the ORM. The OpenAPI schema is what generates the TypeScript types of pleate-client.
        </LI>
        <LI>
          <strong>The ecosystem.</strong> django-filter, django-storages, django-anymail and Celery plug in as they do on
          PostgreSQL. With PyMongo or MongoEngine each of these would need its own glue.
        </LI>
      </UL>
      <Callout title="Caveats worth knowing" tone="warning">
        <UL>
          <LI>
            <strong>Use a replica set.</strong> MongoDB transactions, which Django uses for <C>atomic()</C>, need a replica
            set. A single node replica set is enough: the repository&apos;s <C>docker-compose.yml</C> starts one.
          </LI>
          <LI>
            <strong>Primary keys are ObjectIds.</strong> <C>DEFAULT_AUTO_FIELD</C> is <C>ObjectIdAutoField</C>. The API
            exposes ids as 24 character strings and URLs use <C>{"<str:pk>"}</C>, never <C>{"<int:pk>"}</C>.
          </LI>
          <LI>
            <strong>No <C>prefetch_related</C>.</strong> Use <C>select_related</C> for foreign keys (it becomes a{" "}
            <C>$lookup</C>), keep list serializers flat and avoid queries per row. Model for fewer, larger documents.
          </LI>
          <LI>
            <strong>Contrib apps need Mongo aware configs.</strong> Admin, auth and contenttypes are installed through{" "}
            <C>pleate_backend.contrib</C> with migrations generated for ObjectId keys. Import the base settings and this is
            already done.
          </LI>
        </UL>
      </Callout>

      <H2>Where to go next</H2>
      <div className="my-6 grid gap-3 sm:grid-cols-2">
        {BACKEND_PAGES.slice(1).map((page) => (
          <Link
            key={page.slug}
            href={`/backend/${page.slug}`}
            className="pl-focus-ring rounded-2xl bg-surface px-5 py-4 shadow-xs transition-colors hover:bg-fill-hover"
          >
            <span className="text-headline">{page.name}</span>
            <span className="mt-1 line-clamp-2 block text-footnote text-fg-muted">{page.description}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
