// Docs search: the CommandPalette over every ready page of both areas (⌘K / Ctrl+K anywhere), plus the
// field-like trigger for the header.
"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, CommandPalette, Kbd, type CommandGroup } from "pleate";
import { BACKEND_NAV, NAV } from "@/lib/nav";

function groups(navigate: (href: string) => void): CommandGroup[] {
  const sections = [
    ...NAV.map((s) => ({ ...s, area: "Frontend" })),
    ...BACKEND_NAV.map((s) => ({ ...s, area: "Backend" })),
  ];
  return sections
    .map((s) => ({
      heading: s.area === "Backend" ? `Backend · ${s.title}` : s.title,
      items: s.items
        .filter((i) => i.ready)
        .map((i) => ({ id: `${s.area}:${i.href}`, label: i.name, keywords: [s.title, s.area], onSelect: () => navigate(i.href) })),
    }))
    .filter((g) => g.items.length > 0);
}

export function SiteSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  return (
    <CommandPalette
      open={open}
      onOpenChange={onOpenChange}
      groups={groups((href) => router.push(href))}
      placeholder="Search components and pages"
      emptyLabel="No page matches"
      label="Search the docs"
    />
  );
}

export function SearchTrigger({ onOpen, className }: { onOpen: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className={cn(
        "pl-focus-ring pl-field flex h-8 w-60 cursor-pointer items-center gap-2 rounded-md bg-surface ps-2.5 pe-1.5 text-start text-footnote text-fg-subtle transition-colors hover:text-fg-muted",
        className,
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">Search docs</span>
      <Kbd keys="mod+k" />
    </button>
  );
}
