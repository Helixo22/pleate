import { act, renderHook, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { DEMO_BACKUP_CODE, DEMO_PASSWORD, DEMO_TOTP_CODE, MFA_EMAIL, VALID_TOKEN } from "../mock/index.ts";
import { createTestBackend } from "../test/backend.ts";
import { wrapper } from "../test/wrapper.tsx";
import {
  useApiKeys,
  useForgotPassword,
  useLogin,
  useLogout,
  useMe,
  useResetPassword,
  useSessions,
  useSignup,
  useTwoFactorSetup,
} from "./auth.ts";

const { db, server } = createTestBackend({ signedIn: false });
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => db.reset());
afterAll(() => server.close());

function signInAda() {
  const ada = db.users.find((u) => u.email === "ada@plate.dev")!;
  db.auth = { userId: ada.id, sessionId: db.sessions.find((s) => s._owner === ada.id && s.browser === "Chrome")!.id, pendingMfa: null };
}

describe("useMe and useLogout", () => {
  it("is null when signed out (no error) and follows logout", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => ({ me: useMe(), logout: useLogout() }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.me.isSuccess).toBe(true));
    expect(result.current.me.user).toBeNull();
    expect(result.current.me.isSignedIn).toBe(false);

    signInAda();
    const second = wrapper();
    const { result: signed } = renderHook(() => ({ me: useMe(), logout: useLogout() }), { wrapper: second.Wrapper });
    await waitFor(() => expect(signed.current.me.isSignedIn).toBe(true));
    expect(signed.current.me.hasRole("admin")).toBe(true);
    expect(signed.current.me.hasPermission("pleate_accounts.view_user")).toBe(true);
    expect(signed.current.me.hasFeature("new-dashboard")).toBe(true);
    expect(signed.current.me.hasFeature("gift-cards")).toBe(false);
    await act(() => signed.current.logout.mutateAsync());
    await waitFor(() => expect(signed.current.me.user).toBeNull());
    expect(db.auth.userId).toBeNull();
  });
});

describe("useLogin", () => {
  it("shows the backend message on wrong credentials and field errors on invalid input", async () => {
    const { Wrapper } = wrapper();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useLogin({ onSuccess }), { wrapper: Wrapper });
    expect(result.current.loginFormProps).toMatchObject({ loading: false });
    await act(() => result.current.loginFormProps.onSubmit({ email: "ada@plate.dev", password: "nope nope", remember: false }));
    await waitFor(() => expect(result.current.loginFormProps.error).toBe("Email or password is wrong."));
    expect(result.current.loginFormProps.fieldErrors).toEqual({});
    await act(() => result.current.loginFormProps.onSubmit({ email: "not an email", password: "x", remember: false }));
    await waitFor(() => expect(result.current.loginFormProps.fieldErrors).toEqual({ email: "Enter a valid email address." }));
    expect(result.current.loginFormProps.error).toBeUndefined();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.mfaRequired).toBe(false);
  });

  it("signs in and fills the useMe cache", async () => {
    const { Wrapper } = wrapper();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => ({ login: useLogin({ onSuccess }), me: useMe() }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.me.isSuccess).toBe(true));
    await act(() =>
      result.current.login.loginFormProps.onSubmit({ email: "ada@plate.dev", password: DEMO_PASSWORD, remember: true }),
    );
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ email: "ada@plate.dev" }));
    await waitFor(() => expect(result.current.me.user?.email).toBe("ada@plate.dev"));
    expect(result.current.login.loginFormProps.loading).toBe(false);
    expect(result.current.login.loginFormProps.error).toBeUndefined();
  });

  it("asks for the second factor, shows code errors, accepts TOTP and backup codes", async () => {
    const { Wrapper } = wrapper();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useLogin({ onSuccess }), { wrapper: Wrapper });
    await act(() => result.current.loginFormProps.onSubmit({ email: MFA_EMAIL, password: DEMO_PASSWORD, remember: false }));
    expect(result.current.mfaRequired).toBe(true);
    expect(onSuccess).not.toHaveBeenCalled();
    await act(() => result.current.twoFactorFormProps.onSubmit({ code: "000000", method: "otp" }));
    await waitFor(() => expect(result.current.twoFactorFormProps.error).toBe("The code is not valid."));
    expect(result.current.mfaRequired).toBe(true);
    await act(() => result.current.twoFactorFormProps.onSubmit({ code: DEMO_TOTP_CODE, method: "otp" }));
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ email: MFA_EMAIL }));
    await waitFor(() => expect(result.current.twoFactorFormProps.error).toBeUndefined());

    act(() => result.current.reset());
    expect(result.current.mfaRequired).toBe(false);
    await act(() => result.current.loginFormProps.onSubmit({ email: MFA_EMAIL, password: DEMO_PASSWORD, remember: false }));
    await act(() => result.current.twoFactorFormProps.onSubmit({ code: DEMO_BACKUP_CODE, method: "backup" }));
    expect(onSuccess).toHaveBeenCalledTimes(2);
  });

  it("goes back to the password step when the pending login expired", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });
    await act(() => result.current.loginFormProps.onSubmit({ email: MFA_EMAIL, password: DEMO_PASSWORD, remember: false }));
    expect(result.current.mfaRequired).toBe(true);
    db.auth.pendingMfa = null;
    await act(() => result.current.twoFactorFormProps.onSubmit({ code: DEMO_TOTP_CODE, method: "otp" }));
    expect(result.current.mfaRequired).toBe(false);
  });
});

