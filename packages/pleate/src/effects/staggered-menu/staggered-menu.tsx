// StaggeredMenu: a menu button that opens a side panel in layers. Two colored sheets sweep in one after the other,
// then the panel lands and its big numbered links rise in sequence. Escape or the button closes it and focus goes
// back to the button. Reduced motion opens it without the sweep.
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type StaggeredMenuItem = { label: string; href: string };

export type StaggeredMenuProps = {
  items: StaggeredMenuItem[];
  side?: "left" | "right";
  /** Sheet colors that sweep in before the panel (CSS). */
  layers?: [string, string];
  /** Fill the nearest positioned parent instead of the viewport. */
  contained?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

const EASE = [0.76, 0, 0.24, 1] as const;

export function StaggeredMenu({ items, side = "right", layers = ["var(--pl-accent-200)", "var(--pl-accent)"], contained = false, onOpenChange, className }: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLAnchorElement>(null);
  const toggle = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
    if (!next) button.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => first.current?.focus(), reduced ? 0 : 450);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && toggle(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const off = side === "right" ? "100%" : "-100%";
  const sheet = (delay: number) => ({
    initial: reduced ? { opacity: 0 } : { x: off },
    animate: reduced ? { opacity: 1 } : { x: 0, transition: { duration: 0.55, ease: EASE, delay } },
    exit: reduced ? { opacity: 0 } : { x: off, transition: { duration: 0.45, ease: EASE, delay: 0.12 - delay / 2 } },
  });
  const pos = contained ? "absolute" : "fixed";
  return (
    <div className={className}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => toggle(!open)}
        className={cn("pl-focus-ring pl-touch relative z-30 inline-flex h-10 items-center gap-2 rounded-full bg-fill-2 px-4 text-subhead font-semibold text-fg transition-colors hover:bg-fill", open && "bg-surface")}
      >
        <span aria-hidden="true" className="relative h-5 overflow-hidden">
          <span className={cn("block transition-transform duration-500 ease-[cubic-bezier(.76,0,.24,1)]", open && "-translate-y-1/2")}>
            <span className="block">Menu</span>
            <span className="block">Close</span>
          </span>
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className={cn("size-4 transition-transform duration-500", open && "rotate-[135deg]")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <div id={id} className={cn(pos, "inset-0 z-20")}>
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 bg-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => toggle(false)}
            />
            <div className={cn("absolute inset-y-0 w-full max-w-md", side === "right" ? "right-0" : "left-0")}>
              <motion.div aria-hidden="true" className="absolute inset-0" style={{ background: layers[0] }} {...sheet(0)} />
              <motion.div aria-hidden="true" className="absolute inset-0" style={{ background: layers[1] }} {...sheet(0.07)} />
              <motion.nav aria-label="Menu" className="absolute inset-0 flex flex-col justify-center bg-surface px-10" {...sheet(0.14)}>
                <ol className="flex flex-col gap-1">
                  {items.map((item, i) => (
                    <li key={item.href} className="overflow-hidden">
                      <motion.a
                        ref={i === 0 ? first : undefined}
                        href={item.href}
                        initial={reduced ? false : { y: "110%" }}
                        animate={{ y: 0, transition: { duration: 0.6, ease: EASE, delay: 0.3 + i * 0.06 } }}
                        className="pl-focus-ring group flex items-baseline gap-3 rounded-md text-large-title font-semibold tracking-tight text-fg transition-colors hover:text-accent-ink"
                      >
                        <span className="text-footnote font-medium text-accent-ink pl-tabular">{String(i + 1).padStart(2, "0")}</span>
                        {item.label}
                      </motion.a>
                    </li>
                  ))}
                </ol>
              </motion.nav>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
