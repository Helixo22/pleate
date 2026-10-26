"use client";

import { OAuthButtons } from "pleate/auth/oauth-buttons";
import { useState } from "react";

const PROVIDERS = [
  { id: "google", name: "Google" },
  { id: "apple", name: "Apple" },
  { id: "github", name: "GitHub" },
];

export default function Demo() {
  const [loading, setLoading] = useState<string | null>(null);
  const select = (id: string) => {
    setLoading(id);
    setTimeout(() => setLoading(null), 1500); // a real app redirects here
  };
  return (
    <div className="grid w-full max-w-sm gap-8">
      <OAuthButtons providers={PROVIDERS} onSelect={select} loadingId={loading} />
      <OAuthButtons providers={PROVIDERS} layout="row" onSelect={select} loadingId={loading} />
      <OAuthButtons providers={[{ id: "sso", name: "SAML SSO", href: "#sso" }]} labels={{ continueWith: (name) => `Sign in with ${name}` }} />
    </div>
  );
}
