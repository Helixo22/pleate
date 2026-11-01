// The Components tab: every docs component, grouped like the docs nav, with a search field. Groups render their rows
// only while open and search shows a capped flat list, so ~300 entries never mount at once.
"use client";

import { Plus, Search } from "lucide-react";
import { Input, SidebarGroup, SidebarItem } from "pleate";
import { useMemo, useState } from "react";
import { DRAG_TYPE, type DragPayload } from "./canvas";
import type { CatalogItem } from "./model";

const MAX_RESULTS = 60;

function Row({ item, onAdd }: { item: CatalogItem; onAdd: (item: CatalogItem) => void }) {
  return (
    <SidebarItem
      draggable
      title={item.description}
      onDragStart={(e) => {
        const payload: DragPayload = { kind: "component", slug: item.slug, demo: item.demos[0]?.id ?? "", background: Boolean(item.background) };
        e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => onAdd(item)}
      className="cursor-grab active:cursor-grabbing"
      badge={<Plus className="size-3.5 text-fg-subtle" />}
    >
      <span className="min-w-0 flex-1 truncate">{item.name}</span>
    </SidebarItem>
  );
}

export function ComponentLibrary({ catalog, onAdd }: { catalog: CatalogItem[]; onAdd: (item: CatalogItem) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const groups = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const c of catalog) map.set(c.section, [...(map.get(c.section) ?? []), c]);
    return [...map];
  }, [catalog]);
  const q = query.trim().toLowerCase();
  const results = q ? catalog.filter((c) => c.name.toLowerCase().includes(q) || c.section.toLowerCase().includes(q)) : [];

  return (
    <div className="grid gap-3">
      <Input
        size="sm"
        type="search"
        aria-label="Search components"
        placeholder={`Search ${catalog.length} components`}
        startAdornment={<Search />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {q ? (
        <SidebarGroup label={results.length ? `${results.length} found` : "No matches"}>
          {results.slice(0, MAX_RESULTS).map((c) => (
            <Row key={c.slug} item={c} onAdd={onAdd} />
          ))}
          {results.length > MAX_RESULTS && <li className="px-2.5 py-1 text-caption1 text-fg-subtle">Refine the search to see more</li>}
        </SidebarGroup>
      ) : (
        groups.map(([section, items]) => (
          <SidebarGroup
            key={section}
            label={section}
            count={items.length}
            collapsible
            open={Boolean(open[section])}
            onOpenChange={(o) => setOpen((s) => ({ ...s, [section]: o }))}
          >
            {open[section] && items.map((c) => <Row key={c.slug} item={c} onAdd={onAdd} />)}
          </SidebarGroup>
        ))
      )}
    </div>
  );
}
