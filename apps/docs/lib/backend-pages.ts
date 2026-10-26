// The Backend guides, in reading order. Plain data: the sidebar (a client component) imports it.

export type BackendPage = { slug: string; name: string; title: string; description: string };

export const BACKEND_PAGES: BackendPage[] = [
  {
    slug: "overview",
    name: "Overview",
    title: "Backend overview",
    description:
      "pleate-backend is a set of reusable Django apps on MongoDB that give every pleate component a ready REST API, and pleate-client connects the two with typed calls and React hooks.",
  },
  {
    slug: "installation",
    name: "Installation",
    title: "Installation",
    description: "From an empty folder to a Next.js app talking to Django: Python package, settings, URLs, services, workers and the client.",
  },
  {
    slug: "conventions",
    name: "Conventions",
    title: "API conventions",
    description: "Every endpoint follows the same rules for lists, errors, CSRF, authentication, rate limits and language, so one client handles them all.",
  },
  {
    slug: "authentication",
    name: "Authentication",
    title: "Authentication",
    description: "Email and password accounts with sessions, password reset, email verification and change, data export and account deletion.",
  },
  {
    slug: "two-factor",
    name: "Two factor",
    title: "Two factor authentication",
    description: "TOTP authenticator apps and single use backup codes, as a second step of the password and OAuth logins.",
  },
  {
    slug: "oauth",
    name: "OAuth",
    title: "OAuth and OpenID Connect",
    description: "Sign in with Google, GitHub, Apple or any OpenID Connect provider, with PKCE, account linking and the 2FA step.",
  },
  {
    slug: "roles-and-permissions",
    name: "Roles and permissions",
    title: "Roles, permissions and feature flags",
    description: "Roles on top of Django groups, object level permissions, percentage rollouts and DRF permission classes that compose.",
  },
  {
    slug: "api-keys",
    name: "API keys",
    title: "API keys",
    description: "Personal keys with read or write scopes and expiry, hashed at rest and accepted as Bearer tokens by every endpoint.",
  },
  {
    slug: "lists-and-tables",
    name: "Lists and tables",
    title: "Lists and tables",
    description: "A plain DRF ViewSet, the useList hook and DataTable: server side search, sorting, filters and pagination in a few lines.",
  },
  {
    slug: "files",
    name: "Files",
    title: "Files",
    description: "Private uploads with progress, type sniffing, image cleaning, quotas, downloads and direct S3 uploads.",
  },
  {
    slug: "notifications",
    name: "Notifications",
    title: "Notifications",
    description: "One notify() call reaches the in app inbox, email and Web Push, routed by user preferences and streamed live over SSE.",
  },
  {
    slug: "emails",
    name: "Emails",
    title: "Emails",
    description: "Transactional emails from templates, localized, queued on Celery and delivered by SMTP or any provider through django-anymail.",
  },
  {
    slug: "activity-log",
    name: "Activity log",
    title: "Activity log",
    description: "An audit trail of who did what, when and from where, recorded automatically for account events and on demand for yours.",
  },
  {
    slug: "rate-limiting-and-cache",
    name: "Rate limiting and cache",
    title: "Rate limiting and cache",
    description: "Sliding window throttles with standard headers, login lockouts, a caching decorator and ETags, all on the Django cache.",
  },
  {
    slug: "background-tasks",
    name: "Background tasks",
    title: "Background tasks",
    description: "Celery runs emails, webhook deliveries and housekeeping. One worker with beat is all a project needs.",
  },
  {
    slug: "webhooks",
    name: "Webhooks",
    title: "Webhooks",
    description: "Signed outgoing webhooks with retries, delivery logs and an SSRF guard, plus helpers to receive webhooks exactly once.",
  },
  {
    slug: "ai-chat",
    name: "AI chat",
    title: "AI chat",
    description: "Conversations with streamed answers, reasoning, sources, stop and regenerate, on Anthropic, OpenAI or any compatible server.",
  },
  {
    slug: "marketing",
    name: "Marketing",
    title: "Marketing",
    description: "Newsletter with double opt in, a contact form with a honeypot and a waitlist with referrals.",
  },
  {
    slug: "billing",
    name: "Billing",
    title: "Billing",
    description: "Subscriptions with Stripe Checkout, the customer portal and webhooks, configured as a list of plans that maps onto Pricing.",
  },
  {
    slug: "staff",
    name: "Staff",
    title: "Staff API",
    description: "A back office API: users, roles, sessions, IP bans and the numbers for a dashboard.",
  },
  {
    slug: "internationalization",
    name: "Internationalization",
    title: "Internationalization",
    description: "Error messages and emails in the user's language: English, Italian and Spanish ship with the package.",
  },
  {
    slug: "client-and-hooks",
    name: "Client and hooks",
    title: "Client and hooks",
    description: "Reference of pleate-client: every module of createPleateClient and every React hook with what it returns.",
  },
  {
    slug: "testing",
    name: "Testing",
    title: "Testing",
    description: "pytest against a real MongoDB for the backend, Vitest and the mock backend for the frontend.",
  },
  {
    slug: "deployment",
    name: "Deployment",
    title: "Deployment",
    description: "Environment variables, processes, Redis, SSE and a security checklist for going to production.",
  },
];
