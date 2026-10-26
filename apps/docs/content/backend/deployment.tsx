import { C, Callout, Code, H2, H3, LI, P, Table, UL } from "@/components/backend/prose";

export default function Deployment() {
  return (
    <>
      <P>
        A production setup has four kinds of process: the Next.js app, the Django API, Celery workers and one Celery beat.
        They share MongoDB (a replica set) and Redis. The settings of <C>apps/backend-demo</C> read everything from the
        environment and are a good starting point.
      </P>

      <H2>Environment</H2>
      <Table
        head={["Variable", "Example", "Used for"]}
        mono={[0, 1]}
        rows={[
          ["SECRET_KEY", "50+ random characters", "Signing sessions, tokens and, by default, the 2FA encryption key."],
          ["DEBUG", "0", "Never 1 in production."],
          ["ALLOWED_HOSTS", "api.plate.app,plate.app", "Hosts Django answers."],
          ["CSRF_TRUSTED_ORIGINS", "https://plate.app", "Origins allowed to send unsafe requests."],
          ["MONGODB_URI", "mongodb+srv://…/plate", "The database (replica set, TLS, a dedicated user)."],
          ["REDIS_URL", "rediss://…:6379/0", "Cache, rate limits, Celery broker, realtime."],
          ["FRONTEND_URL", "https://plate.app", "Links in emails and redirects."],
          ["DEFAULT_FROM_EMAIL", "Plate <hello@plate.app>", "Sender."],
          ["SMTP_HOST / SMTP_PORT", "smtp.example.com / 587", "Or an anymail API key."],
          ["ANTHROPIC_API_KEY", "sk-ant-…", "AI chat (or OPENAI_API_KEY)."],
          ["GOOGLE_CLIENT_ID / _SECRET", "…", "OAuth, one pair per provider."],
          ["STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET", "sk_live_… / whsec_…", "Billing."],
          ["PLEATE_API_ORIGIN", "http://api:8000", "On the Next.js side: where the /api rewrite goes."],
        ]}
      />

      <H2>Processes</H2>
      <Code lang="sh">{`python manage.py migrate                         # on every release, before starting the new code
python manage.py collectstatic                   # admin assets (serve them with WhiteNoise or your CDN)

gunicorn -c gunicorn.conf.py myproject.wsgi      # the API
celery -A myproject worker -l info -c 4          # as many as the load needs
celery -A myproject beat -l info                 # exactly one`}</Code>
      <Code lang="python" title="gunicorn.conf.py">{`
bind = "0.0.0.0:8000"
workers = 4
worker_class = "gthread"
threads = 32          # every open SSE stream holds one thread
timeout = 0           # streams are long lived; rely on the proxy's idle timeout
`}</Code>

      <H3>Server-Sent Events and ASGI</H3>
      <P>
        The notification stream and the chat answers are Server-Sent Events produced by synchronous generators. Under
        WSGI each open stream holds a worker thread for as long as it is open: a user with a tab open holds one thread for
        notifications, plus one while an answer streams. Size <C>threads</C> for your concurrent users, or run a separate
        pool for the streaming paths.
      </P>
      <Callout title="ASGI works too">
        Under ASGI (uvicorn, daphne) Django would buffer a synchronous iterator, so <C>sse_response</C> detects the ASGI
        request and pulls the generator one chunk at a time in a worker thread. The stream reaches the browser as it is
        produced, and an open stream only holds a thread while the next chunk is being computed.
      </Callout>
      <P>Whatever sits in front must not buffer the streams:</P>
      <UL>
        <LI>The responses set <C>X-Accel-Buffering: no</C> (nginx honors it) and <C>Cache-Control: no-cache</C>.</LI>
        <LI>The stream sends a comment every <C>HEARTBEAT_SECONDS</C> (20) so idle timeouts of proxies and load balancers do not cut it; keep their idle timeout above that.</LI>
        <LI>With several API processes use the Redis broker, or a notification published in one process never reaches a stream held by another.</LI>
      </UL>

      <H2>Redis</H2>
      <Code lang="python" title="settings.py">{`
REDIS_URL = env("REDIS_URL")
globals().update(redis(REDIS_URL))                 # cache + Celery broker
PLEATE["REDIS_URL"] = REDIS_URL
PLEATE["REALTIME"] = {"BACKEND": "pleate_backend.core.realtime.RedisBroker"}
`}</Code>
      <P>
        Without Redis each process keeps its own counters, bans cache and realtime channel: rate limits multiply by the
        number of processes, and notifications reach only the streams of the process that sent them.
      </P>

      <H2>Behind a proxy</H2>
      <UL>
        <LI>Add the proxy networks to <C>{`PLEATE["TRUSTED_PROXIES"]`}</C> so <C>X-Forwarded-For</C> is used for rate limits, bans and the activity log. Only trusted hops are read.</LI>
        <LI>Set <C>SECURE_PROXY_SSL_HEADER = (&quot;HTTP_X_FORWARDED_PROTO&quot;, &quot;https&quot;)</C> when TLS ends at the proxy.</LI>
        <LI>The Next.js rewrite is a proxy too: keep the API private and let the browser reach it only through <C>/api</C>, or expose it directly and list the frontend in <C>CSRF_TRUSTED_ORIGINS</C>.</LI>
      </UL>

      <H2>Health</H2>
      <P>
        <C>GET /api/health</C> checks MongoDB and, when <C>{`PLEATE["REDIS_URL"]`}</C> is set, Redis. It answers 200{" "}
        <C>ok</C> or 503 <C>degraded</C>, needs no authentication, is never throttled or banned: point readiness probes at
        it. Logs are JSON lines on stdout with the request id of each request.
      </P>

      <H2>Security checklist</H2>
      <UL>
        <LI><C>DEBUG = False</C>, a long random <C>SECRET_KEY</C> from a secret store. Rotate with <C>SECRET_KEY_FALLBACKS</C> so sessions and 2FA secrets keep working.</LI>
        <LI>Set <C>{`PLEATE["MFA"]["ENCRYPTION_KEY"]`}</C> to its own Fernet key, so rotating <C>SECRET_KEY</C> never touches TOTP secrets.</LI>
        <LI><C>SESSION_COOKIE_SECURE = True</C> and <C>CSRF_COOKIE_SECURE = True</C> (the demo derives both from <C>DEBUG</C>), plus <C>SECURE_SSL_REDIRECT</C> and <C>SECURE_HSTS_SECONDS</C>.</LI>
        <LI>Exact <C>ALLOWED_HOSTS</C> and <C>CSRF_TRUSTED_ORIGINS</C>; no wildcards.</LI>
        <LI>Redis as the cache, so login lockouts and throttles hold across workers. Authentication counters fail closed if it is down.</LI>
        <LI>MongoDB with authentication, TLS, a replica set and backups. GridFS files live in the same database: include them, or move files to S3.</LI>
        <LI><C>{`PLEATE["WEBHOOKS"]["ALLOW_PRIVATE_URLS"]`}</C> stays False.</LI>
        <LI>Real email delivery with SPF, DKIM and DMARC on the sender domain; security notices and resets depend on it.</LI>
        <LI>Staff accounts with 2FA, and roles instead of <C>is_staff</C> where a narrower permission is enough.</LI>
        <LI>Run Django&apos;s deployment checks (<C>manage.py check</C> with its deploy option) before each release.</LI>
      </UL>
    </>
  );
}
