// Docs shell: a full-height sidebar on desktop (wordmark and search, a page filter, the two areas as a card, collapsible page groups,
// palette and theme at the bottom); on phones a slim header, a floating tab bar and the same sidebar as a drawer.
"use client";

import {
  AppWindow,
  BellRing,
  Blend,
  BookOpen,
  Bot,
  Box,
  Compass,
  Cpu,
  Database,
  Film,
  House,
  Image,
  KeyRound,
  Layers,
  LayoutGrid,
  LayoutPanelLeft,
  Megaphone,
  Menu,
  MousePointerClick,
  Package,
  Paintbrush,
  PencilRuler,
  Search,
  Server,
  Shapes,
  SwatchBook,
  Table2,
  TextCursorInput,
  Type,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Badge,
  IconButton,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarSearch,
  TabBar,
  TabBarItem,
  TabBarSpacer,
} from "pleate";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { type Area, AREA_HOME, AREA_LABEL, AREA_NAV, areaOf, type NavSection } from "@/lib/nav";
import { OPEN_SEARCH_EVENT, SiteSearch } from "./site-search";
import { PalettePicker, ThemeSwitch } from "./theme-controls";

function Wordmark({ area }: { area: Area }) {
  return (
    <Link href={AREA_HOME[area]} className="pl-focus-ring flex items-baseline gap-2 rounded-sm transition-opacity hover:opacity-75">
      <span className="font-brand text-[1.375rem] leading-none font-bold tracking-[-0.04em] text-fg">
        pleate<span className="text-accent-ink">.ui</span>
      </span>
      {area !== "frontend" && (
        <Badge size="sm" tone="accent">
          {AREA_LABEL[area]}
        </Badge>
      )}
    </Link>
  );
}

const LAST_PAGE_KEY = "pleate-docs-last-page";

