"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { Me } from "../api.ts";
import { ApiError } from "../errors.ts";
import { errorProps, mapFields } from "./forms.ts";
import { keys, usePleateClient } from "./provider.tsx";

/** The signed in user, or `null` when signed out (no error thrown on 401). */
export function useMe() {
  const client = usePleateClient();
  const query = useQuery({
    queryKey: keys.me,
    queryFn: async () => {
      try {
        return await client.auth.me();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
  });
  const user = query.data ?? null;
  return {
    ...query,
    user,
    isSignedIn: !!user,
    hasPermission: (perm: string) => !!user?.extra.permissions?.includes(perm),
    hasRole: (role: string) => !!user?.extra.roles?.includes(role),
    hasFeature: (key: string) => !!user?.extra.features?.includes(key),
  };
}

export function useUpdateMe() {
  const client = usePleateClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: client.auth.updateMe,
    onSuccess: (me) => qc.setQueryData(keys.me, me),
  });
}

type LoginValues = { email: string; password: string; remember: boolean };
type TwoFactorValues = { code: string; method: "otp" | "backup" };

/**
 * Password login with the optional 2FA step.
 *
 *     const login = useLogin({ onSuccess: () => router.push("/") });
 *     return login.mfaRequired
 *       ? <TwoFactorForm {...login.twoFactorFormProps} />
 *       : <LoginForm {...login.loginFormProps} />;
 */
export function useLogin(options: { onSuccess?: (user: Me) => void } = {}) {
  const client = usePleateClient();
  const qc = useQueryClient();
  const [mfaRequired, setMfaRequired] = useState(false);

  const done = (user: Me) => {
    qc.setQueryData(keys.me, user);
    qc.invalidateQueries({ queryKey: ["pleate"], refetchType: "none" });
    options.onSuccess?.(user);
  };

  const login = useMutation({
    mutationFn: (values: LoginValues) => client.auth.login(values),
    onSuccess: (result) => {
      if (result.mfa_required) setMfaRequired(true);
      else if (result.user) done(result.user);
    },
  });

  const verify = useMutation({
    mutationFn: (values: TwoFactorValues) =>
      client.mfa.verify(values.method === "backup" ? { backup_code: values.code } : { code: values.code }),
    onSuccess: (result) => done(result.user),
    onError: (error) => {
      if (error instanceof ApiError && error.code === "mfa_pending_expired") setMfaRequired(false);
    },
  });

  return {
    login,
    verify,
    mfaRequired,
    reset: () => {
      setMfaRequired(false);
      login.reset();
      verify.reset();
    },
    /** For <LoginForm>. */
    loginFormProps: {
      onSubmit: async (values: LoginValues) => {
        await login.mutateAsync(values).catch(() => {});
      },
      loading: login.isPending,
      ...errorProps(login.error),
    },
    /** For <TwoFactorForm>. */
    twoFactorFormProps: {
      onSubmit: async (values: TwoFactorValues) => {
        await verify.mutateAsync(values).catch(() => {});
      },
      loading: verify.isPending,
      error: errorProps(verify.error).error,
    },
  };
}

type SignupValues = { name: string; email: string; password: string; acceptTerms: boolean };

export function useSignup(options: { onSuccess?: (result: { user: Me; verification_required: boolean }) => void } = {}) {
  const client = usePleateClient();
  const qc = useQueryClient();
  const signup = useMutation({
    mutationFn: (values: SignupValues & { locale?: string }) =>
      client.auth.signup({
        name: values.name,
        email: values.email,
        password: values.password,
        ...(values.locale ? { locale: values.locale as "en" } : {}),
      }),
    onSuccess: (result) => {
      if (!result.verification_required) qc.setQueryData(keys.me, result.user);
      options.onSuccess?.(result);
    },
  });
  return {
    signup,
    verificationRequired: signup.data?.verification_required ?? false,
    /** For <SignupForm>. */
    signupFormProps: {
      onSubmit: async (values: SignupValues) => {
        await signup.mutateAsync(values).catch(() => {});
      },
      loading: signup.isPending,
      ...errorProps(signup.error),
    },
  };
}

export function useLogout(options: { onSuccess?: () => void } = {}) {
  const client = usePleateClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: client.auth.logout,
    onSuccess: () => {
      qc.setQueryData(keys.me, null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] === "pleate" && q.queryKey[1] !== "me" });
      options.onSuccess?.();
    },
  });
}

/** For <ForgotPasswordForm>. The backend never reveals whether the email exists. */
export function useForgotPassword() {
  const client = usePleateClient();
  const mutation = useMutation({ mutationFn: (email: string) => client.auth.requestPasswordReset(email) });
  return {
    ...mutation,
    forgotPasswordFormProps: {
      onSubmit: async (values: { email: string }) => {
        await mutation.mutateAsync(values.email);
      },
      loading: mutation.isPending,
      sent: mutation.isSuccess,
      onSentChange: (sent: boolean) => {
        if (!sent) mutation.reset();
      },
      ...errorProps(mutation.error),
    },
  };
}

/** For <ResetPasswordForm>. `token` comes from the link in the email (?token=...). */
export function useResetPassword(token: string | null | undefined, options: { onSuccess?: () => void } = {}) {
  const client = usePleateClient();
  const validity = useQuery({
    queryKey: ["pleate", "reset-token", token],
    queryFn: () => client.auth.validateResetToken(token as string),
    enabled: !!token,
    staleTime: Infinity,
  });
  const mutation = useMutation({
    mutationFn: (password: string) => client.auth.resetPassword(token as string, password),
    onSuccess: () => options.onSuccess?.(),
  });
  return {
    ...mutation,
    tokenValid: token ? validity.data?.valid : false,
    checkingToken: validity.isPending && !!token,
    resetPasswordFormProps: {
      onSubmit: async (values: { password: string; confirmPassword: string }) => {
        await mutation.mutateAsync(values.password).catch(() => {});
      },
      loading: mutation.isPending,
      ...mapFields(errorProps(mutation.error), { new_password: "password" }),
    },
  };
}

