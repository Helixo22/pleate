// SignupForm: create an account with name, email and a password with a live strength meter, plus an optional terms
// checkbox (required when shown). Client rules: required fields, email format, minimum length and, optionally, a
// minimum strength. Server errors come back through `error` and `fieldErrors`.
"use client";

import type { ReactNode } from "react";
import { Checkbox } from "../../components/checkbox/checkbox.tsx";
import { Form, FormField } from "../../components/form/form.tsx";
import { Input } from "../../components/input/input.tsx";
import { PasswordInput, scorePassword, type PasswordScore } from "../../components/password-input/password-input.tsx";
import { cn } from "../../lib/cn.ts";
import { AuthDivider } from "../auth-card/auth-card.tsx";
import { checked, Footer, FormError, SubmitButton, text, useSubmitError, type AuthFormBaseProps } from "../shared.tsx";

export type SignupValues = { name: string; email: string; password: string; acceptTerms: boolean };

export type SignupFormLabels = {
  name?: string;
  namePlaceholder?: string;
  email?: string;
  emailPlaceholder?: string;
  password?: string;
  passwordHint?: (minLength: number) => string;
  submit?: string;
  or?: string;
  nameRequired?: string;
  emailRequired?: string;
  emailInvalid?: string;
  passwordRequired?: string;
  passwordTooShort?: (minLength: number) => string;
  passwordTooWeak?: string;
  termsRequired?: string;
  genericError?: string;
};

const L = {
  name: "Name",
  namePlaceholder: "Jane Appleseed",
  email: "Email",
  emailPlaceholder: "you@example.com",
  password: "Password",
  passwordHint: (n: number) => `At least ${n} characters.`,
  submit: "Create account",
  or: "or",
  nameRequired: "Enter your name.",
  emailRequired: "Enter your email address.",
  emailInvalid: "Enter a valid email address.",
  passwordRequired: "Choose a password.",
  passwordTooShort: (n: number) => `Use at least ${n} characters.`,
  passwordTooWeak: "Choose a stronger password: mix words, numbers and symbols.",
  termsRequired: "Please accept the terms to continue.",
  genericError: "Something went wrong. Please try again.",
};

export type SignupFormProps = AuthFormBaseProps<"name" | "email" | "password" | "acceptTerms"> & {
  onSubmit: (values: SignupValues) => void | Promise<void>;
  /** Ask for a name. */
  showName?: boolean;
  /** Label of the terms checkbox (with your links); the checkbox is shown and required when set. */
  terms?: ReactNode;
  minPasswordLength?: number;
  /** Refuse passwords scoring below this (0 to 4, see scorePassword). */
  minStrength?: PasswordScore;
  showStrength?: boolean;
  /** Social sign up (e.g. <OAuthButtons>), above the form with an "or" rule. */
  oauth?: ReactNode;
  defaultValues?: Partial<Pick<SignupValues, "name" | "email">>;
  labels?: SignupFormLabels;
};

export function SignupForm({
  onSubmit,
  loading,
  error,
  fieldErrors,
  showName = true,
  terms,
  minPasswordLength = 8,
  minStrength,
  showStrength = true,
  oauth,
  defaultValues,
  footer,
  labels,
  className,
}: SignupFormProps) {
  const l = { ...L, ...labels };
  const { shownError, run } = useSubmitError(error, l.genericError);
  return (
    <div className={cn("flex w-full flex-col gap-5", className)}>
      {oauth && (
        <>
          {oauth}
          <AuthDivider>{l.or}</AuthDivider>
        </>
      )}
      <Form
        className="gap-4"
        onSubmit={(values) =>
          run(() =>
            onSubmit({
              name: text(values.name).trim(),
              email: text(values.email).trim(),
              password: text(values.password),
              acceptTerms: checked(values.acceptTerms),
            }),
          )
        }
      >
        <FormError error={shownError} />
        {showName && (
          <FormField name="name" label={l.name} required={{ value: true, message: l.nameRequired }} error={fieldErrors?.name}>
            <Input autoComplete="name" placeholder={l.namePlaceholder} defaultValue={defaultValues?.name} />
          </FormField>
        )}
        <FormField
          name="email"
          label={l.email}
          required={{ value: true, message: l.emailRequired }}
          type={{ value: "email", message: l.emailInvalid }}
          error={fieldErrors?.email}
        >
          <Input type="email" autoComplete="email" inputMode="email" placeholder={l.emailPlaceholder} defaultValue={defaultValues?.email} />
        </FormField>
        <FormField
          name="password"
          label={l.password}
          description={showStrength ? undefined : l.passwordHint(minPasswordLength)}
          required={{ value: true, message: l.passwordRequired }}
          minLength={{ value: minPasswordLength, message: l.passwordTooShort(minPasswordLength) }}
          validate={(value) => (minStrength !== undefined && typeof value === "string" && scorePassword(value) < minStrength ? l.passwordTooWeak : undefined)}
          error={fieldErrors?.password}
        >
          <PasswordInput autoComplete="new-password" showStrength={showStrength} />
        </FormField>
        {terms && (
          <FormField name="acceptTerms" required={{ value: true, message: l.termsRequired }} error={fieldErrors?.acceptTerms}>
            <Checkbox shape="square" size="sm" label={<span className="text-subhead text-fg-muted [&_a]:font-semibold [&_a]:text-accent-ink [&_a:hover]:underline">{terms}</span>} />
          </FormField>
        )}
        <div className="pt-1">
          <SubmitButton loading={loading}>{l.submit}</SubmitButton>
        </div>
      </Form>
      <Footer>{footer}</Footer>
    </div>
  );
}
