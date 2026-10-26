// ForgotPasswordForm: asks for the account email and, once onSubmit resolves, swaps to a "check your inbox" panel
// (with a way back to try another address). The confirmation never says whether the account exists. Control it with
// `sent` if your flow decides when to show it.
"use client";

import { useState, type ReactNode } from "react";
import { Button } from "../../components/button/button.tsx";
import { Form, FormField } from "../../components/form/form.tsx";
import { Input } from "../../components/input/input.tsx";
import { cn } from "../../lib/cn.ts";
import { MailIcon } from "../../lib/icons.tsx";
import { Footer, FormError, SubmitButton, text, useSubmitError, type AuthFormBaseProps } from "../shared.tsx";

export type ForgotPasswordValues = { email: string };

export type ForgotPasswordFormLabels = {
  email?: string;
  emailPlaceholder?: string;
  submit?: string;
  emailRequired?: string;
  emailInvalid?: string;
  sentTitle?: string;
  sentDescription?: (email: string) => ReactNode;
  tryAgain?: string;
  genericError?: string;
};

const L = {
  email: "Email",
  emailPlaceholder: "you@example.com",
  submit: "Send reset link",
  emailRequired: "Enter your email address.",
  emailInvalid: "Enter a valid email address.",
  sentTitle: "Check your email",
  sentDescription: (email: string): ReactNode =>
    email ? (
      <>
        If an account exists for <span className="font-semibold text-fg">{email}</span>, a link to reset the password is on its way.
      </>
    ) : (
      "If an account exists for that address, a link to reset the password is on its way."
    ),
  tryAgain: "Use a different email",
  genericError: "Something went wrong. Please try again.",
};

export type ForgotPasswordFormProps = AuthFormBaseProps<"email"> & {
  onSubmit: (values: ForgotPasswordValues) => void | Promise<void>;
  /** Controls the confirmation panel; by default it shows after onSubmit resolves. */
  sent?: boolean;
  onSentChange?: (sent: boolean) => void;
  defaultEmail?: string;
  labels?: ForgotPasswordFormLabels;
};

export function ForgotPasswordForm({
  onSubmit,
  loading,
  error,
  fieldErrors,
  sent: sentProp,
  onSentChange,
  defaultEmail,
  footer,
  labels,
  className,
}: ForgotPasswordFormProps) {
  const l = { ...L, ...labels };
  const { shownError, run } = useSubmitError(error, l.genericError);
  const [sentState, setSentState] = useState(false);
  const [email, setEmail] = useState(defaultEmail ?? "");
  const sent = sentProp ?? sentState;
  const setSent = (next: boolean) => {
    setSentState(next);
    onSentChange?.(next);
  };

  return (
    <div className={cn("flex w-full flex-col gap-5", className)}>
      {sent ? (
        <div role="status" className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent-ink [&_svg]:size-7">
            <MailIcon strokeWidth={2} />
          </span>
          <h3 className="text-headline">{l.sentTitle}</h3>
          <p className="text-subhead text-pretty text-fg-muted">{l.sentDescription(email)}</p>
          <Button variant="plain" size="sm" onClick={() => setSent(false)}>
            {l.tryAgain}
          </Button>
        </div>
      ) : (
        <Form
          className="gap-4"
          onSubmit={(values) =>
            run(async () => {
              const address = text(values.email).trim();
              setEmail(address);
              await onSubmit({ email: address });
              setSent(true);
            })
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
            <Input type="email" autoComplete="email" inputMode="email" placeholder={l.emailPlaceholder} defaultValue={email} />
          </FormField>
          <div className="pt-1">
            <SubmitButton loading={loading}>{l.submit}</SubmitButton>
          </div>
        </Form>
      )}
      <Footer>{footer}</Footer>
    </div>
  );
}
