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
import { useEffect, useState, type ReactNode } from "react";
import { type Area, AREA_HOME, areaOf, BACKEND_NAV, NAV } from "@/lib/nav";
import { OPEN_SEARCH_EVENT, SiteSearch } from "./site-search";
import { PalettePicker, ThemeSwitch } from "./theme-controls";

function Wordmark({ area }: { area: Area }) {
  return (
    <Link href={AREA_HOME[area]} className="pl-focus-ring flex items-baseline gap-2 rounded-sm transition-opacity hover:opacity-75">
      <span className="font-brand text-[1.375rem] leading-none font-bold tracking-[-0.04em] text-fg">
        pleate<span className="text-accent-ink">.ui</span>
      </span>
      {area === "backend" && (
        <Badge size="sm" tone="accent">
          Backend
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

/** Frontend / Backend as a card of two rows. Each side remembers the last page visited in this tab. */
function AreaSwitch({ area }: { area: Area }) {
  const router = useRouter();
  const go = (next: Area) => next !== area && router.push(readLastPages()[next] ?? AREA_HOME[next]);
  return (
    <SidebarGroup variant="card" label="Documentation" filterable={false}>
      <SidebarItem icon={<LayoutGrid />} active={area === "frontend"} onClick={() => go("frontend")}>
        Components
      </SidebarItem>
      <SidebarItem icon={<Server />} active={area === "backend"} onClick={() => go("backend")}>
        Backend
      </SidebarItem>
    </SidebarGroup>
  );
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

function SidebarBody({ area, onSearch }: { area: Area; onSearch: () => void }) {
  const pathname = usePathname();
  const sections = area === "backend" ? BACKEND_NAV : NAV;
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
      <SidebarSearch placeholder="Filter pages" label="Filter pages" shortcut="/" />
      <SidebarContent aria-label={area === "backend" ? "Backend documentation" : "Documentation"} className="pb-6">
        <AreaSwitch area={area} />
        {sections.filter((s) => s.items.length > 0).map((section, i) => (
          <SidebarGroup
            key={`${area}-${section.title}`}
            label={section.title}
            icon={SECTION_ICONS[section.title]}
            collapsible
            defaultOpen={i === 0 || section.items.some((item) => item.href === pathname)}
          >
            {section.items.map((item) =>
              item.ready ? (
                <SidebarItem key={item.href} asChild active={pathname === item.href} textValue={item.name} icon={PAGE_ICONS[item.href]}>
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
        ))}
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
  // Example pages and the Composer are full-bleed screens of their own: no docs chrome.
  const bare = pathname.startsWith("/examples/") || pathname === "/composer";
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    const open = () => setSearch(true);
    window.addEventListener(OPEN_SEARCH_EVENT, open);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, open);
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(LAST_PAGE_KEY, JSON.stringify({ ...readLastPages(), [area]: pathname }));
    } catch {
      // storage unavailable: the switch falls back to each area's home
    }
  }, [area, pathname]);

  if (bare) return <>{children}</>;

  return (
    <div className="flex min-h-dvh">
      <Sidebar label="Menu" variant="surface" open={menu} onOpenChange={setMenu}>
        <SidebarBody area={area} onSearch={() => setSearch(true)} />
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

      {/* Phones and tablets: a floating bar under the thumb, search in its own pane at the trailing end (it opens
          the palette in place, it is not a place). Menu opens the full page list. */}
      <TabBar
        hideFrom="lg"
        variant="floating"
        label="Sections"
        trailing={
          <IconButton aria-label="Search the docs" aria-haspopup="dialog" variant="plain" tone="neutral" size="lg" icon={<Search />} onClick={() => setSearch(true)} />
        }
      >
        <TabBarItem asChild active={pathname === "/"} icon={<BookOpen />} label="Overview">
          <Link href="/">Overview</Link>
        </TabBarItem>
        <TabBarItem asChild active={pathname.startsWith("/components")} icon={<LayoutGrid />} label="Components">
          <Link href="/components">Components</Link>
        </TabBarItem>
        <TabBarItem asChild active={area === "backend"} icon={<Server />} label="Backend">
          <Link href="/backend/overview">Backend</Link>
        </TabBarItem>
        <TabBarItem active={menu} icon={<Menu />} label="Menu" aria-haspopup="dialog" aria-expanded={menu} onClick={() => setMenu(true)} />
      </TabBar>
      <SiteSearch open={search} onOpenChange={setSearch} />
    </div>
  );
}