/** Confirms the email from the link (?token=...). Runs once on mount. */
export function useVerifyEmail(token: string | null | undefined) {
  const client = usePleateClient();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["pleate", "verify-email", token],
    queryFn: async () => {
      const me = await client.auth.verifyEmail(token as string);
      qc.setQueryData(keys.me, (prev: Me | null | undefined) => (prev ? me : prev));
      return me;
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });
}

/**
 * Enrolment in two factor authentication, for <TwoFactorSetup>.
 * Call `start()` (e.g. when the dialog opens) to get the QR code.
 */
export function useTwoFactorSetup(options: { onDone?: () => void } = {}) {
  const client = usePleateClient();
  const qc = useQueryClient();
  const status = useQuery({ queryKey: keys.mfa, queryFn: client.mfa.status });
  const setup = useMutation({ mutationFn: client.mfa.setup });
  const confirm = useMutation({ mutationFn: (code: string) => client.mfa.confirm(code) });
  const disable = useMutation({
    mutationFn: client.mfa.disable,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.mfa });
      qc.invalidateQueries({ queryKey: keys.me });
    },
  });
  return {
    status,
    enabled: status.data?.enabled ?? false,
    start: () => setup.mutateAsync(),
    starting: setup.isPending,
    disable,
    twoFactorSetupProps: setup.data
      ? {
          qrSvg: setup.data.qr_svg,
          secret: setup.data.secret,
          onVerify: async (code: string) => {
            const result = await confirm.mutateAsync(code);
            qc.invalidateQueries({ queryKey: keys.mfa });
            qc.invalidateQueries({ queryKey: keys.me });
            return { backupCodes: result.backup_codes };
          },
          onDone: options.onDone,
          error: errorProps(confirm.error).error,
        }
      : null,
  };
}

/**
 * OAuth providers configured on the backend, for <OAuthButtons>. Each button
 * is a link that starts the flow; the backend redirects back to
 * PLEATE["FRONTEND_PATHS"]["OAUTH_DONE"] with ?status=ok|error|mfa_required.
 */
export function useOAuth(options: { next?: string; mode?: "login" | "link"; remember?: boolean } = {}) {
  const client = usePleateClient();
  const providers = useQuery({ queryKey: keys.oauthProviders, queryFn: client.oauth.providers, staleTime: Infinity });
  return {
    ...providers,
    oauthButtonsProps: {
      providers: (providers.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        href: client.oauth.startUrl(p.id, options),
      })),
    },
  };
}

/** Linked social accounts, with unlink. */
export function useSocialAccounts() {
  const client = usePleateClient();
  const qc = useQueryClient();
  const accounts = useQuery({ queryKey: keys.oauthAccounts, queryFn: client.oauth.accounts });
  const unlink = useMutation({
    mutationFn: client.oauth.unlink,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.oauthAccounts }),
  });
  return { ...accounts, unlink };
}

/** Devices signed in to the account, for <SessionList>. */
export function useSessions() {
  const client = usePleateClient();
  const qc = useQueryClient();
  const [revoking, setRevoking] = useState<string[]>([]);
  const sessions = useQuery({ queryKey: keys.sessions, queryFn: client.sessions.list });
  const refresh = () => qc.invalidateQueries({ queryKey: keys.sessions });
  return {
    ...sessions,
    sessionListProps: {
      sessions: (sessions.data ?? []).map((s) => ({
        id: s.id,
        browser: s.browser,
        os: s.os,
        mobile: s.mobile,
        ip: s.ip,
        lastSeenAt: s.last_seen_at,
        current: s.current,
      })),
      loading: sessions.isPending,
      revokingIds: revoking,
      onRevoke: async (id: string) => {
        setRevoking((r) => [...r, id]);
        try {
          await client.sessions.revoke(id);
          await refresh();
        } finally {
          setRevoking((r) => r.filter((x) => x !== id));
        }
      },
      onRevokeOthers: async () => {
        await client.sessions.revokeOthers();
        await refresh();
      },
    },
  };
}

/** Personal API keys, for <ApiKeyList>. */
export function useApiKeys() {
  const client = usePleateClient();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: keys.apiKeys, queryFn: () => client.apiKeys.list({ page_size: 100 }) });
  const refresh = () => qc.invalidateQueries({ queryKey: keys.apiKeys });
  return {
    ...list,
    apiKeyListProps: {
      keys: (list.data?.results ?? [])
        .filter((k) => k.status !== "revoked")
        .map((k) => ({
          id: k.id,
          name: k.name,
          prefix: k.prefix,
          scopes: k.scopes,
          createdAt: k.created_at,
          lastUsedAt: k.last_used_at,
          expiresAt: k.expires_at,
        })),
      scopes: [
        { value: "read", label: "Read", description: "GET requests only." },
        { value: "write", label: "Write", description: "Create, change and delete." },
      ],
      defaultScopes: ["read"],
      loading: list.isPending,
      onCreate: async (values: { name: string; scopes: string[]; expiresInDays: number | null }) => {
        const created = await client.apiKeys.create({
          name: values.name,
          scopes: values.scopes as ("read" | "write")[],
          ...(values.expiresInDays ? { expires_in_days: values.expiresInDays } : {}),
        });
        await refresh();
        return { key: created.key };
      },
      onRevoke: async (id: string) => {
        await client.apiKeys.revoke(id);
        await refresh();
      },
    },
  };
}
