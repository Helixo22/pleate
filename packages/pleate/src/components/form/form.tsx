// Form + FormField: accessible validation without a form library.
// - FormField renders the label, your control, a description and the error, and wires id, aria-describedby,
//   aria-invalid and required onto the control (any element that forwards props to its input: Input, Textarea,
//   native controls). For other controls, read the same props from useFormField().
// - Rules (required, minLength, pattern, type: "email", validate…) run on blur, again on every change once an error
//   shows, and for all fields on submit. On submit with errors, focus jumps to the first invalid field.
// - Values come from the form itself (FormData), so uncontrolled inputs and Radix controls just work.
"use client";

import { Slot } from "radix-ui";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn.ts";
import { Label } from "../label/label.tsx";
import { checkField, readValues, type FieldRules, type FieldValue } from "./validation.ts";

type Registration = { rules: FieldRules; id: string };
type FormContextValue = {
  register: (name: string, entry: Registration) => () => void;
  errors: Record<string, string | undefined>;
  setError: (name: string, message: string | undefined) => void;
  validateField: (name: string) => Promise<string | undefined>;
  submitting: boolean;
  submitted: boolean;
};
const FormContext = createContext<FormContextValue | null>(null);

export type FormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  /** Runs only when every field is valid. May be async: `submitting` is true meanwhile. */
  onSubmit?: (values: Record<string, FieldValue>, event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  /** Called with the errors when a submit is blocked. */
  onInvalid?: (errors: Record<string, string>) => void;
};

export function Form({ onSubmit, onInvalid, className, children, ...props }: FormProps) {
  const ref = useRef<HTMLFormElement>(null);
  const fields = useRef(new Map<string, Registration>());
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const register = useCallback((name: string, entry: Registration) => {
    fields.current.set(name, entry);
    return () => {
      fields.current.delete(name);
    };
  }, []);
  const setError = useCallback((name: string, message: string | undefined) => {
    setErrors((prev) => (prev[name] === message ? prev : { ...prev, [name]: message }));
  }, []);
  const validateField = useCallback(
    async (name: string) => {
      const entry = fields.current.get(name);
      if (!entry || !ref.current) return undefined;
      const values = readValues(ref.current);
      const message = await checkField(values[name], entry.rules, values);
      setError(name, message);
      return message;
    },
    [setError],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitted(true);
    const values = readValues(form);
    const found: Record<string, string> = {};
    await Promise.all(
      [...fields.current].map(async ([name, entry]) => {
        const message = await checkField(values[name], entry.rules, values);
        if (message) found[name] = message;
      }),
    );
    setErrors(found);
    const invalid = [...fields.current].find(([name]) => found[name]);
    if (invalid) {
      document.getElementById(invalid[1].id)?.focus();
      onInvalid?.(found);
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit?.(values, event);
    } finally {
      setSubmitting(false);
    }
  };

  const value = useMemo(
    () => ({ register, errors, setError, validateField, submitting, submitted }),
    [register, errors, setError, validateField, submitting, submitted],
  );
  return (
    <FormContext.Provider value={value}>
      <form ref={ref} noValidate onSubmit={handleSubmit} aria-busy={submitting || undefined} className={cn("flex flex-col gap-5", className)} {...props}>
        {children}
      </form>
    </FormContext.Provider>
  );
}

/** Form state for submit buttons and summaries. */
export function useForm() {
  const context = useContext(FormContext);
  return { submitting: context?.submitting ?? false, errors: context?.errors ?? {} };
}

type FieldContextValue = {
  id: string;
  name?: string;
  error?: string;
  describedBy?: string;
  required: boolean;
  invalid: boolean;
  /** Props to spread on a custom control. */
  controlProps: Record<string, unknown>;
};
const FieldContext = createContext<FieldContextValue | null>(null);

/** Inside a FormField: ids and aria props for controls that FormField can't wire itself. */
export function useFormField() {
  const context = useContext(FieldContext);
  if (!context) throw new Error("pleate: useFormField() must be used inside <FormField>.");
  return context;
}

export type FormFieldProps = FieldRules & {
  /** Must match the control's name: values are read from the form by name. */
  name?: string;
  label?: ReactNode;
  description?: ReactNode;
  /** A text after the label ("Optional", "3/20"). */
  hint?: ReactNode;
  /** Controlled error (e.g. from a server); overrides the rules' message. */
  error?: string;
  /** The control. Props are merged onto it. */
  children: ReactNode;
  className?: string;
};

export function FormField({ name, label, description, hint, error: errorProp, children, className, ...rules }: FormFieldProps) {
  const form = useContext(FormContext);
  const id = useId();
  const [localError, setLocalError] = useState<string>();
  const rulesRef = useRef(rules);
  rulesRef.current = rules;

  useEffect(() => {
    if (!form || !name) return;
    return form.register(name, { rules: rulesRef.current, id: `${id}-control` });
    // Rules are read through the ref, so changing them doesn't re-register.
  }, [form, name, id]);

  const error = errorProp ?? (form && name ? form.errors[name] : localError);
  const required = Boolean(typeof rules.required === "object" ? rules.required.value : rules.required);

  const validateStandalone = async (value: FieldValue) => {
    setLocalError(await checkField(value, rulesRef.current));
  };
  const runValidation = (target: EventTarget | null) => {
    if (form && name) void form.validateField(name);
    else if (target && "value" in (target as HTMLInputElement)) void validateStandalone((target as HTMLInputElement).value);
  };

  const describedBy = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const controlProps = {
    id: `${id}-control`,
    name,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    "aria-required": required || undefined,
    onBlur: (event: { target: EventTarget | null }) => runValidation(event.target),
    onChange: (event: { target: EventTarget | null }) => {
      if (error) runValidation(event.target);
    },
  };

  return (
    <FieldContext.Provider value={{ id: `${id}-control`, name, error, describedBy, required, invalid: Boolean(error), controlProps }}>
      <div className={cn("flex flex-col gap-1.5", className)} data-invalid={error ? "" : undefined}>
        {label && (
          <Label htmlFor={`${id}-control`} required={required} hint={hint}>
            {label}
          </Label>
        )}
        <Slot.Root {...controlProps}>{children}</Slot.Root>
        {description && !error && (
          <p id={`${id}-description`} className="text-footnote text-fg-muted">
            {description}
          </p>
        )}
        <p id={`${id}-error`} aria-live="polite" className={cn("flex items-start gap-1.5 text-footnote font-medium text-danger-ink", !error && "sr-only")}>
          {error && (
            <svg viewBox="0 0 16 16" className="mt-0.5 size-3.5 shrink-0" fill="currentColor" aria-hidden="true">
              <path d="M8 1.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm0 3.25a.75.75 0 0 0-.75.75v3a.75.75 0 0 0 1.5 0v-3A.75.75 0 0 0 8 4.75Zm0 6.5a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Z" />
            </svg>
          )}
          {error}
        </p>
      </div>
    </FieldContext.Provider>
  );
}
