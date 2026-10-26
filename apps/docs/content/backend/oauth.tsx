import { C, Callout, Code, Endpoints, Errors, H2, LI, P, Settings, UL } from "@/components/backend/prose";

export default function OAuth() {
  return (
    <>
      <P>
        <C>pleate_backend.oauth</C> signs users in with Google, GitHub, Apple or any OpenID Connect provider (Okta, Auth0,
        Keycloak, Microsoft Entra...). It is mounted at <C>/api/auth/oauth</C>. The flow is a full page redirect with
        state, nonce and a PKCE (S256) verifier kept in the session; no token ever reaches the browser.
      </P>

      <H2>Setup</H2>
      <P>
        Only the providers listed in <C>PROVIDERS</C> are enabled. Register the callback URL at the provider:{" "}
        <C>{"https://<your site>/api/auth/oauth/<provider>/callback"}</C>.
      </P>
      <Code lang="python" title="settings.py">{`
PLEATE["OAUTH"] = {
    "PROVIDERS": {
        "google": {"client_id": env("GOOGLE_CLIENT_ID"), "client_secret": env("GOOGLE_CLIENT_SECRET")},
        "github": {"client_id": env("GITHUB_CLIENT_ID"), "client_secret": env("GITHUB_CLIENT_SECRET")},
        "apple": {
            "client_id": "com.plate.web", "team_id": "ABCDE12345", "key_id": "XYZ987",
            "private_key": env("APPLE_PRIVATE_KEY"),
        },
        "okta": {
            "type": "oidc", "name": "Okta",
            "client_id": env("OKTA_CLIENT_ID"), "client_secret": env("OKTA_CLIENT_SECRET"),
            "discovery_url": "https://plate.okta.com/.well-known/openid-configuration",
            "scopes": ["openid", "email", "profile"],
        },
    },
    "ALLOW_SIGNUP": True,
}
`}</Code>
      <P>
        <C>type</C> picks the provider class and defaults to the key, so several OIDC providers can live side by side.
        Every entry accepts <C>name</C> and <C>scopes</C>. New types are added with{" "}
        <C>pleate_backend.oauth.providers.register_provider</C>.
      </P>

      <H2>Endpoints</H2>
      <Endpoints
        rows={[
          ["GET", "/auth/oauth/providers", <>Public. The enabled providers: <C>{"[{id, name}]"}</C>.</>],
          ["GET", "/auth/oauth/<provider>/start", <>Browser navigation. <C>?next=/path&mode=login|link&remember=1</C>. Redirects (302) to the provider.</>],
          ["GET|POST", "/auth/oauth/<provider>/callback", <>Where the provider returns. Always ends with a 302 to <C>{`FRONTEND_PATHS["OAUTH_DONE"]`}</C>.</>],
          ["GET", "/auth/oauth/accounts", <>Linked accounts: <C>{"[{id, provider, email, created_at, last_login_at}]"}</C>.</>],
          ["DELETE", "/auth/oauth/accounts/<id>", "Unlinks one. 204."],
        ]}
      />
      <P>
        <C>next</C> must be a path on the frontend; anything else becomes <C>/</C>, so the flow cannot be turned into an
        open redirect. Apple answers with a POST (<C>form_post</C>); the callback converts it into a 303 to itself with GET
        so the <C>SameSite=Lax</C> session cookie travels.
      </P>

      <H2>What the callback does</H2>
      <UL>
        <LI><strong>Known identity:</strong> signs in. If the user has 2FA the pending login is stored and the redirect carries <C>status=mfa_required</C>.</LI>
        <LI><strong>New identity:</strong> the provider must report a verified email. If an account already uses it, the result is <C>oauth_email_exists</C>: accounts are never linked automatically, the user signs in with the password and links from the settings. Otherwise a user is created, without a password and with the email verified, when <C>ALLOW_SIGNUP</C> is on.</LI>
        <LI><strong><C>mode=link</C>:</strong> attaches the identity to the signed in user.</LI>
      </UL>
      <P>
        The frontend page at <C>OAUTH_DONE</C> (default <C>/auth/oauth/done</C>) reads{" "}
        <C>?status=ok|error|mfa_required&code=…&next=…</C>:
      </P>
      <Code lang="tsx" title="app/auth/oauth/done/page.tsx">{`
"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { TwoFactorForm } from "pleate/auth/two-factor-form";
import { useLogin } from "pleate-client/react";

export default function OAuthDone() {
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get("next") ?? "/";
  const login = useLogin({ onSuccess: () => router.replace(next) });

  switch (params.get("status")) {
    case "ok":
      router.replace(next);
      return null;
    case "mfa_required":
      return <TwoFactorForm {...login.twoFactorFormProps} />;
    default:
      return <p>Sign in failed ({params.get("code")}).</p>;
  }
}
`}</Code>
      <P>
        The buttons come from <C>useOAuth()</C>: each provider becomes a link to its <C>start</C> URL.
      </P>
      <Code lang="tsx">{`
const oauth = useOAuth({ next: "/dashboard", remember: true });
<LoginForm {...login.loginFormProps} oauth={<OAuthButtons {...oauth.oauthButtonsProps} layout="row" />} />

// Settings page: link another provider, list and unlink
const link = useOAuth({ mode: "link", next: "/settings/security" });
const accounts = useSocialAccounts();   // accounts.data, accounts.unlink.mutate(id)
`}</Code>

      <H2>Settings</H2>
      <Settings
        rows={[
          ["PROVIDERS", "{}", "Enabled providers and their credentials."],
          ["ALLOW_SIGNUP", "True", "Create accounts for new identities."],
          ["CALLBACK_BASE_URL", "None", <>Origin of the callback registered at the provider, e.g. <C>https://api.plate.app</C>. Defaults to the request origin.</>],
        ]}
      />

      <H2>Error codes</H2>
      <P>Returned as <C>code</C> on the redirect, or as JSON errors from <C>start</C> and the account endpoints.</P>
      <Errors
        rows={[
          ["oauth_unknown_provider", "404", "The provider is not configured."],
          ["invalid_mode", "400", <><C>mode</C> is not login or link.</>],
          ["not_authenticated", "401", <><C>mode=link</C> without a signed in user.</>],
          ["oauth_state_mismatch", "redirect", "State missing or different: an expired or forged callback."],
          ["oauth_provider_error", "redirect", "The provider refused or failed the exchange."],
          ["oauth_email_unverified", "redirect", "The provider did not report a verified email."],
          ["oauth_email_exists", "redirect", "Another account already uses this email."],
          ["oauth_signup_disabled", "redirect", <>New identity and <C>ALLOW_SIGNUP</C> is off.</>],
          ["oauth_already_linked", "redirect", "The identity belongs to another user."],
          ["account_inactive", "redirect", "The account is deactivated."],
          ["last_login_method", "400", "Unlinking would leave the user with no way to sign in."],
        ]}
      />
      <Callout>
        Signals <C>social_account_linked</C> and <C>social_account_unlinked</C> send <C>user</C>, <C>request</C> and{" "}
        <C>social_account</C>; a signup through OAuth also sends <C>user_signed_up</C>. <C>/auth/me</C> gets{" "}
        <C>extra.oauth_providers</C>, and linking or unlinking emails a security notice.
      </Callout>
    </>
  );
}
