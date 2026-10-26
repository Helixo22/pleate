"use client";

import { ApiKeyList, type ApiKey } from "pleate/api-key-list";
import { toast } from "pleate/toast";
import { useState } from "react";

const days = (n: number) => new Date(Date.now() + n * 864e5);
const SCOPES = [
  { value: "recipes:read", label: "recipes:read", description: "Read recipes and meal plans." },
  { value: "recipes:write", label: "recipes:write", description: "Create and edit recipes." },
  { value: "lists:write", label: "lists:write", description: "Manage shopping lists." },
];
const KEYS: ApiKey[] = [
  { id: "k1", name: "Production server", prefix: "pl_8f3k2m1q", scopes: ["recipes:read", "lists:write"], createdAt: days(-120), lastUsedAt: days(-0.01), expiresAt: days(245) },
  { id: "k2", name: "Home Assistant", prefix: "pl_c7d1x9we", scopes: ["recipes:read"], createdAt: days(-40), lastUsedAt: days(-3), expiresAt: null },
  { id: "k3", name: "Old import script", prefix: "pl_q2z8n4ab", scopes: ["recipes:write"], createdAt: days(-400), lastUsedAt: null, expiresAt: days(-35) },
];

const random = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");

export default function Demo() {
  const [keys, setKeys] = useState(KEYS);
  return (
    <ApiKeyList
      className="w-full"
      keys={keys}
      scopes={SCOPES}
      defaultScopes={["recipes:read"]}
      onCreate={async ({ name, scopes, expiresInDays }) => {
        await new Promise((r) => setTimeout(r, 900)); // your API call
        const prefix = `pl_${random(8)}`;
        setKeys((list) => [
          { id: prefix, name, prefix, scopes, createdAt: new Date(), lastUsedAt: null, expiresAt: expiresInDays ? days(expiresInDays) : null },
          ...list,
        ]);
        return { key: `${prefix}_${random(32)}` };
      }}
      onRevoke={async (id) => {
        await new Promise((r) => setTimeout(r, 800));
        setKeys((list) => list.filter((k) => k.id !== id));
        toast.success("Key revoked");
      }}
    />
  );
}
