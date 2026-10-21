// CTA: the closing call to action. A rounded band with a title, a line of text and buttons — in the accent color,
// on a surface, or dark (its own theme) — with an optional visual. The "newsletter" form variant collects an email.
"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { Button } from "../../components/button/button.tsx";

export type CTAProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  media?: ReactNode;
  tone?: "accent" | "surface" | "dark";
  align?: "center" | "start";
  className?: string;
};

export function CTA({ title, description, actions, media, tone = "accent", align = "center", className }: CTAProps) {
  return (
    <section
      data-theme={tone === "dark" ? "dark" : undefined}
      className={cn(
        "relative isolate overflow-hidden rounded-[2rem] px-6 py-14 md:px-14 md:py-20",
        tone === "accent" && "bg-accent text-on-accent",
        tone === "surface" && "bg-surface text-fg shadow-sm",
        tone === "dark" && "bg-surface text-fg",
        media ? "grid items-center gap-10 md:grid-cols-[1.2fr_1fr]" : "",
        className,
      )}
    >
      {tone === "accent" && (
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_80%_at_100%_0%,var(--pl-accent-400),transparent_60%)] opacity-60" />
      )}
      <div className={cn("flex flex-col gap-5", align === "center" && !media ? "mx-auto max-w-2xl items-center text-center" : "items-start")}>
        <h2 className="text-display-sm text-balance">{title}</h2>
        {description && <p className={cn("text-title3 font-normal text-pretty", tone === "accent" ? "opacity-85" : "text-fg-muted")}>{description}</p>}
        {actions && <div className={cn("mt-2 flex flex-wrap gap-3", align === "center" && !media && "justify-center")}>{actions}</div>}
      </div>
      {media && <div>{media}</div>}
    </section>
  );
}

export type NewsletterProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Return a promise to show a loading state; resolve to show the success message. */
  onSubscribe: (email: string) => void | Promise<void>;
  placeholder?: string;
  buttonLabel?: ReactNode;
  successMessage?: ReactNode;
  footnote?: ReactNode;
  className?: string;
};

export function Newsletter({
  title,
  description,
  onSubscribe,
  placeholder = "you@example.com",
  buttonLabel = "Subscribe",
  successMessage = "Thanks! Check your inbox to confirm.",
  footnote,
  className,
}: NewsletterProps) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const id = useId();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setState("loading");
    try {
      await onSubscribe(email);
      setState("done");
    } catch {
      setState("idle");
    }
  };
  return (
    <section className={cn("flex flex-col items-center gap-5 rounded-[2rem] bg-surface px-6 py-12 text-center shadow-sm md:py-16", className)}>
      <h2 className="text-title1 text-balance">{title}</h2>
      {description && <p className="max-w-xl text-body text-fg-muted">{description}</p>}
      {state === "done" ? (
        <p role="status" className="rounded-full bg-success-soft px-4 py-2 text-subhead font-semibold text-success-ink">
          {successMessage}
        </p>
      ) : (
        <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
          <label htmlFor={id} className="sr-only">
            Email
          </label>
          <input
            id={id}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={placeholder}
            className="pl-focus-ring h-12 min-w-0 flex-1 rounded-full bg-fill-2 px-5 text-body text-fg outline-offset-0 placeholder:text-fg-subtle"
          />
          <Button type="submit" size="lg" loading={state === "loading"}>
            {buttonLabel}
          </Button>
        </form>
      )}
      {footnote && <p className="text-footnote text-fg-muted">{footnote}</p>}
    </section>
  );
}
