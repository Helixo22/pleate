import { C, Callout, Code, H2, H3, LI, P, Table, UL } from "@/components/backend/prose";

export default function Testing() {
  return (
    <>
      <P>
        Test the backend against a real MongoDB, so queries, indexes and transactions behave as in production. Test the
        frontend against the mock backend of pleate-client, an in memory implementation of every endpoint with the same
        shapes, status codes and error codes, served by MSW.
      </P>

      <H2>Backend: pytest</H2>
      <P>
        Start the services once (<C>docker compose up -d mongo redis</C>), then use <C>pytest-django</C> with a settings
        module for tests:
      </P>
      <Code lang="python" title="tests/settings.py">{`
import os
from myproject.settings import *  # noqa: F403
from pleate_backend.settings import database

DATABASES = database(
    os.environ.get("TEST_MONGO_URI", "mongodb://localhost:27027/?directConnection=true"),
    name=os.environ.get("TEST_DB", "myproject"),
)
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]   # fast
MAILERS = {"default": {"BACKEND": "django.core.mail.backends.locmem.EmailBackend"}}
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
PLEATE = {**PLEATE, "FRONTEND_URL": "http://app.test", "EMAILS": {"ASYNC": False}}
`}</Code>
      <Code lang="toml" title="pyproject.toml">{`
[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "tests.settings"
pythonpath = ["."]
`}</Code>
      <Code lang="python" title="tests/conftest.py">{`
import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

PASSWORD = "correct-horse-battery-9"

@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()          # rate limit counters live in the cache
    yield
    cache.clear()

@pytest.fixture
def api():
    return APIClient()

@pytest.fixture
def user(db):
    from django.contrib.auth import get_user_model
    return get_user_model().objects.create_user(email="ada@example.com", password=PASSWORD, email_verified=True)

@pytest.fixture
def auth_api(api, user):
    api.force_authenticate(user)
    return api
`}</Code>
      <Code lang="python" title="tests/test_catalog.py">{`
import pytest
from django.core import mail

pytestmark = pytest.mark.django_db

def test_products_search_and_order(auth_api):
    Product.objects.create(name="Oat flour", sku="OAT-1", category="Pantry", price="4.50", stock=3)
    Product.objects.create(name="Rye flour", sku="RYE-1", category="Pantry", price="3.90", stock=40)
    res = auth_api.get("/api/catalog/products", {"search": "flour", "ordering": "price", "low_stock": "true"})
    assert res.status_code == 200
    assert [p["sku"] for p in res.json()["results"]] == ["OAT-1"]

def test_unknown_ordering_is_rejected(auth_api):
    res = auth_api.get("/api/catalog/products", {"ordering": "sku"})
    assert res.json()["error"]["code"] == "invalid_ordering"

def test_signup_sends_verification(api):
    res = api.post("/api/auth/signup", {"email": "new@example.com", "password": "correct-horse-battery-9"})
    assert res.status_code == 201
    assert "/verify-email?token=" in mail.outbox[0].body
`}</Code>
      <UL>
        <LI>MongoDB cannot roll back Django&apos;s <C>TestCase</C> transactions, so each test flushes the database. Keep tests independent.</LI>
        <LI>Run files in parallel processes on separate databases with the database name variable (<C>TEST_DB=myproject_files pytest tests/test_files.py</C>).</LI>
        <LI><C>APIClient</C> skips CSRF unless you create it with <C>enforce_csrf_checks=True</C>: do that in the tests of your login like views.</LI>
        <LI>Mock outgoing HTTP (OAuth, webhooks, AI providers) with <C>respx</C>; the EchoProvider needs no mock at all.</LI>
      </UL>
      <H3>Schema check</H3>
      <P>
        Keep the OpenAPI schema valid, since the TypeScript types are generated from it:
      </P>
      <Code lang="sh">{`DJANGO_SETTINGS_MODULE=tests.settings python -m django spectacular > /dev/null`}</Code>

      <H2>Frontend: Vitest with the mock</H2>
      <P>
        <C>pleate-client/mock</C> exports the database and the MSW handlers. Run them on <C>msw/node</C> with no latency:
      </P>
      <Code lang="ts" title="test/backend.ts">{`
import { setupServer } from "msw/node";
import { createMockDb, createMockHandlers } from "pleate-client/mock";

export const BASE = "http://localhost/api";
export const db = createMockDb({ signedIn: false });
export const server = setupServer(
  ...createMockHandlers({ db, baseUrl: BASE, latency: 0, streamDelay: 0, liveNotificationInterval: 0 }),
);
`}</Code>
      <Code lang="ts" title="vitest.config.ts">{`
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    // Same origin as the mock API, so no CORS preflight
    environmentOptions: { happyDOM: { url: "http://localhost/" } },
  },
});
`}</Code>
      <Code lang="tsx" title="login.test.tsx">{`
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { createPleateClient } from "pleate-client";
import { DEMO_PASSWORD, DEMO_TOTP_CODE, MFA_EMAIL } from "pleate-client/mock";
import { PleateProvider, useLogin } from "pleate-client/react";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { BASE, db, server } from "./backend";

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => db.reset());
afterAll(() => server.close());

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <PleateProvider client={createPleateClient({ baseUrl: BASE })} queryClient={queryClient}>
      {children}
    </PleateProvider>
  );
}

it("asks for the code, then signs in", async () => {
  const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });
  await act(() => result.current.loginFormProps.onSubmit({ email: MFA_EMAIL, password: DEMO_PASSWORD, remember: false }));
  await waitFor(() => expect(result.current.mfaRequired).toBe(true));
  await act(() => result.current.twoFactorFormProps.onSubmit({ code: DEMO_TOTP_CODE, method: "otp" }));
  await waitFor(() => expect(db.auth.userId).not.toBeNull());
});
`}</Code>
      <H3>What the mock knows</H3>
      <Table
        head={["Export", "Value", "Use"]}
        mono={[0, 1]}
        rows={[
          ["DEMO_EMAIL", '"ada@plate.dev"', "Admin with data in every app."],
          ["MFA_EMAIL", '"mfa@plate.dev"', "Same password, with 2FA."],
          ["DEMO_PASSWORD", '"plate-demo-2026"', "Password of both."],
          ["DEMO_TOTP_CODE", '"123456"', "The TOTP code the mock accepts."],
          ["DEMO_BACKUP_CODE", '"abcd-efgh"', "A backup code."],
          ["VALID_TOKEN", '"valid-token"', "The only reset, verification or newsletter token accepted."],
        ]}
      />
      <P>
        <C>createMockDb(options)</C> takes <C>seed</C> (deterministic data), <C>signedIn</C> (start as Ada, default true),{" "}
        <C>requireEmailVerification</C> and <C>now</C>. The database is a plain object: read it in assertions, change it to
        set up a case, <C>reset()</C> it between tests.
      </P>

      <H2>In the browser</H2>
      <P>
        The same mock runs in a Service Worker, which is how the live examples of these docs work. It is handy for
        Storybook, design reviews and frontend work before the backend exists.
      </P>
      <Code lang="sh">{`npx msw init public`}</Code>
      <P>
        <C>msw/browser</C> has no server build, so load the module that starts the worker on the client only, with{" "}
        <C>next/dynamic</C> and <C>ssr: false</C>:
      </P>
      <Code lang="tsx" title="app/mock-worker.tsx">{`
"use client";
import { startMockWorker } from "pleate-client/mock/browser";
import { useEffect } from "react";

export default function MockWorker({ onReady }: { onReady: () => void }) {
  useEffect(() => void startMockWorker().then(onReady), [onReady]);
  return null;
}
`}</Code>
      <Code lang="tsx" title="app/providers.tsx">{`
"use client";
import dynamic from "next/dynamic";
import { PleateProvider } from "pleate-client/react";
import { useState } from "react";

const MockWorker = dynamic(() => import("./mock-worker"), { ssr: false });
const MOCK = process.env.NEXT_PUBLIC_MOCK_API === "1";

export function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!MOCK);
  return (
    <>
      {MOCK && <MockWorker onReady={() => setReady(true)} />}
      {ready && <PleateProvider options={{ baseUrl: "/api" }}>{children}</PleateProvider>}
    </>
  );
}
`}</Code>
      <Callout tone="tip">
        <C>startMockWorker</C> is idempotent and lets every request outside <C>/api</C> through. <C>resetMockDb()</C> puts
        the seed data back and <C>getMockDb()</C> exposes the database to a demo.
      </Callout>
    </>
  );
}
