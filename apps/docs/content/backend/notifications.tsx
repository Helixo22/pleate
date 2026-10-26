import { C, Callout, Code, Endpoints, H2, H3, LI, P, Settings, UL } from "@/components/backend/prose";
import { LiveDemo } from "@/components/backend/live-demo";
import NotificationsDemo from "@/demos/backend/notifications";

export default function Notifications() {
  return (
    <>
      <P>
        <C>pleate_backend.notifications</C> is one function, <C>notify()</C>, that reaches people where they want to be
        reached: the in app inbox (with realtime updates over Server-Sent Events), email and Web Push. Users choose the
        channels per kind of notification.
      </P>

      <LiveDemo
        file="notifications"
        title="Inbox with live updates"
        description="useNotifications loads the inbox, keeps the unread count and listens to the SSE stream. A new notification arrives every few seconds."
        signIn
        hint={<>Wait a few seconds for a live one</>}
      >
        <NotificationsDemo />
      </LiveDemo>

      <H2>Sending</H2>
      <Code lang="python">{`
from pleate_backend.notifications.services import notify

notify(
    user,
    "order.shipped",                       # kind: free form, dotted by convention
    "Your order is on its way",            # title
    body="Two bags of oat flour, arriving Thursday.",
    url="/orders/1042",                     # relative URLs are joined to FRONTEND_URL in emails
    data={"order": "1042"},
    channels=None,                          # None: follow the user's preferences
)
`}</Code>
      <P>
        <C>notify</C> returns the stored <C>Notification</C>, or <C>None</C> when the in app channel is not used. Channels
        are, in order of precedence: the <C>channels</C> argument, the user&apos;s preference for this <C>kind</C>, their{" "}
        <C>&quot;*&quot;</C> preference, then <C>DEFAULT_CHANNELS</C>.
      </P>
      <UL>
        <LI>
          <strong>in_app</strong>: stored, then published on the realtime channel <C>{"user:<id>"}</C> as a{" "}
          <C>notification</C> event followed by <C>unread_count</C>.
        </LI>
        <LI>
          <strong>email</strong>: the <C>notification</C> template (<C>title</C>, <C>body</C>, <C>action_url</C>,{" "}
          <C>action_label</C>), in the user&apos;s language.
        </LI>
        <LI>
          <strong>push</strong>: Web Push through pywebpush with the VAPID keys (<C>pleate-backend[push]</C>). Skipped
          when the keys are not set; subscriptions that answer 404 or 410 are deleted.
        </LI>
      </UL>

      <H2>Endpoints</H2>
      <Endpoints
        rows={[
          ["GET", "/notifications", <>Cursor list, newest first (<C>cursor</C>, <C>page_size</C>). Filters <C>unread=true|false</C> and <C>kind</C>.</>],
          ["DELETE", "/notifications", <>Deletes every read notification → <C>{"{count}"}</C>.</>],
          ["GET", "/notifications/unread-count", <><C>{"{count}"}</C></>],
          ["POST", "/notifications/<id>/read", "Marks read, returns the notification."],
          ["POST", "/notifications/<id>/unread", "Marks unread, returns the notification."],
          ["POST", "/notifications/read-all", <><C>{"{count}"}</C> marked read.</>],
          ["DELETE", "/notifications/<id>", "Deletes one. 204."],
          ["GET", "/notifications/preferences", <><C>{'{channels: {"*": [...], "<kind>": [...]}, available_channels}'}</C></>],
          ["PUT", "/notifications/preferences", <><C>{"{channels}"}</C> replaces the routing. Unknown channels fail with <C>invalid_channel</C>.</>],
          ["GET", "/notifications/stream", "Server-Sent Events, see below."],
          ["GET", "/notifications/push/public-key", <><C>{"{key}"}</C>, the VAPID public key, or null when push is off.</>],
          ["POST", "/notifications/push/subscriptions", <><C>{"{endpoint, keys: {p256dh, auth}}"}</C>, the JSON of a <C>PushSubscription</C>.</>],
          ["DELETE", "/notifications/push/subscriptions", <><C>{"{endpoint}"}</C></>],
        ]}
      />

      <H2>The stream</H2>
      <P>
        <C>/notifications/stream</C> sends the unread count on connect, then a <C>notification</C> and an{" "}
        <C>unread_count</C> whenever something changes. A comment line (<C>: ping</C>) keeps idle connections open every{" "}
        <C>HEARTBEAT_SECONDS</C>, and <C>retry: 3000</C> tells browsers how fast to reconnect.
      </P>
      <Code lang="text" title="text/event-stream">{`
retry: 3000

event: unread_count
data: {"count": 3}

event: notification
data: {"id": "6720…", "kind": "order.shipped", "title": "Your order is on its way", "read": false, …}

event: unread_count
data: {"count": 4}

: ping
`}</Code>
      <P>
        <C>useNotifications</C> reads it over fetch (so it works with any headers), merges new items into the cached first
        page, updates the count and reconnects with exponential backoff up to 30 seconds. With a plain{" "}
        <C>EventSource</C>, pass <C>{"{ withCredentials: true }"}</C>.
      </P>
      <Callout tone="warning" title="One process, or Redis">
        The default <C>MemoryBroker</C> only reaches streams in the same process. With several workers or servers set{" "}
        <C>{`PLEATE["REALTIME"]["BACKEND"]`}</C> to <C>pleate_backend.core.realtime.RedisBroker</C> and{" "}
        <C>{`PLEATE["REDIS_URL"]`}</C>. Each open stream holds a worker thread: see Deployment.
      </Callout>

      <H2>On the frontend</H2>
      <Code lang="tsx">{`
const inbox = useNotifications({ pageSize: 20 });   // live: true by default
<NotificationBell {...inbox.notificationCenterProps} icons={icons} />

// Preferences, with the plain client
const client = usePleateClient();
await client.notifications.updatePreferences({ "*": ["in_app"], "billing.payment_failed": ["in_app", "email"] });
`}</Code>
      <H3>Web Push</H3>
      <P>
        Generate VAPID keys once, set them in the settings, register a service worker that shows the push, and subscribe:
      </P>
      <Code lang="tsx">{`
const push = usePushSubscription();
const registration = await navigator.serviceWorker.register("/sw.js");
push.mutate(registration);   // asks permission, subscribes with the backend's VAPID key, saves the subscription
`}</Code>

      <H2>Settings</H2>
      <P><C>{`PLEATE["NOTIFICATIONS"]`}</C>:</P>
      <Settings
        rows={[
          ["CHANNELS", '["in_app", "email", "push"]', "Channels users may choose."],
          ["DEFAULT_CHANNELS", '["in_app"]', "Used when the user has no preference."],
          ["RETENTION_DAYS", "90", <>Notifications expire after this many days (MongoDB TTL index on <C>created_at</C>, applied on migrate).</>],
          ["VAPID_PUBLIC_KEY", "None", "Web Push public key."],
          ["VAPID_PRIVATE_KEY", "None", "Web Push private key."],
          ["VAPID_SUBJECT", '"mailto:admin@localhost"', "Contact for push services."],
        ]}
      />
      <P>
        Realtime: <C>{`PLEATE["REALTIME"]`}</C> with <C>BACKEND</C> (<C>MemoryBroker</C>) and <C>HEARTBEAT_SECONDS</C>{" "}
        (20). Notifications, preferences and push subscriptions are part of the account export.
      </P>
      <H3>Your own realtime channels</H3>
      <Code lang="python">{`
from pleate_backend.core.realtime import broker, channel_stream, sse_response

broker().publish(f"order:{order.pk}", {"type": "status", "data": {"status": "shipped"}})

class OrderStream(APIView):
    def get(self, request, pk):
        order = get_object_or_404(Order, pk=pk, user=request.user)
        return sse_response(channel_stream(f"order:{order.pk}"))
`}</Code>
    </>
  );
}
