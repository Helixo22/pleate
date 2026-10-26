import { C, Callout, Code, Endpoints, Errors, H2, LI, P, UL } from "@/components/backend/prose";
import { LiveDemo } from "@/components/backend/live-demo";
import ApiKeysDemo from "@/demos/backend/api-keys";

export default function ApiKeys() {
  return (
    <>
      <P>
        <C>pleate_backend.apikeys</C> lets users create personal keys for scripts, CI and integrations. A key looks like{" "}
        <C>pl_&lt;prefix&gt;_&lt;secret&gt;</C>: 8 characters of prefix, stored and indexed so the key can be found and
        shown, and 32 random bytes of secret. Only the SHA-256 of the whole key is stored; the key itself is returned once,
        by the create call.
      </P>

      <LiveDemo
        file="api-keys"
        title="Personal API keys"
        description="Create a key, copy it while it is shown, revoke it. useApiKeys maps the API onto ApiKeyList."
        signIn
        hint={<>Signed in as <C>ada@plate.dev</C></>}
      >
        <ApiKeysDemo />
      </LiveDemo>

      <H2>Using a key</H2>
      <Code lang="sh">{`curl https://plate.app/api/catalog/products \\
  -H "Authorization: Bearer pl_k3J9xQ2m_8s7d6f5g4h3j2k1l0z9x8c7v6b5n4m3q2w1e0r9t8y7u6"`}</Code>
      <P>
        <C>APIKeyAuthentication</C> runs before the session check on every endpoint. It finds the key by prefix, compares
        the hash in constant time and sets <C>request.auth</C> to the <C>APIKey</C>. Requests with a key skip CSRF, since
        they carry no cookie. <C>last_used_at</C> and <C>last_used_ip</C> are written at most once a minute.
      </P>
      <UL>
        <LI><C>read</C> keys may only use GET, HEAD and OPTIONS. <C>write</C> implies <C>read</C>.</LI>
        <LI>Keys can expire after 1 to 3650 days, or never.</LI>
        <LI>A user holds at most 25 active keys.</LI>
        <LI>Keys of deactivated users stop working at once.</LI>
      </UL>
      <P>From the TypeScript client, on a server or in a script:</P>
      <Code lang="ts">{`
import { createPleateClient } from "pleate-client";

const plate = createPleateClient({
  baseUrl: "https://plate.app/api",
  headers: { Authorization: \`Bearer \${process.env.PLATE_API_KEY}\` },
  csrf: false,
});

const page = await plate.list("/catalog/products", { search: "oat", page_size: 100 });
`}</Code>

      <H2>Endpoints</H2>
      <P>
        Mounted at <C>/api/api-keys</C>. Managing keys needs a session: a request made with an API key gets{" "}
        <C>api_key_not_allowed</C>, so a leaked key cannot mint more keys.
      </P>
      <Endpoints
        rows={[
          ["GET", "/api-keys", <>My keys. Page list, <C>?search=</C> name or prefix, <C>?ordering=created_at,name,last_used_at,expires_at</C>.</>],
          ["POST", "/api-keys", <><C>{'{name, scopes?: ["read"] | ["read", "write"], expires_in_days?}'}</C> → 201 with <C>key</C>, the only time it is returned.</>],
          ["GET", "/api-keys/<id>", <>One key without <C>key</C>.</>],
          ["PATCH", "/api-keys/<id>", <><C>{"{name}"}</C></>],
          ["DELETE", "/api-keys/<id>", <>Revokes (sets <C>revoked_at</C>). 204.</>],
        ]}
      />
      <Code lang="json" title="POST /api/api-keys → 201">{`
{
  "id": "6720c9a1b2c3d4e5f6a7b8c9",
  "name": "CI deploys",
  "prefix": "k3J9xQ2m",
  "display": "pl_k3J9xQ2m_...",
  "scopes": ["read", "write"],
  "status": "active",
  "expires_at": "2027-01-24T10:00:00Z",
  "last_used_at": null,
  "last_used_ip": null,
  "created_at": "2026-10-26T10:00:00Z",
  "revoked_at": null,
  "key": "pl_k3J9xQ2m_8s7d6f5g4h3j2k1l0z9x8c7v6b5n4m3q2w1e0r9t8y7u6"
}
`}</Code>
      <P><C>status</C> is <C>active</C>, <C>expired</C> or <C>revoked</C>.</P>

      <H2>Helpers</H2>
      <Code lang="python">{`
from pleate_backend.apikeys.services import create_key, find_key
from pleate_backend.apikeys.permissions import DenyAPIKey

key, raw = create_key(user, "Nightly export", scopes=["read"], expires_in_days=90)

class BillingPortalView(APIView):
    permission_classes = [IsAuthenticated, DenyAPIKey]   # session only
`}</Code>

      <H2>Error codes</H2>
      <Errors
        rows={[
          ["invalid_api_key", "401", "Unknown, revoked, or belonging to a deactivated user."],
          ["api_key_expired", "401", "Past expires_at."],
          ["insufficient_scope", "403", "A read key on POST, PUT, PATCH or DELETE."],
          ["api_key_not_allowed", "403", "A session only endpoint called with a key."],
          ["api_key_limit", "400", "25 active keys already."],
        ]}
      />
      <Callout>
        The data export lists keys without hashes, and the admin never shows them either.
      </Callout>
    </>
  );
}
