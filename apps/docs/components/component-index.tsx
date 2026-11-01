// The /components grid: one card per component, grouped by section, with a small CSS sketch of the section's kind
// of component and a text filter over names and descriptions.
"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState, type ReactNode } from "react";

export type IndexItem = { name: string; href: string; description?: string };
export type IndexSection = { id: string; title: string; items: IndexItem[] };

const bar = "rounded-full bg-fill";

// Tiny drawings, one per section. Neutral fills with one accent touch, never a live demo.
const SKETCH: Record<string, ReactNode> = {
  Base: (
    <div className="flex items-center gap-2">
      <span className="h-6 w-16 rounded-full bg-accent" />
      <span className="h-6 w-10 rounded-full bg-fill" />
      <span className="flex h-4 w-7 items-center justify-end rounded-full bg-accent p-0.5"><span className="size-3 rounded-full bg-surface" /></span>
    </div>
  ),
  Layout: (
    <div className="grid h-14 w-24 grid-cols-3 grid-rows-2 gap-1">
      <span className="col-span-2 rounded-sm bg-fill" /><span className="row-span-2 rounded-sm bg-fill-2" /><span className="rounded-sm bg-fill-2" /><span className="rounded-sm bg-accent-soft" />
    </div>
  ),
  Navigation: (
    <div className="flex rounded-full bg-fill-2 p-0.5">
      <span className="h-5 w-10 rounded-full bg-surface shadow-[inset_0_0_0_1px_var(--pl-separator)]" /><span className="h-5 w-10" /><span className="h-5 w-10" />
    </div>
  ),
  Overlay: (
    <div className="relative h-14 w-24">
      <span className="absolute inset-x-0 top-0 h-10 rounded-md bg-fill-2" />
      <span className="absolute inset-x-3 top-4 bottom-0 rounded-md bg-surface shadow-[inset_0_0_0_1px_var(--pl-border)]" />
    </div>
  ),
  Feedback: (
    <div className="flex w-24 flex-col gap-2">
      <span className="h-1.5 w-full overflow-hidden rounded-full bg-fill"><span className="block h-full w-3/5 rounded-full bg-accent" /></span>
      <span className={`h-1.5 w-4/5 ${bar}`} /><span className={`h-1.5 w-2/5 ${bar}`} />
    </div>
  ),
  Data: (
    <div className="flex w-24 flex-col gap-1.5">
      {[0.9, 0.6, 0.75, 0.45].map((w, i) => (
        <span key={i} className="flex items-center gap-1.5"><span className={`h-1.5 w-4 ${i === 1 ? "rounded-full bg-accent" : bar}`} /><span className={`h-1.5 ${bar}`} style={{ width: `${w * 100}%` }} /></span>
      ))}
    </div>
  ),
  Forms: (
    <div className="flex w-24 flex-col gap-1.5">
      <span className="h-5 rounded-md shadow-[inset_0_0_0_1px_var(--pl-border)]" />
      <span className="h-5 rounded-md shadow-[inset_0_0_0_1.5px_var(--pl-accent)]" />
    </div>
  ),
  Auth: (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={`grid size-5 place-items-center rounded-md ${i === 3 ? "shadow-[inset_0_0_0_1.5px_var(--pl-accent)]" : "bg-fill-2"}`}>{i < 3 && <span className="size-1.5 rounded-full bg-fg-muted" />}</span>
      ))}
    </div>
  ),
  AI: (
    <div className="flex w-24 flex-col gap-1.5">
      <span className="h-4 w-14 self-end rounded-full bg-accent" />
      <span className="h-4 w-20 rounded-full bg-fill" />
      <span className="h-4 w-10 rounded-full bg-fill" />
    </div>
  ),
  Effects: (
    <svg viewBox="0 0 96 40" className="w-24 text-fg-subtle" aria-hidden="true">
      <path d="M2 30 C 20 30, 24 8, 48 8 S 76 30, 94 30" fill="none" stroke="var(--pl-accent)" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 36 H94" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
    </svg>
  ),
  Marketing: (
    <div className="flex w-24 flex-col items-center gap-1.5">
      <span className={`h-2.5 w-20 ${bar}`} /><span className={`h-1.5 w-14 bg-fill-2 rounded-full`} />
      <span className="mt-1 h-4 w-10 rounded-full bg-accent" />
    </div>
  ),
  "Text Animations": <span className="font-brand text-title2 text-fg">A<span className="text-accent-ink">a</span><span className="text-fg-subtle">a</span></span>,
  Animations: (
    <div className="flex items-end gap-1">
      {[10, 18, 26, 18, 10].map((h, i) => <span key={i} className={`w-2.5 rounded-sm ${i === 2 ? "bg-accent" : "bg-fill"}`} style={{ height: h }} />)}
    </div>
  ),
  Interactive: (
    <div className="relative size-14">
      <span className="absolute inset-1 rounded-full bg-accent-soft" />
      <span className="absolute top-5 left-5 size-4 rounded-full bg-accent" />
    </div>
  ),
  Backgrounds: (
    <span className="font-mono text-caption1 leading-tight text-fg-subtle" aria-hidden="true">
      .:-=+<span className="text-accent-ink">*#</span>+=-:.<br />:-=<span className="text-accent-ink">+*#%#*</span>=-:<br />.:-=+<span className="text-accent-ink">*#</span>+=-:.
    </span>
  ),
};

export function ComponentIndex({ sections }: { sections: IndexSection[] }) {
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query).trim().toLowerCase();
  const shown = sections
    .map((s) => ({ ...s, items: q ? s.items.filter((i) => `${i.name} ${i.description ?? ""} ${s.title}`.toLowerCase().includes(q)) : s.items }))
    .filter((s) => s.items.length);

  return (
    <div className="flex flex-col gap-12">
      <label className="pl-field flex h-11 max-w-md items-center gap-2.5 rounded-full bg-surface px-4 [--pl-field-border:var(--pl-separator)]">
        <Search className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter"
          aria-label="Filter components"
          className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-fg-subtle"
        />
      </label>

      {shown.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-20">
          <h2 id={`${section.id}-title`} className="mb-4 flex items-baseline gap-2 text-title3">
            {section.title}
            <span className="pl-tabular font-mono text-caption1 text-fg-subtle">{section.items.length}</span>
          </h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,14rem),1fr))] gap-3">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="pl-focus-ring group flex h-full flex-col overflow-hidden rounded-2xl bg-surface shadow-[inset_0_0_0_1px_var(--pl-separator)] transition-colors hover:bg-fill-3"
                >
                  <span className="grid h-24 place-items-center border-b border-separator bg-surface-2 transition-colors group-hover:bg-transparent" aria-hidden="true">
                    {SKETCH[section.title] ?? SKETCH.Base}
                  </span>
                  <span className="flex flex-col gap-1 px-4 py-3">
                    <span className="text-subhead font-medium text-fg">{item.name}</span>
                    {item.description && <span className="line-clamp-2 text-footnote text-fg-muted">{item.description}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!shown.length && <p className="text-body text-fg-muted">Nothing matches “{query}”.</p>}
    </div>
  );
}
