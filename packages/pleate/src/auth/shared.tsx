// Pieces shared by the auth forms: the submit button (busy while the form or the parent is), the error banner, and
// a submit wrapper that turns a thrown Error into the banner text when the parent doesn't control `error`.
"use client";

import { useState, type ReactNode } from "react";
import { Alert } from "../components/alert/alert.tsx";
import { Button } from "../components/button/button.tsx";
import { useForm } from "../components/form/form.tsx";
import type { FieldValue } from "../components/form/validation.ts";

export type AuthFormBaseProps<Field extends string> = {
  /** Shows the submit button as busy (e.g. while your request runs outside onSubmit). */
  loading?: boolean;
  /** Error for the whole form (wrong credentials, network): shown above the fields. */
  error?: string;
  /** Errors per field from the server; each replaces that field's client message. */
  fieldErrors?: Partial<Record<Field, string>>;
  /** Shown under the form (links like "No account? Sign up"). */
  footer?: ReactNode;
  className?: string;
};

export function SubmitButton({ loading, disabled, children }: { loading?: boolean; disabled?: boolean; children: ReactNode }) {
  const { submitting } = useForm();
  return (
    <Button type="submit" size="lg" fullWidth loading={loading || submitting} disabled={disabled}>
      {children}
    </Button>
  );
}

export function FormError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <Alert tone="danger" className="py-3">
      {error}
    </Alert>
  );
}

export const text = (value: FieldValue) => (typeof value === "string" ? value : "");
export const checked = (value: FieldValue) => value === "on" || value === "true";

/** Runs onSubmit, keeping the message of a thrown Error to show when `error` isn't controlled. */
export function useSubmitError(error?: string, fallback = "Something went wrong. Please try again.") {
  const [thrown, setThrown] = useState<string>();
  const run = async (fn: () => void | Promise<void>) => {
    setThrown(undefined);
    try {
      await fn();
    } catch (e) {
      setThrown(e instanceof Error && e.message ? e.message : fallback);
    }
  };
  return { shownError: error ?? thrown, run };
}

export function Footer({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <div className="text-center text-subhead text-fg-muted [&_a]:font-semibold [&_a]:text-accent-ink [&_a:hover]:underline">{children}</div>;
}

export const linkClass = "pl-focus-ring rounded-sm text-subhead font-semibold text-accent-ink hover:underline";