describe("useSignup", () => {
  it("maps field errors and signs the new user in", async () => {
    const { Wrapper } = wrapper();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => ({ signup: useSignup({ onSuccess }), me: useMe() }), { wrapper: Wrapper });
    const values = { name: "Nina", email: "ada@plate.dev", password: "short", acceptTerms: true };
    await act(() => result.current.signup.signupFormProps.onSubmit(values));
    await waitFor(() =>
      expect(result.current.signup.signupFormProps.fieldErrors).toEqual({
        email: "An account with this email already exists.",
      }),
    );
    expect(result.current.signup.signupFormProps.error).toBeUndefined();
    await act(() => result.current.signup.signupFormProps.onSubmit({ ...values, email: "nina@plate.dev" }));
    await waitFor(() =>
      expect(result.current.signup.signupFormProps.fieldErrors).toEqual({
        password: "This password is too short. It must contain at least 10 characters.",
      }),
    );
    await act(() => result.current.signup.signupFormProps.onSubmit({ ...values, email: "nina@plate.dev", password: "a long password" }));
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ verification_required: false }));
    await waitFor(() => expect(result.current.signup.signupFormProps.fieldErrors).toBeUndefined());
    expect(result.current.signup.verificationRequired).toBe(false);
    await waitFor(() => expect(result.current.me.user?.email).toBe("nina@plate.dev"));
  });
});

describe("useForgotPassword", () => {
  it("switches to the sent state and back", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useForgotPassword(), { wrapper: Wrapper });
    expect(result.current.forgotPasswordFormProps.sent).toBe(false);
    await act(() => result.current.forgotPasswordFormProps.onSubmit({ email: "someone@plate.dev" }));
    await waitFor(() => expect(result.current.forgotPasswordFormProps.sent).toBe(true));
    expect(result.current.forgotPasswordFormProps.error).toBeUndefined();
    act(() => result.current.forgotPasswordFormProps.onSentChange(false));
    await waitFor(() => expect(result.current.forgotPasswordFormProps.sent).toBe(false));
  });
});

