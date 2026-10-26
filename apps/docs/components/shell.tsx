// Docs shell: sticky header with theme controls, a solid sidebar on desktop and a slide-over menu on phones.
"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge, cn, IconButton, SegmentedControl, spring } from "pleate";
import { useEffect, useState, type ReactNode } from "react";
import { type Area, AREA_HOME, areaOf, BACKEND_NAV, NAV } from "@/lib/nav";
import { PalettePicker, ThemeSwitch } from "./theme-controls";

function Wordmark({ area }: { area: Area }) {
  return (
    <Link
      href={AREA_HOME[area]}
      className="pl-focus-ring flex items-center gap-2 rounded-md text-headline font-bold tracking-tight"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" className="size-7" />
      pleate
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

/** Frontend / Backend switch. Each side remembers the last page visited in this tab. */
function AreaToggle({ area, onSwitch, fullWidth }: { area: Area; onSwitch?: () => void; fullWidth?: boolean }) {
  const router = useRouter();
  return (
    <SegmentedControl<Area>
      aria-label="Documentation area"
      size="sm"
      fullWidth={fullWidth}
      value={area}
      onValueChange={(next) => {
        if (next === area) return;
        onSwitch?.();
        router.push(readLastPages()[next] ?? AREA_HOME[next]);
      }}
      options={[
        { value: "frontend", label: "Frontend" },
        { value: "backend", label: "Backend" },
      ]}
    />
  );
}

function SidebarNav({ area, onNavigate }: { area: Area; onNavigate?: () => void }) {
  const pathname = usePathname();
  const sections = area === "backend" ? BACKEND_NAV : NAV;
  return (
    <nav aria-label={area === "backend" ? "Backend documentation" : "Documentation"} className="flex flex-col gap-6 pb-10">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="px-3 pb-1.5 text-footnote font-semibold text-fg-muted">{section.title}</p>
          <ul className="flex flex-col gap-px">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  {item.ready ? (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "pl-focus-ring flex h-9 items-center rounded-md px-3 text-subhead transition-colors",
                        active ? "bg-accent-soft font-semibold text-accent-ink" : "text-fg hover:bg-fill-2",
                      )}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span className="flex h-9 items-center justify-between rounded-md px-3 text-subhead text-fg-subtle">
                      {item.name}
                      <Badge size="sm" tone="neutral">
                        Soon
                      </Badge>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  const area = areaOf(pathname);
  // Example pages are full-bleed sites of their own: no docs chrome.
  const bare = pathname.startsWith("/examples/");
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    try {
      sessionStorage.setItem(LAST_PAGE_KEY, JSON.stringify({ ...readLastPages(), [area]: pathname }));
    } catch {
      // storage unavailable: the toggle falls back to each area's home
    }
  }, [area, pathname]);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  if (bare) return <>{children}</>;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-(--pl-z-sticky) border-b border-separator bg-bg pt-(--pl-safe-top)">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-3 px-4 md:px-6">
          <IconButton
            aria-label="Open menu"
            size="sm"
            variant="plain"
            tone="neutral"
            className="-ms-1.5 lg:hidden"
            onClick={() => setMenu(true)}
            icon={<Menu />}
          />
          <Wordmark area={area} />
          <div className="ms-6 hidden sm:block">
            <AreaToggle area={area} />
          </div>
          <div className="ms-auto flex items-center gap-2">
            <PalettePicker />
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[90rem]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto px-3 pt-6 lg:block">
          <SidebarNav area={area} />
        </aside>
        <main className="min-w-0 flex-1 px-4 pt-8 pb-24 md:px-10 md:pt-12">{children}</main>
      </div>

      <AnimatePresence>
        {menu && (
          <div className="fixed inset-0 z-(--pl-z-modal) lg:hidden">
            <motion.div
              className="absolute inset-0 bg-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenu(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute inset-y-0 start-0 flex w-[min(20rem,85vw)] flex-col bg-surface shadow-xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={spring.sheet}
            >
              <div className="flex h-14 shrink-0 items-center justify-between px-4 pt-(--pl-safe-top)">
                <Wordmark area={area} />
                <IconButton aria-label="Close menu" size="sm" variant="gray" tone="neutral" onClick={() => setMenu(false)} icon={<X />} />
              </div>
              <div className="px-4 pt-1 pb-3">
                <AreaToggle area={area} fullWidth onSwitch={() => setMenu(false)} />
              </div>
              <div className="overflow-y-auto px-2 pt-2">
                <SidebarNav area={area} onNavigate={() => setMenu(false)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
