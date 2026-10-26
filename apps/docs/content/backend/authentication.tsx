import { C, Callout, Code, Endpoints, Errors, H2, H3, LI, P, Settings, Table, UL } from "@/components/backend/prose";
import { LiveDemo } from "@/components/backend/live-demo";
import ForgotPasswordDemo from "@/demos/backend/forgot-password";
import LoginDemo from "@/demos/backend/login";
import SessionsDemo from "@/demos/backend/sessions";
import SignupDemo from "@/demos/backend/signup";

export default function Authentication() {
  return (
    <>
      <P>
        <C>pleate_backend.accounts</C> holds the user model (<C>pleate_accounts.User</C>, email as the username) and every
        account flow. It is mounted at <C>/api/auth</C>. Passwords are hashed with Argon2, must be at least 10 characters
        and pass Django&apos;s similarity, common and numeric validators.
      </P>

      <LiveDemo
        file="login"
        title="Sign in, with the 2FA step"
        description="useLogin drives both forms: the password step, then the code step when the account has 2FA."
        hint={
          <>
            <C>ada@plate.dev</C> or <C>mfa@plate.dev</C> (code <C>123456</C>), password <C>plate-demo-2026</C>
          </>
        }
      >
        <LoginDemo />
      </LiveDemo>

      <H2>Endpoints</H2>
      <Endpoints
        rows={[
          ["POST", "/auth/signup", <>Creates an account: <C>{"{email, password, name?, locale?}"}</C> → 201 <C>{"{user, verification_required}"}</C>. Signs in unless verification is required.</>],
          ["POST", "/auth/login", <><C>{"{email, password, remember?}"}</C> → <C>{"{user, mfa_required: false}"}</C>, or <C>{"{mfa_required: true, methods}"}</C> when 2FA applies.</>],
          ["POST", "/auth/logout", "Ends the current session. 204."],
          ["GET", "/auth/me", <>The signed in user, with <C>extra</C> fields from other apps.</>],
          ["PATCH", "/auth/me", <><C>name</C>, <C>locale</C>, <C>timezone</C>, <C>preferences</C> (merged, a small object). Setting <C>locale</C> also sets the <C>locale</C> cookie.</>],
          ["DELETE", "/auth/me", <>Deletes the account: <C>{"{password}"}</C>, or <C>{"{confirm_email}"}</C> for accounts without a password. 204.</>],
          ["GET", "/auth/me/export", "Every piece of the user's data as a JSON download (each app adds its section)."],
          ["PUT|DELETE", "/auth/me/avatar", <>Uploads (multipart <C>file</C>, at most 2 MB, cropped to 512 px WebP) or removes the avatar.</>],
          ["GET", "/auth/avatars/<user_id>", "Serves an avatar to signed in users."],
          ["POST", "/auth/password/change", <><C>{"{current_password, new_password}"}</C>. <C>current_password</C> only when the account has one. 204.</>],
          ["POST", "/auth/password/reset", <><C>{"{email}"}</C>. Always 202, whether or not the email exists.</>],
          ["POST", "/auth/password/reset/validate", <><C>{"{token}"}</C> → <C>{"{valid}"}</C>, to show an expired link before the user types.</>],
          ["POST", "/auth/password/reset/confirm", <><C>{"{token, new_password}"}</C>. Verifies the email, signs out every session. 204.</>],
          ["POST", "/auth/email/verify", <><C>{"{token}"}</C> from the link → the user.</>],
          ["POST", "/auth/email/verify/resend", "Sends the link again to the signed in user. 202."],
          ["POST", "/auth/email/change", <><C>{"{new_email, password}"}</C>. Emails a confirmation link to the new address. 202.</>],
          ["POST", "/auth/email/change/confirm", <><C>{"{token}"}</C> → the user with the new email. The old address gets a security notice.</>],
          ["GET", "/auth/sessions", "Signed in devices: browser, OS, IP, last seen, which one is current."],
          ["DELETE", "/auth/sessions/<id>", "Signs one device out (yourself included). 204."],
          ["POST", "/auth/sessions/revoke-others", <>Signs out everywhere else → <C>{"{count}"}</C>.</>],
        ]}
      />

      <H3>The user</H3>
      <Code lang="json" title="GET /api/auth/me">{`
{
  "id": "6720c1f4a3b2c1d0e9f8a7b6",
  "email": "ada@plate.dev",
  "name": "Ada Lovelace",
  "display_name": "Ada Lovelace",
  "email_verified": true,
  "locale": "en",
  "timezone": "Europe/Rome",
  "preferences": { "theme": "dark" },
  "avatar_url": "/api/auth/avatars/6720c1f4a3b2c1d0e9f8a7b6?v=1a2b3c4d",
  "has_password": true,
  "is_staff": false,
  "date_joined": "2026-03-14T09:12:00Z",
  "extra": {
    "roles": ["editor"],
    "permissions": ["catalog.change_product"],
    "features": ["new-editor"],
    "mfa_enabled": true,
    "oauth_providers": ["google"],
    "subscription": { "plan_id": "pro", "status": "active", "current_period_end": "2026-11-14T09:12:00Z", "cancel_at_period_end": false }
  }
}
`}</Code>
      <P>
        <C>extra</C> is filled by the installed apps. Add your own field from any app&apos;s <C>ready()</C>:
      </P>
      <Code lang="python">{`
from pleate_backend.accounts.me import register_me_field

register_me_field("household", lambda user: user.household_id and str(user.household_id))
`}</Code>
      <P>
        On the frontend, <C>useMe()</C> returns the user or <C>null</C> (a 401 is not an error) plus{" "}
        <C>hasRole</C>, <C>hasPermission</C> and <C>hasFeature</C> helpers.
      </P>

      <H2>Signing up</H2>
      <LiveDemo
        file="signup"
        title="Sign up"
        description="Server validation errors (taken email, weak password) land under the right field."
      >
        <SignupDemo />
      </LiveDemo>
      <P>
        Signup sends the <C>verify_email</C> email with a link to <C>{`FRONTEND_PATHS["VERIFY_EMAIL"]`}</C>. With{" "}
        <C>REQUIRE_EMAIL_VERIFICATION</C> off (the default) the user is signed in at once and can verify later; with it
        on, login answers <C>email_not_verified</C> until the link is opened. The page behind the link calls{" "}
        <C>useVerifyEmail(token)</C>.
      </P>

      <H2>Passwords</H2>
      <LiveDemo
        file="forgot-password"
        title="Forgot password"
        description="The answer is the same for every email, so the form cannot be used to find accounts."
      >
        <ForgotPasswordDemo />
      </LiveDemo>
      <P>
        The reset email links to <C>{`FRONTEND_PATHS["RESET_PASSWORD"]`}</C> with a token valid for{" "}
        <C>PASSWORD_RESET_TIMEOUT</C> (one hour). The token stops working once the password changes, and at most three
        emails per address are sent per hour. On that page:
      </P>
      <Code lang="tsx" title="app/reset-password/page.tsx">{`
"use client";
import { ResetPasswordForm } from "pleate/auth/reset-password-form";
import { useResetPassword } from "pleate-client/react";
import { useSearchParams } from "next/navigation";

export default function ResetPassword() {
  const token = useSearchParams().get("token");
  const reset = useResetPassword(token, { onSuccess: () => location.assign("/login") });
  if (reset.checkingToken) return null;
  if (!reset.tokenValid) return <p>This link expired. Ask for a new one.</p>;
  return <ResetPasswordForm {...reset.resetPasswordFormProps} />;
}
`}</Code>
      <P>
        A successful reset or password change signs out every other session and emails a security notice.
      </P>

      <H2>Login protection</H2>
      <P>
        Failed logins are counted per account and per IP address in a sliding window. Past the limit the endpoint answers
        429 <C>too_many_attempts</C> with <C>retry_after</C>, even for the right password. A successful login or reset
        clears the account counter. The counters fail closed: if the cache is down, logins are refused rather than left
        unprotected.
      </P>

      <H2>Sessions</H2>
      <LiveDemo
        file="sessions"
        title="Signed in devices"
        description="Each session stores its browser, OS and IP. Revoke one, or every device but this one."
        signIn
        hint={<>Signed in as <C>ada@plate.dev</C></>}
      >
        <SessionsDemo />
      </LiveDemo>
      <P>
        Sessions use a MongoDB backed engine (<C>pleate_backend.accounts.sessions</C>) that keeps one row per session with
        the user, IP, user agent and last activity, refreshed by <C>SessionActivityMiddleware</C>. Ids in the API are
        derived from the session key, never the key itself.
      </P>

      <H2>Export and deletion</H2>
      <P>
        <C>GET /auth/me/export</C> answers a JSON file with the account and a section from each app (files, notifications,
        activity, API keys, conversations, billing...). Apps contribute through the <C>collect_user_data</C> signal:
      </P>
      <Code lang="python">{`
from django.dispatch import receiver
from pleate_backend.accounts.signals import collect_user_data

@receiver(collect_user_data)
def export_orders(sender, user, request, **kwargs):
    return "orders", list(Order.objects.filter(user=user).values("id", "total", "created_at"))
`}</Code>
      <P>
        Deleting the account requires the password (or typing the email when the account has none and{" "}
        <C>DELETE_ACCOUNT_REQUIRES_PASSWORD</C> is on), sends <C>account_deleted</C>, signs out every session and deletes
        the user. Foreign keys cascade; blobs that live outside MongoDB, such as files in S3, are removed by{" "}
        <C>pre_delete</C> handlers.
      </P>

      <H2>Settings</H2>
      <P>
        <C>{`PLEATE["AUTH"]`}</C>, merged key by key with the defaults:
      </P>
      <Settings
        rows={[
          ["SIGNUP_ENABLED", "True", <>False closes signup (<C>signup_disabled</C>).</>],
          ["REQUIRE_EMAIL_VERIFICATION", "False", "Refuse logins until the email is confirmed."],
          ["LOGIN_MAX_ATTEMPTS", "5", "Failed attempts per account in the window."],
          ["LOGIN_LOCKOUT_SECONDS", "900", "Length of the window."],
          ["LOGIN_IP_MAX_ATTEMPTS", "30", "Failed attempts per IP in the window."],
          ["REMEMBER_ME_AGE", "31536000", <>Session age in seconds with <C>remember</C> (one year).</>],
          ["EMAIL_TOKEN_MAX_AGE", "259200", "Validity of verification and email change links (three days)."],
          ["DELETE_ACCOUNT_REQUIRES_PASSWORD", "True", "Ask for the password before deleting."],
        ]}
      />
      <P>
        Links in emails are built from <C>{`PLEATE["FRONTEND_URL"]`}</C> and <C>{`PLEATE["FRONTEND_PATHS"]`}</C>:
      </P>
      <Table
        head={["Path key", "Default"]}
        mono={[0, 1]}
        rows={[
          ["VERIFY_EMAIL", "/verify-email?token={token}"],
          ["RESET_PASSWORD", "/reset-password?token={token}"],
          ["CONFIRM_EMAIL_CHANGE", "/confirm-email?token={token}"],
        ]}
      />

      <H2>Error codes</H2>
      <Errors
        rows={[
          ["signup_disabled", "403", "Signup is closed."],
          ["email_taken", "400 / 409", "On the email field at signup or change; 409 when confirming a change to a taken email."],
          ["weak_password", "400", "On the password field: too short, too common, numeric or too close to the email."],
          ["invalid_credentials", "400", "Email or password is wrong."],
          ["too_many_attempts", "429", <>Login locked for <C>retry_after</C> seconds.</>],
          ["email_not_verified", "403", "Verification is required and still pending."],
          ["wrong_password", "400", "Password check failed (change, email change, deletion)."],
          ["confirmation_required", "400", "Deleting a passwordless account without typing its email."],
          ["invalid_token", "400", "Reset, verification or email change link expired or already used."],
          ["invalid_image", "400", "The avatar is not a decodable image."],
        ]}
      />

      <H2>Signals</H2>
      <P>
        <C>pleate_backend.accounts.signals</C>. Audit, notifications and webhooks listen to them; so can you. All send{" "}
        <C>user</C> and <C>request</C>.
      </P>
      <UL>
        <LI><C>user_signed_up</C>, <C>email_verified</C>, <C>password_changed</C>, <C>password_reset</C></LI>
        <LI><C>email_changed</C> (also <C>old_email</C>), <C>sessions_revoked</C> (also <C>count</C>)</LI>
        <LI><C>account_deleted</C>, sent before deletion (also <C>email</C>)</LI>
        <LI><C>collect_user_data</C>, for the export</LI>
      </UL>
      <Callout tone="tip" title="Sign in from a server component">
        The session cookie is <C>HttpOnly</C>. To call the API from a server component, forward it:{" "}
        <C>{`createPleateClient({ baseUrl: "http://django:8000/api", headers: { cookie: (await cookies()).toString() } })`}</C>.
      </Callout>
    </>
  );
}