function readLastPages(): Partial<Record<Area, string>> {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_PAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

const goArea = (router: ReturnType<typeof useRouter>, next: Area) => router.push(readLastPages()[next] ?? AREA_HOME[next]);

const NewMark = () => (
  <Badge size="sm" tone="accent">
    New
  </Badge>
);

/** Components / Effects / Backend as a card of three rows. Each area remembers the last page visited in this tab. */
function AreaSwitch({ area }: { area: Area }) {
  const router = useRouter();
  const rows: { id: Area; icon: ReactNode; badge?: ReactNode }[] = [
    { id: "frontend", icon: <LayoutGrid /> },
    { id: "effects", icon: <Shapes />, badge: area === "effects" ? undefined : <NewMark /> },
    { id: "backend", icon: <Server /> },
  ];
  return (
    <SidebarGroup variant="card" label="Documentation" filterable={false}>
      {rows.map((row) => (
        <SidebarItem key={row.id} icon={row.icon} badge={row.badge} active={area === row.id} aria-current={area === row.id ? "true" : undefined} onClick={() => row.id !== area && goArea(router, row.id)}>
          {AREA_LABEL[row.id]}
        </SidebarItem>
      ))}
    </SidebarGroup>
  );
}

// Open and closed sections, per area, kept for this tab. The section of the current page is always opened.
const FOLDS_KEY = "pleate-docs-folds";
type Folds = Record<string, boolean>;
const foldKey = (area: Area, title: string) => `${area}:${title}`;

function useFolds(area: Area, pathname: string) {
  const [folds, setFolds] = useState<Folds>({});
  useEffect(() => {
    try {
      setFolds((f) => ({ ...JSON.parse(sessionStorage.getItem(FOLDS_KEY) ?? "{}"), ...f }));
    } catch {
      // storage unavailable: defaults only
    }
  }, []);
  const save = (next: Folds) => {
    setFolds(next);
    try {
      sessionStorage.setItem(FOLDS_KEY, JSON.stringify(next));
    } catch {
      // not persisted, still works for this page
    }
  };
  // Navigating into a folded section opens it.
  useEffect(() => {
    const section = AREA_NAV[area].find((s) => s.items.some((i) => i.href === pathname));
    if (!section) return;
    const key = foldKey(area, section.title);
    setFolds((f) => {
      if (f[key]) return f;
      const next = { ...f, [key]: true };
      try {
        sessionStorage.setItem(FOLDS_KEY, JSON.stringify(next));
      } catch {
        // not persisted
      }
      return next;
    });
  }, [area, pathname]);
  const isOpen = (title: string, i: number, active: boolean) => folds[foldKey(area, title)] ?? (active || (i === 0 && area !== "effects"));
  const setOpen = (title: string, open: boolean) => save({ ...folds, [foldKey(area, title)]: open });
  return { isOpen, setOpen };
}

/** Brings the current page's row into view inside the sidebar: centered on load, only if hidden afterwards. */
function useRevealActive(nav: React.RefObject<HTMLElement | null>, pathname: string) {
  const first = useRef(true);
  useEffect(() => {
    // Wait for a section that just opened to finish unfolding.
    const timer = window.setTimeout(() => {
      const box = nav.current;
      const row = box?.querySelector<HTMLElement>("a[aria-current=page]");
      if (!box || !row || row.closest("[inert]")) return;
      const r = row.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const hidden = r.top < b.top + 40 || r.bottom > b.bottom - 8; // 40: room for a pinned section label
      if (first.current || hidden) {
        const smooth = !first.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        box.scrollTo({ top: box.scrollTop + r.top - b.top - b.height / 2 + r.height / 2, behavior: smooth ? "smooth" : "auto" });
      }
      first.current = false;
    }, 300);
    return () => window.clearTimeout(timer);
  }, [nav, pathname]);
}

// One icon per top level section, so a folded sidebar still scans. Sections without an entry get none.
const SECTION_ICONS: Record<string, ReactNode> = {
  "Getting started": <BookOpen />,
  Base: <Box />,
  Layout: <LayoutPanelLeft />,
  Navigation: <Compass />,
  Overlay: <Layers />,
  Feedback: <BellRing />,
  Data: <Table2 />,
  Forms: <TextCursorInput />,
  Auth: <KeyRound />,
  AI: <Bot />,
  Effects: <Blend />,
  Marketing: <Megaphone />,
  "Text Animations": <Type />,
  Animations: <Film />,
  Interactive: <MousePointerClick />,
  Backgrounds: <Image />,
  Examples: <AppWindow />,
  Accounts: <Users />,
  Platform: <Cpu />,
  Product: <Package />,
  Operations: <Wrench />,
  More: <Database />,
};

// The few site pages (not components) get a row icon too.
const PAGE_ICONS: Record<string, ReactNode> = {
  "/": <House />,
  "/tokens": <SwatchBook />,
  "/theming": <Paintbrush />,
  "/components": <LayoutGrid />,
  "/composer": <PencilRuler />,
};

type Folding = ReturnType<typeof useFolds>;

function SidebarBody({ area, query, folding, onSearch }: { area: Area; query: string; folding: Folding; onSearch: () => void }) {
  const pathname = usePathname();
  const nav = useRef<HTMLDivElement>(null);
  useRevealActive(nav, pathname);
  // While filtering, every area is searched and each result group names its area.
  const groups: { area: Area; section: NavSection }[] = query
    ? (["frontend", "effects", "backend"] as const).flatMap((a) => AREA_NAV[a].map((section) => ({ area: a, section })))
    : AREA_NAV[area].map((section) => ({ area, section }));
  return (
    <>
      <SidebarHeader className="pe-3">
        <Wordmark area={area} />
        <IconButton
          aria-label="Search the docs"
          title="Search the docs (Ctrl K)"
          aria-haspopup="dialog"
          variant="gray"
          tone="neutral"
          size="sm"
          icon={<Search />}
          onClick={onSearch}
          className="ms-auto"
        />
      </SidebarHeader>
      <SidebarSearch placeholder="Filter all pages" label="Filter pages" shortcut="/" />
      <SidebarContent ref={nav} aria-label={`${AREA_LABEL[area]} documentation`} className="pb-6">
        <AreaSwitch area={area} />
        {groups
          .filter(({ section }) => section.items.length > 0)
          .map(({ area: a, section }, i) => {
            const active = section.items.some((item) => item.href === pathname);
            const fresh = section.items.filter((item) => item.isNew).length;
            // Mostly new: one mark on the label instead of one on every row.
            const mostlyNew = fresh * 2 > section.items.length;
            return (
              <SidebarGroup
                key={`${a}-${section.title}`}
                label={
                  query && a !== area ? (
                    <>
                      {section.title} <span className="font-normal text-fg-subtle">· {AREA_LABEL[a]}</span>
                    </>
                  ) : (
                    section.title
                  )
                }
                textValue={section.title}
                icon={SECTION_ICONS[section.title]}
                count={section.items.length}
                badge={mostlyNew ? <NewMark /> : undefined}
                stickyLabel={section.items.length > 12}
                collapsible
                open={folding.isOpen(section.title, i, active)}
                onOpenChange={(open) => folding.setOpen(section.title, open)}
              >
                {section.items.map((item) =>
                  item.ready ? (
                    <SidebarItem
                      key={item.href}
                      asChild
                      active={pathname === item.href}
                      textValue={item.name}
                      icon={PAGE_ICONS[item.href]}
                      badge={item.isNew && !mostlyNew ? <NewMark /> : undefined}
                    >
                      <Link href={item.href}>
                        <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      </Link>
                    </SidebarItem>
                  ) : (
                    <SidebarItem key={item.href} disabled className="cursor-default text-fg-subtle hover:bg-transparent" badge="soon">
                      {item.name}
                    </SidebarItem>
                  ),
                )}
              </SidebarGroup>
            );
          })}
      </SidebarContent>
      <SidebarFooter className="gap-2.5">
        <div className="flex items-center gap-2">
          <PalettePicker up />
          <span className="text-footnote text-fg-muted">Palette</span>
        </div>
        <ThemeSwitch labels />
      </SidebarFooter>
    </>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const pathname = usePathname();
  const area = areaOf(pathname);
  const [query, setQuery] = useState("");
  const folding = useFolds(area, pathname);
  const router = useRouter();
  // Example pages and the Composer are full-bleed screens of their own: no docs chrome.
  const bare = pathname.startsWith("/examples/") || pathname.startsWith("/composer");
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    const open = () => setSearch(true);
    window.addEventListener(OPEN_SEARCH_EVENT, open);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, open);
  }, []);
  useEffect(() => {
    if (bare) return;
    try {
      sessionStorage.setItem(LAST_PAGE_KEY, JSON.stringify({ ...readLastPages(), [area]: pathname }));
    } catch {
      // storage unavailable: the switch falls back to each area's home
    }
  }, [area, pathname, bare]);

  if (bare) return <>{children}</>;

  return (
    <div className="flex min-h-dvh">
      <Sidebar label="Menu" variant="surface" open={menu} onOpenChange={setMenu} query={query} onQueryChange={setQuery}>
        <SidebarBody area={area} query={query} folding={folding} onSearch={() => setSearch(true)} />
      </Sidebar>

      <div className="min-w-0 flex-1">
        {/* Phones and tablets: a slim bar; the sidebar opens as a drawer from the tab bar's Menu. */}
        <header className="sticky top-0 z-(--pl-z-sticky) border-b border-separator bg-bg pt-(--pl-safe-top) lg:hidden">
          <div className="flex h-14 items-center gap-3 px-4 md:px-6">
            <Wordmark area={area} />
            <div className="ms-auto flex items-center gap-2">
              <PalettePicker />
              <ThemeSwitch />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[70rem] px-4 pt-8 pb-24 md:px-10 md:pt-10">
          {children}
          <TabBarSpacer hideFrom="lg" variant="floating" />
        </main>
      </div>

      {/* Phones and tablets: a floating bar under the thumb with the three areas (the wordmark leads home), search in its
          own pane at the trailing end (it opens the palette in place, it is not a place). Menu opens the page list. */}
      <TabBar
        hideFrom="lg"
        variant="floating"
        label="Sections"
        trailing={
          <IconButton aria-label="Search the docs" aria-haspopup="dialog" variant="plain" tone="neutral" size="lg" icon={<Search />} onClick={() => setSearch(true)} />
        }
      >
        <TabBarItem asChild active={area === "frontend"} icon={<LayoutGrid />} label="Components">
          <Link href="/components">Components</Link>
        </TabBarItem>
        <TabBarItem active={area === "effects"} icon={<Shapes />} label="Effects" onClick={() => goArea(router, "effects")} />
        <TabBarItem asChild active={area === "backend"} icon={<Server />} label="Backend">
          <Link href="/backend/overview">Backend</Link>
        </TabBarItem>
        <TabBarItem active={menu} icon={<Menu />} label="Menu" aria-haspopup="dialog" aria-expanded={menu} onClick={() => setMenu(true)} />
      </TabBar>
      <SiteSearch open={search} onOpenChange={setSearch} />
    </div>
  );
}
