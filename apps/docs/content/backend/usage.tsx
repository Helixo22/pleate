import { C, Code, Endpoints, H2, P, Table } from "@/components/backend/prose";

export default function Usage() {
  return (
    <>
      <P>
        <C>pleate_backend.usage</C> answers one question for a billing or settings page: how much of each limit has this
        user used. It reads the counters the other apps already keep, with one query per item, and caches the numbers per
        user for 30 seconds.
      </P>

      <H2>Endpoint</H2>
      <Endpoints rows={[["GET", "/usage", <>Signed in, session or API key. <C>{"{plan, items: [{id, label, used, limit, unit}]}"}</C>.</>]]} />
      <Code lang="json" title="GET /api/usage">{`
{
  "plan": "pro",
  "items": [
    { "id": "storage", "label": "Storage", "used": 73400320, "limit": 524288000, "unit": "bytes" },
    { "id": "ai_tokens", "label": "AI tokens today", "used": 4210, "limit": 200000, "unit": "tokens" },
    { "id": "api_keys", "label": "API keys", "used": 2, "limit": 25, "unit": "keys" },
    { "id": "webhooks", "label": "Webhook endpoints", "used": 1, "limit": 20, "unit": "endpoints" }
  ]
}
`}</Code>
      <P>
        <C>plan</C> is the plan of the active subscription, else the free plan, or <C>null</C> without billing.{" "}
        <C>limit</C> is <C>null</C> when there is none. An item is present only when its app is installed. Labels follow
        the request language.
      </P>
      <Table
        head={["id", "Used", "Limit"]}
        rows={[
          ["storage", "Bytes of the user's files", <C>{`FILES["USER_QUOTA"]`}</C>],
          ["ai_tokens", "Input plus output tokens today", <C>{`AI["DAILY_TOKEN_LIMIT"]`}</C>],
          ["api_keys", "Active keys", "25"],
          ["webhooks", "Webhook endpoints", "20"],
        ]}
      />

      <H2>From React</H2>
      <Code lang="tsx">{`
import { UsageMeter } from "pleate";
import { useUsage } from "pleate-client/react";

const usage = useUsage();
return usage.usageMeterProps.map((props) => <UsageMeter key={props.label} {...props} />);
`}</Code>
      <P>Byte quotas are shown in GB or MB; items without a limit are left out of <C>usageMeterProps</C>.</P>
    </>
  );
}
