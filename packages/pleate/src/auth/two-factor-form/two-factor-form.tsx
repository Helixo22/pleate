// TwoFactorForm: the second step of sign in. A 6 box code (authenticator app, SMS or email) that submits itself
// when complete, a switch to type a backup code instead, and an optional "send a new code" button with a cooldown.
// onSubmit receives the code and which method was used.
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/button/button.tsx";
import { Form, FormField } from "../../components/form/form.tsx";
import { Input } from "../../components/input/input.tsx";
import { OTPInput } from "../../components/otp-input/otp-input.tsx";
import { cn } from "../../lib/cn.ts";
import { Footer, FormError, SubmitButton, text, useSubmitError, type AuthFormBaseProps } from "../shared.tsx";

export type TwoFactorValues = { code: string; method: "otp" | "backup" };

export type TwoFactorFormLabels = {
  code?: string;
  backupCode?: string;
  backupPlaceholder?: string;
  submit?: string;
  useBackup?: string;
  useOtp?: string;
  codeRequired?: string;
  codeIncomplete?: (length: number) => string;
  backupRequired?: string;
  resend?: string;
  resendIn?: (seconds: number) => string;
  genericError?: string;
};

const L = {
  code: "Verification code",
  backupCode: "Backup code",
  backupPlaceholder: "xxxx-xxxx",
  submit: "Verify",
  useBackup: "Use a backup code",
  useOtp: "Use your authenticator code",
  codeRequired: "Enter the code.",
  codeIncomplete: (n: number) => `Enter all ${n} characters.`,
  backupRequired: "Enter one of your backup codes.",
  resend: "Send a new code",
  resendIn: (s: number) => `Send a new code in ${s}s`,
  genericError: "Something went wrong. Please try again.",
};

export type TwoFactorFormProps = AuthFormBaseProps<"code"> & {
  onSubmit: (values: TwoFactorValues) => void | Promise<void>;
  length?: number;
  /** Submit as soon as the last box is filled. */
  autoSubmit?: boolean;
  /** Offer the backup code switch. */
  allowBackupCode?: boolean;
  /** Shows "Send a new code" (for SMS or email codes). */
  onResend?: () => void | Promise<void>;
  /** Seconds before the resend button can be pressed again. */
  resendCooldown?: number;
  labels?: TwoFactorFormLabels;
};

export function TwoFactorForm({
  onSubmit,
  loading,
  error,
  fieldErrors,
  length = 6,
  autoSubmit = true,
  allowBackupCode = true,
  onResend,
  resendCooldown = 30,
  footer,
  labels,
  className,
}: TwoFactorFormProps) {
  const l = { ...L, ...labels };
  const { shownError, run } = useSubmitError(error, l.genericError);
  const [method, setMethod] = useState<"otp" | "backup">("otp");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  // A wrong code clears the boxes so the next attempt starts fresh.
  useEffect(() => {
    if (shownError && method === "otp") setCode("");
  }, [shownError, method]);

  const resend = async () => {
    if (!onResend) return;
    setResending(true);
    try {
      await onResend();
      setCooldown(resendCooldown);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={cn("flex w-full flex-col gap-5", className)}>
      <Form className="gap-4" onSubmit={(values) => run(() => onSubmit({ code: text(values.code).trim(), method }))}>
        <FormError error={shownError} />
        {method === "otp" ? (
          <FormField
            key="otp"
            name="code"
            className="items-center"
            required={{ value: true, message: l.codeRequired }}
            validate={(value) => (typeof value === "string" && value.length < length ? l.codeIncomplete(length) : undefined)}
            error={fieldErrors?.code}
          >
            <OTPInput
              length={length}
              value={code}
              onValueChange={setCode}
              autoFocus
              labels={{ group: l.code }}
              onComplete={() => {
                if (autoSubmit) queueMicrotask(() => box.current?.closest("form")?.requestSubmit());
              }}
            />
          </FormField>
        ) : (
          <FormField key="backup" name="code" label={l.backupCode} required={{ value: true, message: l.backupRequired }} error={fieldErrors?.code}>
            <Input autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder={l.backupPlaceholder} className="font-mono" autoFocus />
          </FormField>
        )}
        <div ref={box} className="pt-1">
          <SubmitButton loading={loading}>{l.submit}</SubmitButton>
        </div>
        <div className="flex flex-col items-center gap-1">
          {allowBackupCode && (
            <Button
              variant="plain"
              size="sm"
              onClick={() => {
                setMethod((m) => (m === "otp" ? "backup" : "otp"));
                setCode("");
              }}
            >
              {method === "otp" ? l.useBackup : l.useOtp}
            </Button>
          )}
          {onResend && method === "otp" && (
            <Button variant="plain" size="sm" tone="neutral" loading={resending} disabled={cooldown > 0} onClick={resend} className="text-fg-muted">
              <span className="pl-tabular" aria-live="polite">{cooldown > 0 ? l.resendIn(cooldown) : l.resend}</span>
            </Button>
          )}
        </div>
      </Form>
      <Footer>{footer}</Footer>
    </div>
  );
}
