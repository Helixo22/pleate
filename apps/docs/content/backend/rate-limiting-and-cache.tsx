import { C, Callout, Code, H2, H3, LI, P, Table, UL } from "@/components/backend/prose";

export default function RateLimitingAndCache() {
  return (
    <>
      <P>
        <C>pleate_backend.ratelimit</C> replaces DRF&apos;s throttles with sliding window counters on the Django cache and
        publishes the standard <C>RateLimit</C> headers. <C>pleate_backend.core.cache</C> adds a caching decorator and
        conditional GET. Both work on the local memory cache in development; in production point the cache at Redis so
        every worker shares the counters.
      </P>

      <H2>Throttles</H2>
      <P>Every request passes the default throttles; some views add a named scope.</P>
      <Table
        head={["Scope", "Default rate", "Applies to"]}
        mono={[0, 1]}
        rows={[
          ["user", "600/min", "Every request of a signed in user."],
          ["anon", "120/min", "Every anonymous request, per IP."],
          ["auth", "10/min", "Login, 2FA verify, password reset, email verification and change, export."],
          ["signup", "5/hour", "Signup."],
          ["contact", "5/hour", "Newsletter, contact form, waitlist."],
          ["upload", "60/hour", "File uploads."],
          ["ai", "30/min", "Chat messages and regenerations."],
        ]}
      />
      <P>Change a rate, or add a scope for your own view:</P>
      <Code lang="python" title="settings.py">{`
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] |= {"ai": "60/min", "search": "30/min"}
`}</Code>
      <Code lang="python">{`
from pleate_backend.ratelimit.throttles import ScopedRateThrottle, StrictScopedRateThrottle

class SearchView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "search"          # per user when signed in, per IP otherwise

class RedeemCodeView(APIView):
    throttle_classes = [StrictScopedRateThrottle]   # denies when the cache is down
    throttle_scope = "auth"
`}</Code>
      <P>Responses carry the state of the tightest throttle that applied, and a 429 says when to come back:</P>
      <Code lang="http">{`
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 10
RateLimit-Remaining: 0
RateLimit-Reset: 42

{"error": {"status": 429, "code": "throttled", "message": "Request was throttled. Expected available in 42 seconds.", "retry_after": 42}}
`}</Code>
      <P>
        In the client, <C>error.retryAfter</C> holds the seconds. Rates parse <C>s</C>, <C>sec</C>, <C>m</C>, <C>min</C>,{" "}
        <C>h</C>, <C>hour</C>, <C>d</C> and <C>day</C>.
      </P>

      <H3>Counters for security</H3>
      <P>
        For limits that are not one request, such as failed logins per account, use the counters directly. The window is
        approximated with two fixed buckets weighted by overlap: accurate enough for abuse protection, and only two cache
        keys.
      </P>
      <Code lang="python">{`
from pleate_backend.ratelimit import limits

allowed, retry_after = limits.peek(f"redeem:{user.pk}", limit=5, window=3600, fail_closed=True)
if not allowed:
    raise ApiError("too_many_attempts", _("Too many attempts. Try again later."), 429, {"retry_after": retry_after})
if not code_is_valid:
    limits.hit(f"redeem:{user.pk}", 5, 3600, fail_closed=True)   # count only failures
else:
    limits.reset(f"redeem:{user.pk}", 3600)
`}</Code>
      <UL>
        <LI><C>hit(key, limit, window)</C> counts one event and returns <C>(allowed, retry_after)</C>.</LI>
        <LI><C>peek</C> checks without counting, <C>reset</C> clears, <C>remaining</C> tells what is left.</LI>
        <LI><C>fail_closed=True</C> denies when the cache is unreachable. Use it on authentication paths; everything else fails open.</LI>
      </UL>

      <H3>Client IP</H3>
      <P>
        Per IP limits, bans and audit entries use <C>core.utils.client_ip</C>. <C>X-Forwarded-For</C> is trusted only when
        the request comes from <C>{`PLEATE["TRUSTED_PROXIES"]`}</C> (CIDR list, loopback by default). Behind a load
        balancer or the Next.js proxy, add its network, or every user shares one address.
      </P>

      <H2>Cache</H2>
      <Code lang="python">{`
from pleate_backend.core.cache import cached, invalidate

@cached("plans", ttl=300)
def load_plans(): ...

@cached(lambda user: f"dashboard:{user.pk}", ttl=60)
def dashboard(user): ...

invalidate("plans")
dashboard.invalidate(user)          # same key function
`}</Code>
      <P>
        Keys are prefixed with <C>pl:cache:</C>. Cache errors are swallowed: when Redis is down the function simply runs.
      </P>
      <H3>Conditional GET</H3>
      <P>
        <C>ETagMixin</C> hashes the response data of GET and HEAD. The response carries an <C>ETag</C> and{" "}
        <C>Cache-Control: private, no-cache</C>; a request with a matching <C>If-None-Match</C> gets a 304 with no body.
      </P>
      <Code lang="python">{`
from pleate_backend.core.cache import ETagMixin

class PlanListView(ETagMixin, generics.ListAPIView):
    ...
`}</Code>

      <H2>Redis</H2>
      <P>One Redis serves the cache, the counters, Celery and realtime events:</P>
      <Code lang="python" title="settings.py">{`
from pleate_backend.settings import redis

globals().update(redis("redis://localhost:6389/0"))   # CACHES, CELERY_BROKER_URL
PLEATE["REDIS_URL"] = "redis://localhost:6389/0"      # health check and RedisBroker
`}</Code>
      <Callout tone="warning">
        Without a shared cache each worker counts on its own, so the effective limit is multiplied by the number of
        processes, and bans take up to their cache lifetime to reach every process.
      </Callout>
    </>
  );
}
