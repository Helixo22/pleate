import { C, Callout, Code, Endpoints, Errors, H2, H3, LI, P, Settings, UL } from "@/components/backend/prose";

export default function Webhooks() {
  return (
    <>
      <P>
        <C>pleate_backend.webhooks</C> lets your users subscribe their own servers to events of your app: signed
        deliveries, retries with backoff, a delivery log with redelivery, and a guard against requests to private
        networks. It also has the helpers to receive webhooks from others (Stripe, GitHub, another pleate app) exactly
        once.
      </P>

      <H2>Sending events</H2>
      <Code lang="python">{`
from pleate_backend.webhooks import dispatch, register_event

register_event("order.shipped", "An order left the warehouse.")    # e.g. in AppConfig.ready()

dispatch("order.shipped", {"id": str(order.pk), "tracking": order.tracking}, owner=order.user)
dispatch("catalog.updated", {"count": 12})                         # no owner: endpoints of staff users
`}</Code>
      <P>
        Built in events are <C>ping</C>, <C>user.created</C> and <C>user.deleted</C> (the last two go to staff endpoints).
        Extra names can also be declared in <C>{`PLEATE["WEBHOOKS"]["EVENTS"]`}</C>.
      </P>

      <H2>What a receiver gets</H2>
      <Code lang="http">{`
POST /hooks/plate HTTP/1.1
Content-Type: application/json
User-Agent: pleate-webhooks/1
Pleate-Event: order.shipped
Pleate-Delivery: 6720e1a2b3c4d5e6f7a8b9c0
Pleate-Signature: t=1792065600,v1=5f8c0e7a1b2c…

{"id": "evt_3k9…", "type": "order.shipped", "created_at": "2026-10-26T11:00:00Z", "data": {"id": "…", "tracking": "…"}}
`}</Code>
      <UL>
        <LI>Any 2xx is a success. Redirects are not followed.</LI>
        <LI>Failures are retried after 60 s, 5 min, 30 min, 2 h, 5 h, 10 h, then daily, up to <C>MAX_ATTEMPTS</C>. A redelivery keeps the same event <C>id</C>: deduplicate on it.</LI>
        <LI>After 20 consecutive failures the endpoint is disabled and its owner is notified.</LI>
        <LI>Delivery logs, with a response excerpt, are kept 30 days.</LI>
      </UL>

      <H3>Verifying the signature</H3>
      <P>
        <C>v1</C> is the hex HMAC SHA-256 of <C>{"<t>.<raw body>"}</C> keyed with the endpoint secret. Check it against the
        raw bytes, before parsing JSON, in constant time, and reject old timestamps to stop replays.
      </P>
      <Code lang="ts" title="Node.js (Next.js route handler)">{`
import { createHmac, timingSafeEqual } from "node:crypto";

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verify(process.env.PLATE_WEBHOOK_SECRET!, raw, request.headers.get("pleate-signature") ?? "")) {
    return new Response("bad signature", { status: 400 });
  }
  const event = JSON.parse(raw);
  // ...handle event.type, deduplicate on event.id
  return new Response(null, { status: 204 });
}

function verify(secret: string, raw: string, header: string, tolerance = 300) {
  const parts = Object.groupBy(header.split(","), (p) => p.split("=")[0]);
  const t = Number(parts.t?.[0]?.slice(2));
  if (!t || Math.abs(Date.now() / 1000 - t) > tolerance) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(\`\${t}.\${raw}\`).digest("hex"));
  return (parts.v1 ?? []).some((p) => {
    const candidate = Buffer.from(p.slice(3));
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}
`}</Code>
      <Code lang="python" title="Python (any framework)">{`
import hashlib, hmac, time

def verify(secret: str, raw: bytes, header: str, tolerance: int = 300) -> bool:
    parts = [p.split("=", 1) for p in header.split(",") if "=" in p]
    timestamps = [v for k, v in parts if k == "t"]
    signatures = [v for k, v in parts if k == "v1"]
    if not timestamps or not signatures or abs(time.time() - int(timestamps[0])) > tolerance:
        return False
    message = timestamps[0].encode() + b"." + raw
    expected = hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, s) for s in signatures)
`}</Code>
      <P>
        In a Django project with pleate-backend installed, use the helper instead:{" "}
        <C>verify_signature(secret, request.body, header, tolerance=300)</C>.
      </P>

      <H2>Receiving webhooks</H2>
      <P>
        Senders retry, so the same event can arrive twice, sometimes at the same moment. <C>claim_inbound</C> stores the
        event id under a unique index and answers <C>True</C> only the first time:
      </P>
      <Code lang="python">{`
from pleate_backend.webhooks.inbound import claim_inbound, mark_processed, release_inbound, verify_signature

@csrf_exempt
def plate_hook(request):
    if not verify_signature(SECRET, request.body, request.headers.get("Pleate-Signature", "")):
        return HttpResponse(status=400)
    event = json.loads(request.body)
    if not claim_inbound("plate", event["id"], event):
        return HttpResponse(status=200)          # already handled
    try:
        handle(event)
    except Exception:
        release_inbound("plate", event["id"])    # let the sender's retry be handled
        raise
    mark_processed("plate", event["id"])
    return HttpResponse(status=200)
`}</Code>
      <P>The billing app receives Stripe events the same way.</P>

      <H2>Endpoints</H2>
      <P>
        Mounted at <C>/api/webhooks</C>, scoped to the signed in user (session or API key), so customers can manage their
        endpoints from your settings page or from a script.
      </P>
      <Endpoints
        rows={[
          ["GET", "/webhooks/endpoints", "My endpoints. Page list, ordering created_at."],
          ["POST", "/webhooks/endpoints", <><C>{'{url, description?, events?: ["*"] | [names], active?}'}</C> → 201 with the full <C>secret</C>, shown only this once.</>],
          ["GET", "/webhooks/endpoints/<id>", <>Endpoint with the <C>secret</C> masked.</>],
          ["PATCH", "/webhooks/endpoints/<id>", "url, description, events, active. Turning it back on resets the failure counter."],
          ["DELETE", "/webhooks/endpoints/<id>", "204."],
          ["POST", "/webhooks/endpoints/<id>/rotate-secret", <>→ <C>{"{secret}"}</C></>],
          ["POST", "/webhooks/endpoints/<id>/test", <>Sends a <C>ping</C> now → <C>{"{delivery, status, status_code, duration_ms, error}"}</C>.</>],
          ["GET", "/webhooks/endpoints/<id>/deliveries", <>Page list. Filters <C>status</C>, <C>event</C>.</>],
          ["GET", "/webhooks/deliveries/<id>", <>Delivery with <C>payload</C> and <C>response_excerpt</C>.</>],
          ["POST", "/webhooks/deliveries/<id>/redeliver", "202 with the new delivery (same event id and payload)."],
          ["GET", "/webhooks/events", <><C>{"[{name, description}]"}</C>, for a checkbox list.</>],
        ]}
      />
      <P>
        Delivery <C>status</C> is <C>pending</C>, <C>success</C> or <C>failed</C>; a failed delivery with{" "}
        <C>next_attempt_at</C> will be retried.
      </P>

      <H2>SSRF guard</H2>
      <P>
        Endpoint URLs must use https and resolve only to public addresses: no loopback, private, link local, reserved or
        multicast ranges. The check runs on create, on update and again before every attempt, so a DNS change cannot
        sneak a delivery into your network. <C>ALLOW_PRIVATE_URLS</C> lifts it for local development.
      </P>

      <H2>Settings</H2>
      <P><C>{`PLEATE["WEBHOOKS"]`}</C>:</P>
      <Settings
        rows={[
          ["MAX_ATTEMPTS", "8", "Attempts per delivery."],
          ["TIMEOUT_SECONDS", "10", "Per attempt."],
          ["ALLOW_PRIVATE_URLS", "False", "Allow http and private addresses (development only)."],
          ["EVENTS", "[]", <>Extra event names, or <C>{"{name, description}"}</C> dicts.</>],
          ["RETRY_SCHEDULE", "built in", "Optional list of delays in seconds."],
          ["DISABLE_AFTER_FAILURES", "20", "Consecutive failures before an endpoint is disabled."],
        ]}
      />

      <H2>Error codes</H2>
      <Errors
        rows={[
          ["url_not_allowed", "400", "Not https, or resolves to a private address."],
          ["unknown_event", "400", "An event name that is not registered."],
          ["events_required", "400", "The events list is empty."],
          ["endpoint_limit", "400", "20 endpoints per user."],
          ["endpoint_inactive", "409", "Redelivering to a disabled endpoint."],
        ]}
      />
      <Callout>
        <C>pleate_backend.webhooks.tasks.deliver</C> runs each attempt and <C>retry_due</C> runs every minute from the
        beat schedule. A queue outage is not a lost event: the delivery waits in MongoDB until <C>retry_due</C> picks it
        up.
      </Callout>
    </>
  );
}
