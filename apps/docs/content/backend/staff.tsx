import { C, Callout, Code, Endpoints, Errors, H2, P } from "@/components/backend/prose";

export default function Staff() {
  return (
    <>
      <P>
        <C>pleate_backend.staff</C> is the API behind a back office: users, their roles and sessions, IP bans and the
        numbers for a dashboard. Build the screens with <C>DataTable</C>, <C>StatCard</C> and <C>useList</C>; the Django
        admin stays available for everything else.
      </P>
      <P>
        Every endpoint needs <C>is_staff</C> or the matching model permission, which can be granted through a role:{" "}
        <C>pleate_accounts.view_user</C>, <C>change_user</C> and <C>delete_user</C> for users and stats,{" "}
        <C>pleate_staff.*_ban</C> for bans. A support role can therefore read users without being staff.
      </P>

      <H2>Endpoints</H2>
      <P>Mounted at <C>/api/staff</C>.</P>
      <Endpoints
        rows={[
          ["GET", "/staff/users", <>Page list. <C>search</C> (email, name), filters <C>is_active</C>, <C>is_staff</C>, <C>email_verified</C>, <C>role</C>, ordering <C>date_joined</C>, <C>email</C>, <C>last_login</C>, <C>name</C>.</>],
          ["GET", "/staff/users/<id>", <>The user plus <C>has_password</C>, <C>locale</C>, <C>timezone</C>, <C>sessions_count</C>, <C>mfa_enabled</C>.</>],
          ["PATCH", "/staff/users/<id>", <><C>{"{name?, is_active?, is_staff?, email_verified?, roles?: [names]}"}</C>. Deactivating signs the user out everywhere.</>],
          ["DELETE", "/staff/users/<id>", "204."],
          ["POST", "/staff/users/<id>/revoke-sessions", <><C>{"{count}"}</C></>],
          ["POST", "/staff/users/<id>/password-reset", "202. Emails a reset link, the same email as the forgot password flow."],
          ["GET", "/staff/bans", <>Page list. <C>search</C> (network, reason), ordering <C>created_at</C>, <C>expires_at</C>, <C>network</C>.</>],
          ["POST", "/staff/bans", <><C>{'{network: "1.2.3.4" | "10.0.0.0/8" | "2001:db8::/32", reason?, expires_at?}'}</C></>],
          ["GET|PATCH", "/staff/bans/<id>", <><C>{"{id, network, reason, expires_at, is_active, created_by, created_at}"}</C></>],
          ["DELETE", "/staff/bans/<id>", "204, lifts the ban."],
          ["GET", "/staff/stats", <><C>{"{users_total, users_active, users_new_7d, users_new_30d, sessions_active, signups_by_day}"}</C></>],
        ]}
      />
      <P>
        User list items: <C>id</C>, <C>email</C>, <C>name</C>, <C>display_name</C>, <C>avatar_url</C>,{" "}
        <C>email_verified</C>, <C>is_active</C>, <C>is_staff</C>, <C>is_superuser</C>, <C>date_joined</C>,{" "}
        <C>last_login</C>, <C>roles</C>. <C>signups_by_day</C> covers 30 days, oldest first, as{" "}
        <C>{"[{date, count}]"}</C>; <C>users_active</C> counts accounts that are not deactivated.
      </P>

      <H2>A users screen</H2>
      <Code lang="tsx">{`
const users = useList<StaffUser>("/staff/users", { ordering: "-date_joined", syncUrl: true });
const client = usePleateClient();

<DataTable
  aria-label="Users"
  columns={columns}
  getRowId={(u) => u.id}
  {...users.tableProps}
  toolbar={
    <SegmentedControl
      size="sm"
      value={String(users.filters.is_active ?? "all")}
      onValueChange={(v) => users.setFilter("is_active", v === "all" ? undefined : v)}
      options={[{ value: "all", label: "All" }, { value: "true", label: "Active" }, { value: "false", label: "Deactivated" }]}
    />
  }
  onRowClick={(u) => router.push(\`/admin/users/\${u.id}\`)}
/>

await client.staff.updateUser(id, { is_active: false, roles: ["support"] });
`}</Code>
      <Code lang="tsx" title="A dashboard">{`
const stats = useQuery({ queryKey: ["staff", "stats"], queryFn: client.staff.stats });

<StatCard label="Users" value={stats.data?.users_total ?? 0} />
<StatCard label="New this week" value={stats.data?.users_new_7d ?? 0} />
<StatCard label="Signed in now" value={stats.data?.sessions_active ?? 0} />
`}</Code>

      <H2>IP bans</H2>
      <P>
        <C>BanMiddleware</C> answers 403 <C>banned</C> to clients whose address is in an active ban, using{" "}
        <C>client_ip</C> (so <C>X-Forwarded-For</C> from trusted proxies). <C>/api/health</C> is never blocked. Active
        networks are cached for 25 seconds in the Django cache and 5 seconds in each process; saving or deleting a ban
        drops both, so a warm request makes no database query. If the cache is down, requests pass.
      </P>
      <Code lang="python">{`
from pleate_backend.staff.bans import is_banned, invalidate
from pleate_backend.staff.models import Ban

is_banned("203.0.113.24")      # True or False
Ban.objects.active()           # bans that have not expired
`}</Code>
      <Callout tone="warning">
        Use Redis as the cache in production so every worker sees a new ban at once.
      </Callout>

      <H2>Error codes</H2>
      <Errors
        rows={[
          ["cannot_modify_self", "400", "Deactivating, demoting or deleting yourself."],
          ["cannot_modify_superuser", "403", "Only superusers change superusers."],
          ["permission_denied", "403", <>Changing staff access needs <C>is_staff</C>; changing roles needs <C>is_staff</C> or <C>auth.change_group</C>.</>],
          ["unknown_role", "400", "A role name that does not exist."],
          ["user_inactive", "400", "Password reset for a deactivated user."],
          ["invalid_network", "400", "Not an IP address or CIDR network."],
          ["cannot_ban_self", "400", "The network contains your own address."],
          ["banned", "403", "From the middleware, on any request."],
        ]}
      />
    </>
  );
}
