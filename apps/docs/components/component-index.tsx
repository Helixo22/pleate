// The /components grid: one text card per component, grouped by section, with a text filter over names and
// descriptions. No per-card sketches: the same drawing repeated on every card of a section said nothing.
"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";

export type IndexItem = { name: string; href: string; description?: string };
export type IndexSection = { id: string; title: string; items: IndexItem[] };

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
                  className="pl-focus-ring flex h-full flex-col overflow-hidden rounded-2xl bg-surface shadow-[inset_0_0_0_1px_var(--pl-separator)] transition-colors hover:bg-fill-3"
                >
                  <span className="flex flex-col gap-1 px-4 py-3.5">
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
