// LoginForm: email and password sign in, with "Remember me", a forgot password link, an optional slot for social
// buttons (OAuthButtons) above an "or" rule, and a footer. Validates on the client with Form rules, shows server
// errors from `error` and `fieldErrors`, and calls onSubmit with typed values. Backend agnostic: wire it to any API.
"use client";

import type { ReactNode } from "react";
import { Checkbox } from "../../components/checkbox/checkbox.tsx";
import { Form, FormField } from "../../components/form/form.tsx";
import { Input } from "../../components/input/input.tsx";
import { PasswordInput } from "../../components/password-input/password-input.tsx";
import { cn } from "../../lib/cn.ts";
import { AuthDivider } from "../auth-card/auth-card.tsx";
import { checked, Footer, FormError, linkClass, SubmitButton, text, useSubmitError, type AuthFormBaseProps } from "../shared.tsx";

export type LoginValues = { email: string; password: string; remember: boolean };

export type LoginFormLabels = {
  email?: string;
  emailPlaceholder?: string;
  password?: string;
  remember?: string;
  forgotPassword?: string;
  submit?: string;
  or?: string;
  emailRequired?: string;
  emailInvalid?: string;
  passwordRequired?: string;
  genericError?: string;
};

const L = {
  email: "Email",
  emailPlaceholder: "you@example.com",
  password: "Password",
  remember: "Remember me",
  forgotPassword: "Forgot password?",
  submit: "Sign in",
  or: "or",
  emailRequired: "Enter your email address.",
  emailInvalid: "Enter a valid email address.",
  passwordRequired: "Enter your password.",
  genericError: "Something went wrong. Please try again.",
};

export type LoginFormProps = AuthFormBaseProps<"email" | "password"> & {
  onSubmit: (values: LoginValues) => void | Promise<void>;
  /** Where "Forgot password?" goes. */
  forgotPasswordHref?: string;
  /** Your own forgot password element (e.g. a Next <Link>); replaces the default link. */
  forgotPassword?: ReactNode;
  /** Show the "Remember me" checkbox. */
  showRemember?: boolean;
  defaultEmail?: string;
  /** Social sign in (e.g. <OAuthButtons>), shown above the form with an "or" rule. */
  oauth?: ReactNode;
  /** Put the social buttons above (default) or below the form. */
  oauthPosition?: "top" | "bottom";
  labels?: LoginFormLabels;
};

export function LoginForm({
  onSubmit,
  loading,
  error,
  fieldErrors,
  forgotPasswordHref,
  forgotPassword,
  showRemember = true,
  defaultEmail,
  oauth,
  oauthPosition = "top",
  footer,
  labels,
  className,
}: LoginFormProps) {
  const l = { ...L, ...labels };
  const { shownError, run } = useSubmitError(error, l.genericError);
  const forgot = forgotPassword ?? (forgotPasswordHref && <a href={forgotPasswordHref} className={linkClass}>{l.forgotPassword}</a>);
  const social = oauth && (
    <>
      {oauthPosition === "bottom" && <AuthDivider>{l.or}</AuthDivider>}
      {oauth}
      {oauthPosition === "top" && <AuthDivider>{l.or}</AuthDivider>}
    </>
  );

  return (
    <div className={cn("flex w-full flex-col gap-5", className)}>
      {oauthPosition === "top" && social}
      <Form
        className="gap-4"
        onSubmit={(values) =>
          run(() => onSubmit({ email: text(values.email).trim(), password: text(values.password), remember: checked(values.remember) }))
        }
      >
        <FormError error={shownError} />
        <FormField
          name="email"
          label={l.email}
          required={{ value: true, message: l.emailRequired }}
          type={{ value: "email", message: l.emailInvalid }}
          error={fieldErrors?.email}
        >
          <Input type="email" autoComplete="username" inputMode="email" placeholder={l.emailPlaceholder} defaultValue={defaultEmail} />
        </FormField>
        <FormField name="password" label={l.password} required={{ value: true, message: l.passwordRequired }} error={fieldErrors?.password}>
          <PasswordInput autoComplete="current-password" />
        </FormField>
        {(showRemember || forgot) && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            {showRemember ? (
              <FormField name="remember">
                <Checkbox shape="square" size="sm" label={<span className="text-subhead">{l.remember}</span>} />
              </FormField>
            ) : (
              <span />
            )}
            {forgot}
          </div>
        )}
        <div className="pt-1">
          <SubmitButton loading={loading}>{l.submit}</SubmitButton>
        </div>
      </Form>
      {oauthPosition === "bottom" && social}
      <Footer>{footer}</Footer>
    </div>
  );
}
