import { C, Callout, Code, Endpoints, H2, P, Settings, Table } from "@/components/backend/prose";

export default function ActivityLog() {
  return (
    <>
      <P>
        <C>pleate_backend.audit</C> records who did what, when and from where. Account events are logged automatically;
        your own actions take one call. Users see their own history (a security page), staff see everything (a back office
        table), and entries expire on their own.
      </P>

      <H2>An entry</H2>
      <Code lang="json">{`
{
  "id": "6720d3b1c2d3e4f5a6b7c8d9",
  "actor": "6720c1f4a3b2c1d0e9f8a7b6",
  "actor_email": "ada@plate.dev",
  "action": "billing.plan_changed",
  "target_type": "pleate_billing.subscription",
  "target_id": "6720d2aa…",
  "target_repr": "Pro (monthly)",
  "changes": { "plan": ["free", "pro"] },
  "metadata": { "reason": "upgrade" },
  "ip": "203.0.113.24",
  "user_agent": "Mozilla/5.0 …",
  "request_id": "9f8e7d6c5b4a3f2e",
  "created_at": "2026-10-26T10:30:00Z"
}
`}</Code>

      <H2>Recorded automatically</H2>
      <Table
        head={["Action", "When"]}
        mono={[0]}
        rows={[
          ["auth.login / auth.logout", "Sign in and out."],
          ["auth.login_failed", "Wrong password. Only the attempted email is kept."],
          ["auth.signup, auth.email_verified", "Account created, email confirmed."],
          ["auth.password_changed, auth.password_reset", "Password changed while signed in, or through a reset link."],
          ["auth.email_changed, auth.sessions_revoked", "Email changed, devices signed out."],
          ["account.deleted", "The account was deleted."],
          ["mfa.enabled, mfa.disabled, mfa.backup_code_used", "When the mfa app is installed."],
          ["oauth.linked, oauth.unlinked", "When the oauth app is installed."],
        ]}
      />

      <H2>Logging your own</H2>
      <Code lang="python">{`
from pleate_backend.audit import log_activity, register

log_activity(
    "billing.plan_changed",
    target=subscription,
    changes={"plan": ["free", "pro"]},
    reason="upgrade",            # extra keyword arguments go to metadata
)

# Every create, update and delete of a model, with field diffs:
register(Product, exclude=("password",))   # catalog.product.created|updated|deleted
`}</Code>
      <P>
        The actor defaults to the signed in user of the current request, and IP, user agent and request id come from it
        too, thanks to <C>AuditContextMiddleware</C> (installed right after <C>AuthenticationMiddleware</C>).{" "}
        <C>log_activity</C> never raises: auditing must not break the action it records. Sensitive keys (password,
        secret, token, key_hash...) are masked in <C>changes</C> and <C>metadata</C>.
      </P>

      <H2>Endpoints</H2>
      <P>Mounted at <C>/api/activity</C>.</P>
      <Endpoints
        rows={[
          ["GET", "/activity", <>My activity, newest first. Cursor list (<C>cursor</C>, <C>page_size</C>). Filters <C>action</C> and <C>action__startswith</C> (e.g. <C>auth.</C>).</>],
          ["GET", "/activity/all", <>Staff only. Page list, <C>search</C> over actor email, target and action. Filters <C>action</C>, <C>action__startswith</C>, <C>actor</C>, <C>target_type</C>, <C>target_id</C>, <C>created_after</C>, <C>created_before</C> (ISO 8601). Ordering <C>created_at</C>.</>],
          ["GET", "/activity/all/<id>", "Staff only. One entry."],
        ]}
      />
      <Code lang="tsx" title="A security page">{`
const client = usePleateClient();
const feed = useCursorList(["activity", "auth"], (p) => client.activity.mine({ ...p, action__startswith: "auth." }));

<Timeline>
  {feed.items.map((e) => (
    <TimelineItem key={e.id} title={e.action} time={new Date(e.created_at).toLocaleString()} description={e.ip} />
  ))}
</Timeline>
`}</Code>
      <Code lang="tsx" title="A staff table">{`
const log = useList<ActivityLog>("/activity/all", { ordering: "-created_at", syncUrl: true });
<DataTable columns={columns} getRowId={(e) => e.id} {...log.tableProps} />
`}</Code>

      <H2>Settings</H2>
      <P><C>{`PLEATE["AUDIT"]`}</C>:</P>
      <Settings
        rows={[
          ["RETENTION_DAYS", "365", "Entries expire after this many days (TTL index)."],
          ["LOG_READS", "False", <>Also log successful GET requests as <C>api.read</C>.</>],
        ]}
      />
      <Callout>
        The user&apos;s entries are part of the account export, in the <C>activity</C> section.
      </Callout>
    </>
  );
}
