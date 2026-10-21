// Docs shell: sticky header with theme controls, a solid sidebar on desktop and a slide-over menu on phones.
"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge, cn, IconButton, spring } from "pleate";
import { useEffect, useState, type ReactNode } from "react";
import { NAV } from "@/lib/nav";
import { PalettePicker, ThemeSwitch } from "./theme-controls";

function Wordmark() {
  return (
    <Link href="/" className="pl-focus-ring flex items-center gap-2 rounded-md text-headline font-bold tracking-tight">
      <span aria-hidden className="grid size-7 place-items-center rounded-[30%] bg-accent text-on-accent">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 8c3-3 5 3 7 0s4-3 7 0M5 16c3-3 5 3 7 0s4-3 7 0" />
        </svg>
      </span>
      pleate
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-6 pb-10">
      {NAV.map((section) => (
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
  // Example pages are full-bleed sites of their own: no docs chrome.
  const bare = pathname.startsWith("/examples/");
  useEffect(() => setMenu(false), [pathname]);
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
          <Wordmark />
          <div className="ms-auto flex items-center gap-2">
            <PalettePicker />
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[90rem]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto px-3 pt-6 lg:block">
          <SidebarNav />
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
                <Wordmark />
                <IconButton aria-label="Close menu" size="sm" variant="gray" tone="neutral" onClick={() => setMenu(false)} icon={<X />} />
              </div>
              <div className="overflow-y-auto px-2 pt-2">
                <SidebarNav onNavigate={() => setMenu(false)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
