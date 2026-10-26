// ContactForm: name, email, an optional subject and the message, validated on the client, with a success panel once
// onSubmit resolves. A honeypot field named "website" is hidden from people and assistive technology (bots tend to
// fill it): it is sent with the values, so your server can drop submissions where it isn't empty.
"use client";

import { useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { CheckIcon } from "../../lib/icons.tsx";
import { Alert } from "../../components/alert/alert.tsx";
import { Button } from "../../components/button/button.tsx";
import { Form, FormField, useForm } from "../../components/form/form.tsx";
import { Input } from "../../components/input/input.tsx";
import { Textarea } from "../../components/textarea/textarea.tsx";

export type ContactValues = { name: string; email: string; subject?: string; message: string; /** Honeypot: empty for people. */ website: string };

export type ContactFormLabels = {
  name?: string;
  namePlaceholder?: string;
  email?: string;
  emailPlaceholder?: string;
  subject?: string;
  subjectPlaceholder?: string;
  optional?: string;
  message?: string;
  messagePlaceholder?: string;
  submit?: string;
  nameRequired?: string;
  emailRequired?: string;
  emailInvalid?: string;
  messageRequired?: string;
  messageTooShort?: (min: number) => string;
  successTitle?: string;
  successDescription?: ReactNode;
  sendAnother?: string;
  genericError?: string;
};

const L = {
  name: "Name",
  namePlaceholder: "Jane Appleseed",
  email: "Email",
  emailPlaceholder: "you@example.com",
  subject: "Subject",
  subjectPlaceholder: "What is it about?",
  optional: "Optional",
  message: "Message",
  messagePlaceholder: "How can we help?",
  submit: "Send message",
  nameRequired: "Enter your name.",
  emailRequired: "Enter your email address.",
  emailInvalid: "Enter a valid email address.",
  messageRequired: "Write a message.",
  messageTooShort: (n: number) => `Write at least ${n} characters.`,
  successTitle: "Message sent",
  successDescription: "Thanks for reaching out. We'll get back to you soon." as ReactNode,
  sendAnother: "Send another message",
  genericError: "Something went wrong. Please try again.",
};

export type ContactFormProps = {
  onSubmit: (values: ContactValues) => void | Promise<void>;
  /** Show the subject field. */
  showSubject?: boolean;
  minMessageLength?: number;
  maxMessageLength?: number;
  /** Shows the submit button as busy. */
  loading?: boolean;
  /** Error for the whole form, shown above the fields; a thrown Error's message is shown otherwise. */
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "subject" | "message", string>>;
  /** Controls the success panel; by default it shows after onSubmit resolves. */
  sent?: boolean;
  onSentChange?: (sent: boolean) => void;
  /** Text under the button (privacy note). */
  footnote?: ReactNode;
  labels?: ContactFormLabels;
  className?: string;
};

function Submit({ loading, label }: { loading?: boolean; label: string }) {
  const { submitting } = useForm();
  return (
    <Button type="submit" size="lg" loading={loading || submitting} className="w-full sm:w-auto sm:self-start">
      {label}
    </Button>
  );
}

const text = (v: unknown) => (typeof v === "string" ? v : "");

export function ContactForm({
  onSubmit,
  showSubject = true,
  minMessageLength = 10,
  maxMessageLength = 2000,
  loading,
  error,
  fieldErrors,
  sent: sentProp,
  onSentChange,
  footnote,
  labels,
  className,
}: ContactFormProps) {
  const l = { ...L, ...labels };
  const [sentState, setSentState] = useState(false);
  const [thrown, setThrown] = useState<string>();
  const sent = sentProp ?? sentState;
  const setSent = (next: boolean) => {
    setSentState(next);
    onSentChange?.(next);
  };
  const shownError = error ?? thrown;

  if (sent) {
    return (
      <div role="status" className={cn("flex w-full flex-col items-center gap-3 py-8 text-center", className)}>
        <span className="grid size-14 place-items-center rounded-full bg-success-soft text-success-ink [&_svg]:size-7">
          <CheckIcon strokeWidth={2.5} />
        </span>
        <h3 className="text-title3">{l.successTitle}</h3>
        <p className="max-w-sm text-subhead text-pretty text-fg-muted">{l.successDescription}</p>
        <Button variant="plain" size="sm" onClick={() => setSent(false)}>
          {l.sendAnother}
        </Button>
      </div>
    );
  }

  return (
    <Form
      className={cn("w-full gap-4", className)}
      onSubmit={async (values) => {
        setThrown(undefined);
        try {
          await onSubmit({
            name: text(values.name).trim(),
            email: text(values.email).trim(),
            subject: showSubject ? text(values.subject).trim() || undefined : undefined,
            message: text(values.message).trim(),
            website: text(values.website),
          });
          setSent(true);
        } catch (e) {
          setThrown(e instanceof Error && e.message ? e.message : l.genericError);
        }
      }}
    >
      {shownError && (
        <Alert tone="danger" className="py-3">
          {shownError}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="name" label={l.name} required={{ value: true, message: l.nameRequired }} error={fieldErrors?.name}>
          <Input autoComplete="name" placeholder={l.namePlaceholder} />
        </FormField>
        <FormField
          name="email"
          label={l.email}
          required={{ value: true, message: l.emailRequired }}
          type={{ value: "email", message: l.emailInvalid }}
          error={fieldErrors?.email}
        >
          <Input type="email" inputMode="email" autoComplete="email" placeholder={l.emailPlaceholder} />
        </FormField>
      </div>
      {showSubject && (
        <FormField name="subject" label={l.subject} hint={l.optional} maxLength={120} error={fieldErrors?.subject}>
          <Input placeholder={l.subjectPlaceholder} />
        </FormField>
      )}
      <FormField
        name="message"
        label={l.message}
        required={{ value: true, message: l.messageRequired }}
        minLength={{ value: minMessageLength, message: l.messageTooShort(minMessageLength) }}
        maxLength={maxMessageLength}
        error={fieldErrors?.message}
      >
        <Textarea placeholder={l.messagePlaceholder} minRows={4} maxLength={maxMessageLength} />
      </FormField>
      {/* Honeypot: off screen, out of the tab order and hidden from screen readers. */}
      <div aria-hidden="true" className="pointer-events-none sr-only">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <div className="flex flex-col gap-3 pt-1">
        <Submit loading={loading} label={l.submit} />
        {footnote && <p className="text-footnote text-fg-muted">{footnote}</p>}
      </div>
    </Form>
  );
}