describe("useResetPassword", () => {
  it("reports the token validity", async () => {
    const { Wrapper } = wrapper();
    const none = renderHook(() => useResetPassword(null), { wrapper: Wrapper });
    expect(none.result.current).toMatchObject({ tokenValid: false, checkingToken: false });
    const bad = renderHook(() => useResetPassword("expired"), { wrapper: Wrapper });
    expect(bad.result.current.checkingToken).toBe(true);
    await waitFor(() => expect(bad.result.current.checkingToken).toBe(false));
    expect(bad.result.current.tokenValid).toBe(false);
    const good = renderHook(() => useResetPassword(VALID_TOKEN), { wrapper: Wrapper });
    await waitFor(() => expect(good.result.current.tokenValid).toBe(true));
  });

  it("maps new_password errors to the password field and calls onSuccess", async () => {
    const { Wrapper } = wrapper();
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useResetPassword(VALID_TOKEN, { onSuccess }), { wrapper: Wrapper });
    await act(() => result.current.resetPasswordFormProps.onSubmit({ password: "short", confirmPassword: "short" }));
    await waitFor(() =>
      expect(result.current.resetPasswordFormProps.fieldErrors).toEqual({
        password: "This password is too short. It must contain at least 10 characters.",
      }),
    );
    expect(onSuccess).not.toHaveBeenCalled();
    await act(() =>
      result.current.resetPasswordFormProps.onSubmit({ password: "a fresh password", confirmPassword: "a fresh password" }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(db.users.find((u) => u.email === "ada@plate.dev")?.password).toBe("a fresh password");
  });
});

describe("useTwoFactorSetup", () => {
  it("starts, rejects a wrong code, then confirms and returns backup codes", async () => {
    signInAda();
    const { Wrapper } = wrapper();
    const onDone = vi.fn();
    const { result } = renderHook(() => useTwoFactorSetup({ onDone }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status.isSuccess).toBe(true));
    expect(result.current.enabled).toBe(false);
    expect(result.current.twoFactorSetupProps).toBeNull();
    await act(async () => {
      await result.current.start();
    });
    await waitFor(() => expect(result.current.twoFactorSetupProps).not.toBeNull());
    const props = result.current.twoFactorSetupProps!;
    expect(props.qrSvg).toMatch(/^<svg/);
    expect(props.secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(props.onDone).toBe(onDone);
    await act(async () => {
      await expect(props.onVerify("000000")).rejects.toMatchObject({ code: "invalid_code" });
    });
    await waitFor(() => expect(result.current.twoFactorSetupProps?.error).toBe("The code is not valid."));
    let codes: { backupCodes: string[] } | undefined;
    await act(async () => {
      codes = await result.current.twoFactorSetupProps!.onVerify(DEMO_TOTP_CODE);
    });
    expect(codes?.backupCodes).toHaveLength(10);
    await waitFor(() => expect(result.current.enabled).toBe(true));
    await act(() => result.current.disable.mutateAsync({ password: DEMO_PASSWORD, code: DEMO_TOTP_CODE }));
    await waitFor(() => expect(result.current.enabled).toBe(false));
  });
});

describe("useSessions", () => {
  it("lists devices and revokes them", async () => {
    signInAda();
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useSessions(), { wrapper: Wrapper });
    expect(result.current.sessionListProps.loading).toBe(true);
    await waitFor(() => expect(result.current.sessionListProps.sessions).toHaveLength(3));
    const sessions = result.current.sessionListProps.sessions;
    expect(sessions.filter((s) => s.current)).toHaveLength(1);
    expect(Object.keys(sessions[0]).sort()).toEqual(["browser", "current", "id", "ip", "lastSeenAt", "mobile", "os"]);
    const other = sessions.find((s) => !s.current)!;
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.sessionListProps.onRevoke(other.id);
    });
    expect(result.current.sessionListProps.revokingIds).toEqual([other.id]);
    await act(() => pending);
    expect(result.current.sessionListProps.revokingIds).toEqual([]);
    await waitFor(() => expect(result.current.sessionListProps.sessions).toHaveLength(2));
    await act(() => result.current.sessionListProps.onRevokeOthers());
    await waitFor(() => expect(result.current.sessionListProps.sessions.map((s) => s.current)).toEqual([true]));
  });
});

describe("useApiKeys", () => {
  it("hides revoked keys, creates one (returning the key) and revokes it", async () => {
    signInAda();
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useApiKeys(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.apiKeyListProps.loading).toBe(false));
    expect(result.current.apiKeyListProps.keys.map((k) => k.name)).toEqual(["Staging", "Analytics export", "Production deploys"]);
    expect(result.current.apiKeyListProps.defaultScopes).toEqual(["read"]);
    expect(result.current.apiKeyListProps.scopes.map((s) => s.value)).toEqual(["read", "write"]);
    let created: { key: string } | undefined;
    await act(async () => {
      created = await result.current.apiKeyListProps.onCreate({ name: "Deploy bot", scopes: ["read", "write"], expiresInDays: 90 });
    });
    expect(created?.key).toMatch(/^pl_[A-Za-z0-9]{8}_[A-Za-z0-9_-]{43}$/);
    await waitFor(() => expect(result.current.apiKeyListProps.keys).toHaveLength(4));
    const fresh = result.current.apiKeyListProps.keys[0];
    expect(fresh).toMatchObject({ name: "Deploy bot", scopes: ["read", "write"], lastUsedAt: null });
    expect(created?.key.startsWith(`pl_${fresh.prefix}_`)).toBe(true);
    expect(fresh.expiresAt).not.toBeNull();
    await act(() => result.current.apiKeyListProps.onRevoke(fresh.id));
    await waitFor(() => expect(result.current.apiKeyListProps.keys.map((k) => k.name)).not.toContain("Deploy bot"));
  });
});
