// Building blocks of the Backend guides: headings with anchors, paragraphs, code blocks, reference tables, callouts.
import { cn } from "pleate";
import type { ReactNode } from "react";
import { CopyButton } from "./copy-button";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function H2({ children, id }: { children: string; id?: string }) {
  const anchor = id ?? slugify(children);
  return (
    <h2 id={anchor} className="mt-14 mb-4 scroll-mt-20 text-title2 first:mt-0">
      <a href={`#${anchor}`} className="pl-focus-ring rounded-sm hover:text-accent-ink">
        {children}
      </a>
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-8 mb-3 text-headline">{children}</h3>;
}

export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("my-4 max-w-3xl text-body leading-relaxed text-fg", className)}>{children}</p>;
}

/** Inline code. */
export function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-fill-2 px-1.5 py-0.5 font-mono text-[0.85em] [overflow-wrap:anywhere] text-fg">{children}</code>
  );
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="my-4 grid max-w-3xl gap-2 text-body leading-relaxed">{children}</ul>;
}

export function LI({ children }: { children: ReactNode }) {
  return (
    <li className="flex min-w-0 gap-3">
      <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

/** Numbered steps. */
export function Steps({ children }: { children: ReactNode }) {
  return <ol className="my-6 grid gap-8 [counter-reset:step]">{children}</ol>;
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="relative min-w-0 ps-11 [counter-increment:step] before:absolute before:start-0 before:top-0 before:grid before:size-7 before:place-items-center before:rounded-full before:bg-accent-soft before:text-footnote before:font-semibold before:text-accent-ink before:content-[counter(step)]">
      <h3 className="mb-2 text-headline leading-7">{title}</h3>
      <div className="min-w-0 [&>p:first-child]:mt-0">{children}</div>
    </li>
  );
}

/** A code block with a language or file label and a copy button. */
export function Code({ children, lang, title }: { children: string; lang?: string; title?: string }) {
  const code = children.replace(/^\n+|\s+$/g, "");
  const label = title ?? lang;
  return (
    <div className="my-5 min-w-0 overflow-hidden rounded-2xl bg-surface shadow-xs">
      <div className="flex h-10 items-center justify-between border-b border-separator ps-4 pe-1.5">
        <span className="truncate font-mono text-caption1 text-fg-muted">{label}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[0.8125rem] leading-relaxed text-fg">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Callout({
  title,
  children,
  tone = "info",
}: {
  title?: string;
  children: ReactNode;
  tone?: "info" | "warning" | "tip";
}) {
  return (
    <aside
      className={cn(
        "my-6 max-w-3xl rounded-2xl px-5 py-4 text-subhead leading-relaxed",
        tone === "info" && "bg-accent-soft text-fg",
        tone === "tip" && "bg-success-soft text-fg",
        tone === "warning" && "bg-warning-soft text-fg",
      )}
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="[&_p]:my-0">{children}</div>
    </aside>
  );
}

/** A generic reference table: header row plus cells (strings render as text, nodes as they are). */
export function Table({ head, rows, mono = [0] }: { head: string[]; rows: ReactNode[][]; mono?: number[] }) {
  return (
    <div className="my-5 overflow-x-auto rounded-2xl bg-surface shadow-xs">
      <table className="w-full min-w-[34rem] text-start text-subhead">
        <thead>
          <tr className="border-b border-separator text-footnote text-fg-muted">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 text-start font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-separator align-top last:border-0">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "px-4 py-3",
                    mono.includes(j) && "font-mono text-footnote break-words text-accent-ink",
                    j === 0 && "whitespace-nowrap",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const METHOD_TONE: Record<string, string> = {
  GET: "bg-success-soft text-success-ink",
  POST: "bg-accent-soft text-accent-ink",
  PUT: "bg-warning-soft text-warning-ink",
  PATCH: "bg-warning-soft text-warning-ink",
  DELETE: "bg-danger-soft text-danger-ink",
};

export type Endpoint = [method: string, path: string, purpose: ReactNode];

/** Endpoints table: method, path (relative to /api) and what it does. */
export function Endpoints({ rows }: { rows: Endpoint[] }) {
  return (
    <div className="my-5 overflow-x-auto rounded-2xl bg-surface shadow-xs">
      <table className="w-full min-w-[36rem] text-start text-subhead">
        <thead>
          <tr className="border-b border-separator text-footnote text-fg-muted">
            <th className="w-24 px-4 py-3 text-start font-semibold">Method</th>
            <th className="px-4 py-3 text-start font-semibold">Path</th>
            <th className="px-4 py-3 text-start font-semibold">Purpose</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([method, path, purpose]) => (
            <tr key={`${method} ${path}`} className="border-b border-separator align-top last:border-0">
              <td className="px-4 py-3">
                <span className="flex flex-wrap gap-1">
                  {method.split("|").map((m) => (
                    <span
                      key={m}
                      className={cn(
                        "inline-flex h-5 items-center rounded-md px-1.5 font-mono text-caption2 font-semibold",
                        METHOD_TONE[m] ?? "bg-fill-2 text-fg-muted",
                      )}
                    >
                      {m}
                    </span>
                  ))}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-footnote break-all text-fg">{path}</td>
              <td className="px-4 py-3">{purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Settings table for a PLEATE section: key, default, meaning. */
export function Settings({ rows }: { rows: [key: string, value: string, meaning: ReactNode][] }) {
  return <Table head={["Key", "Default", "Meaning"]} rows={rows} mono={[0, 1]} />;
}

/** Stable error codes. */
export function Errors({ rows }: { rows: [code: string, status: string, meaning: ReactNode][] }) {
  return <Table head={["Code", "Status", "When"]} rows={rows} mono={[0, 1]} />;
}
