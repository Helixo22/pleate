import Link from "next/link";
import type { ReactNode } from "react";
import { CopyButton } from "./backend/copy-button";

export function PageHeader({ eyebrow, eyebrowHref, title, children }: { eyebrow?: string; eyebrowHref?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 max-w-2xl">
      {eyebrow &&
        (eyebrowHref ? (
          <Link href={eyebrowHref} className="pl-focus-ring mb-3 inline-flex rounded-sm font-mono text-caption1 text-fg-subtle transition-colors hover:text-fg">
            {eyebrow}
          </Link>
        ) : (
          <p className="mb-3 font-mono text-caption1 text-fg-subtle">{eyebrow}</p>
        ))}
      <h1 className="text-large-title md:text-display-sm">{title}</h1>
      {children && <div className="mt-3 text-[1.0625rem] leading-7 text-fg-muted">{children}</div>}
    </header>
  );
}

export function CodeLine({ children }: { children: string }) {
  return (
    <div className="pl-field relative flex items-start rounded-lg bg-surface [--pl-field-border:var(--pl-separator)]">
      <pre className="min-w-0 flex-1 overflow-x-auto py-3 ps-4 pe-3 font-mono text-[0.8125rem] leading-relaxed">
        <code>{children}</code>
      </pre>
      <CopyButton text={children} className="me-2 mt-1.5 shrink-0 self-start" />
    </div>
  );
}
