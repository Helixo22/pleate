// AuthCard: the frame of sign in, sign up and recovery screens. A logo, a title, one line of description, the form
// and a footer ("No account? Sign up"), on a solid rounded surface that goes edge to edge on small phones when
// `bleed` is set. AuthDivider is the "or" rule between social buttons and the form.
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export type AuthCardProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  logo?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  /** "card": a rounded surface with a hairline edge; "plain": no surface (when the page already provides one). */
  variant?: "card" | "plain";
  /** Heading level of the title. */
  headingLevel?: 1 | 2 | 3;
};

export function AuthCard({
  logo,
  title,
  description,
  footer,
  variant = "card",
  headingLevel = 1,
  className,
  children,
  ...props
}: AuthCardProps) {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";
  return (
    <section
      className={cn(
        "flex w-full max-w-[26rem] flex-col gap-6 text-fg",
        variant === "card" && "rounded-3xl bg-surface p-6 shadow-[var(--pl-edge)] sm:p-8",
        className,
      )}
      {...props}
    >
      {(logo || title || description) && (
        <header className="flex flex-col items-center gap-1.5 text-center">
          {logo && <div className="mb-2 flex items-center justify-center">{logo}</div>}
          {title && <Heading className="text-title1 text-balance">{title}</Heading>}
          {description && <p className="max-w-xs text-callout text-pretty text-fg-muted">{description}</p>}
        </header>
      )}
      {children}
      {footer && <footer className="text-center text-subhead text-fg-muted [&_a]:font-medium [&_a]:text-accent-ink [&_a:hover]:underline">{footer}</footer>}
    </section>
  );
}

export function AuthDivider({ children = "or", className }: { children?: ReactNode; className?: string }) {
  return (
    <div role="separator" className={cn("flex items-center gap-3 text-footnote text-fg-subtle", className)}>
      <span aria-hidden="true" className="h-px flex-1 bg-separator" />
      <span>{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-separator" />
    </div>
  );
}
