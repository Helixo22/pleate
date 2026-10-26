// ResetPasswordForm: choose a new password and confirm it. The new one shows a strength meter; the confirmation must
// match. Keep the reset token in your own code (from the URL) and send it with the values.
"use client";

import { Form, FormField } from "../../components/form/form.tsx";
import { PasswordInput, scorePassword, type PasswordScore } from "../../components/password-input/password-input.tsx";
import { cn } from "../../lib/cn.ts";
import { Footer, FormError, SubmitButton, text, useSubmitError, type AuthFormBaseProps } from "../shared.tsx";

export type ResetPasswordValues = { password: string; confirmPassword: string };

export type ResetPasswordFormLabels = {
  password?: string;
  confirmPassword?: string;
  submit?: string;
  passwordRequired?: string;
  passwordTooShort?: (minLength: number) => string;
  passwordTooWeak?: string;
  confirmRequired?: string;
  mismatch?: string;
  genericError?: string;
};

const L = {
  password: "New password",
  confirmPassword: "Confirm new password",
  submit: "Update password",
  passwordRequired: "Choose a new password.",
  passwordTooShort: (n: number) => `Use at least ${n} characters.`,
  passwordTooWeak: "Choose a stronger password: mix words, numbers and symbols.",
  confirmRequired: "Type the new password again.",
  mismatch: "The passwords don't match.",
  genericError: "Something went wrong. Please try again.",
};

export type ResetPasswordFormProps = AuthFormBaseProps<"password" | "confirmPassword"> & {
  onSubmit: (values: ResetPasswordValues) => void | Promise<void>;
  minPasswordLength?: number;
  minStrength?: PasswordScore;
  showStrength?: boolean;
  labels?: ResetPasswordFormLabels;
};

export function ResetPasswordForm({
  onSubmit,
  loading,
  error,
  fieldErrors,
  minPasswordLength = 8,
  minStrength,
  showStrength = true,
  footer,
  labels,
  className,
}: ResetPasswordFormProps) {
  const l = { ...L, ...labels };
  const { shownError, run } = useSubmitError(error, l.genericError);
  return (
    <div className={cn("flex w-full flex-col gap-5", className)}>
      <Form
        className="gap-4"
        onSubmit={(values) => run(() => onSubmit({ password: text(values.password), confirmPassword: text(values.confirmPassword) }))}
      >
        <FormError error={shownError} />
        <FormField
          name="password"
          label={l.password}
          required={{ value: true, message: l.passwordRequired }}
          minLength={{ value: minPasswordLength, message: l.passwordTooShort(minPasswordLength) }}
          validate={(value) => (minStrength !== undefined && typeof value === "string" && scorePassword(value) < minStrength ? l.passwordTooWeak : undefined)}
          error={fieldErrors?.password}
        >
          <PasswordInput autoComplete="new-password" showStrength={showStrength} />
        </FormField>
        <FormField
          name="confirmPassword"
          label={l.confirmPassword}
          required={{ value: true, message: l.confirmRequired }}
          validate={(value, values) => (value !== values.password ? l.mismatch : undefined)}
          error={fieldErrors?.confirmPassword}
        >
          <PasswordInput autoComplete="new-password" />
        </FormField>
        <div className="pt-1">
          <SubmitButton loading={loading}>{l.submit}</SubmitButton>
        </div>
      </Form>
      <Footer>{footer}</Footer>
    </div>
  );
}
