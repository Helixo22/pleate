import { C, Code, Endpoints, Errors, H2, LI, P, Settings, UL } from "@/components/backend/prose";
import { LiveDemo } from "@/components/backend/live-demo";
import TwoFactorSetupDemo from "@/demos/backend/two-factor-setup";

export default function TwoFactor() {
  return (
    <>
      <P>
        <C>pleate_backend.mfa</C> adds TOTP codes (Google Authenticator, 1Password, Authy...) and single use backup codes,
        mounted at <C>/api/auth/mfa</C>. Every endpoint needs a signed in user, except <C>verify</C>, which is the second
        step of a login.
      </P>

      <LiveDemo
        file="two-factor-setup"
        title="Enrolment"
        description="Scan the QR code, type a code, save the backup codes. useTwoFactorSetup provides each step."
        signIn
        hint={<>The mock accepts the code <C>123456</C></>}
      >
        <TwoFactorSetupDemo />
      </LiveDemo>

      <H2>Endpoints</H2>
      <Endpoints
        rows={[
          ["GET", "/auth/mfa", <><C>{"{enabled, confirmed_at, backup_codes_remaining}"}</C></>],
          ["POST", "/auth/mfa/setup", <>Starts (or restarts) enrolment → <C>{"{secret, otpauth_url, qr_svg}"}</C>.</>],
          ["POST", "/auth/mfa/confirm", <><C>{"{code}"}</C>, the first code from the app. Turns 2FA on → <C>{"{backup_codes}"}</C>, shown only once.</>],
          ["POST", "/auth/mfa/disable", <><C>{"{password, code}"}</C>. <C>password</C> only when the account has one; <C>code</C> is a TOTP or a backup code. 204.</>],
          ["POST", "/auth/mfa/backup-codes", <><C>{"{code}"}</C> → a fresh set of <C>{"{backup_codes}"}</C>, replacing the old ones.</>],
          ["POST", "/auth/mfa/verify", <><C>{"{code}"}</C> or <C>{"{backup_code}"}</C> after a login that answered <C>mfa_required</C> → <C>{"{user, mfa_required: false}"}</C>.</>],
        ]}
      />

      <H2>The login step</H2>
      <P>
        When a user with 2FA signs in with the right password, <C>POST /auth/login</C> does not create a session. It
        answers <C>{`{"mfa_required": true, "methods": ["totp", "backup_code"]}`}</C> and keeps a pending login in the
        session for <C>PENDING_LOGIN_SECONDS</C>. The client then posts the code to <C>/auth/mfa/verify</C>. OAuth logins
        take the same path: the callback redirects with <C>status=mfa_required</C>.
      </P>
      <P>
        After five wrong codes, or when the time runs out, the pending login is dropped (<C>mfa_pending_expired</C>) and
        the user starts again from the password. <C>useLogin</C> handles this by switching back to the first form.
      </P>
      <Code lang="tsx">{`
const login = useLogin({ onSuccess: (user) => router.push("/") });

return login.mfaRequired
  ? <TwoFactorForm {...login.twoFactorFormProps} />   // posts {code} or {backup_code}
  : <LoginForm {...login.loginFormProps} />;
`}</Code>

      <H2>Security</H2>
      <UL>
        <LI>TOTP secrets are encrypted at rest with Fernet. The key is <C>ENCRYPTION_KEY</C>, or derived from <C>SECRET_KEY</C>; secrets encrypted under a key in <C>SECRET_KEY_FALLBACKS</C> stay readable, so keys can rotate.</LI>
        <LI>Backup codes are stored hashed and work once. Using one sends <C>backup_code_used</C> and is recorded in the activity log.</LI>
        <LI>Enabling and disabling 2FA email a security notice. The data export includes the state and dates, never secrets.</LI>
        <LI><C>verify</C> is CSRF protected and throttled with the <C>auth</C> scope.</LI>
      </UL>

      <H2>Settings</H2>
      <P><C>{`PLEATE["MFA"]`}</C>:</P>
      <Settings
        rows={[
          ["ISSUER", "None", <>Name shown in authenticator apps. Falls back to <C>SITE_NAME</C>.</>],
          ["BACKUP_CODES", "10", "How many backup codes are generated."],
          ["PENDING_LOGIN_SECONDS", "300", "Time to type the code after the password."],
          ["ENCRYPTION_KEY", "None", <>A Fernet key, or any string stretched with HKDF. Defaults to a key derived from <C>SECRET_KEY</C>.</>],
        ]}
      />

      <H2>Error codes</H2>
      <Errors
        rows={[
          ["mfa_already_enabled", "409", "setup or confirm when 2FA is already on."],
          ["mfa_setup_required", "400", "confirm without a started enrolment."],
          ["mfa_not_enabled", "400", "disable when 2FA is off."],
          ["invalid_code", "400", <>Wrong code. On <C>verify</C> the body also has <C>attempts_left</C>.</>],
          ["wrong_password", "400", "disable with the wrong password."],
          ["code_required", "400", "Neither a code nor a backup code was sent."],
          ["mfa_pending_expired", "400", "No pending login, expired, or five wrong codes."],
          ["too_many_attempts", "429", "Too many codes tried in a short time."],
        ]}
      />

      <H2>Signals and extras</H2>
      <P>
        <C>pleate_backend.mfa.signals</C> sends <C>mfa_enabled</C>, <C>mfa_disabled</C> and <C>backup_code_used</C> with{" "}
        <C>user</C> and <C>request</C>. <C>/auth/me</C> gets <C>extra.mfa_enabled</C>.
      </P>
    </>
  );
}
