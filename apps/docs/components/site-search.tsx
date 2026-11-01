// Docs search: the CommandPalette over every ready page of both areas (⌘K / Ctrl+K anywhere), plus the
// field-like trigger for the header.
"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, CommandPalette, Kbd, type CommandGroup } from "pleate";
import { BACKEND_NAV, NAV } from "@/lib/nav";

function groups(navigate: (href: string) => void): CommandGroup[] {
  const sections = [
    ...NAV.map((s) => ({ ...s, area: s.area === "effects" ? "Effects" : "Frontend" })),
    ...BACKEND_NAV.map((s) => ({ ...s, area: "Backend" })),
  ];
  return sections
    .map((s) => ({
      heading: s.area === "Frontend" ? s.title : `${s.area} · ${s.title}`,
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

/** Opens the docs search from anywhere (the home page's search bar has no handle on the shell's state). */
export const OPEN_SEARCH_EVENT = "docs:open-search";

export function SearchTrigger({
  onOpen = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT)),
  label = "Search docs",
  size = "md",
  className,
}: {
  onOpen?: () => void;
  label?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className={cn(
        "pl-focus-ring flex w-full cursor-pointer items-center gap-2 text-start text-fg-muted transition-colors hover:text-fg",
        size === "lg"
          ? "h-11 rounded-xl bg-surface px-3.5 text-body shadow-[var(--pl-edge)] [&>svg]:size-[1.125rem]"
          : "h-9 rounded-[0.625rem] bg-fill-2 px-2.5 text-subhead [&>svg]:size-4",
        className,
      )}
    >
      <Search className="shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate">{label}</span>
      <Kbd keys="mod+k" />
    </button>
  );
}
