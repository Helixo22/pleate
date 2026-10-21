import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-10 max-w-3xl">
      {eyebrow && <p className="mb-2 text-subhead font-semibold text-accent-ink">{eyebrow}</p>}
      <h1 className="text-display-sm">{title}</h1>
      {children && <div className="mt-4 text-title3 font-normal text-fg-muted">{children}</div>}
    </header>
  );
}

export function CodeLine({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-surface p-4 font-mono text-[0.8125rem] leading-relaxed shadow-xs">
      <code>{children}</code>
    </pre>
  );
}
