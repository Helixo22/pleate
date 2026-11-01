// BubbleMenu: a floating bar with a logo pill and a round menu button. Opening it pops the links out as big tilted
// pill bubbles over a dimmed backdrop, one after another; a hovered or focused bubble straightens and fills with
// its color. It is a disclosure: the button reports aria-expanded, focus moves into the links, Escape or a click on
// the backdrop closes and returns focus. Reduced motion shows the bubbles without the pop.
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type BubbleMenuItem = {
  label: string;
  href: string;
  /** Tilt of the bubble, degrees. */
  rotation?: number;
  /** Fill on hover/focus (CSS); defaults to the accent. */
  color?: string;
};

export type BubbleMenuProps = {
  items: BubbleMenuItem[];
  /** Content of the left pill (a logo or name). */
  logo: ReactNode;
  /** "fixed" covers the viewport; "absolute" covers the nearest positioned parent. */
  position?: "fixed" | "absolute";
  openLabel?: string;
  closeLabel?: string;
  /** Accessible name of the navigation. */
  label?: string;
  className?: string;
};

export function BubbleMenu({ items, logo, position = "fixed", openLabel = "Open menu", closeLabel = "Close menu", label = "Main", className }: BubbleMenuProps) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const id = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector("a")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav aria-label={label} className={cn(position, "inset-x-0 top-0 z-50", className)}>
      <div className="relative z-10 flex items-center justify-between gap-3 p-4">
        <div className="flex h-12 items-center rounded-full bg-surface px-5 text-headline shadow-[0_4px_20px_rgb(0_0_0/0.15),inset_0_0_0_1px_var(--pl-separator)]">{logo}</div>
        <button
          ref={toggle}
          type="button"
          aria-expanded={open}
          aria-controls={id}
          aria-label={open ? closeLabel : openLabel}
          onClick={() => setOpen(!open)}
          className="pl-focus-ring pl-touch grid size-12 cursor-pointer place-items-center rounded-full bg-surface text-fg shadow-[0_4px_20px_rgb(0_0_0/0.15),inset_0_0_0_1px_var(--pl-separator)]"
        >
          <span aria-hidden="true" className="relative block h-3 w-5">
            <span className={cn("absolute left-0 h-0.5 w-5 rounded-full bg-current transition-transform duration-300", open ? "top-[5px] rotate-45" : "top-0")} />
            <span className={cn("absolute left-0 h-0.5 w-5 rounded-full bg-current transition-transform duration-300", open ? "top-[5px] -rotate-45" : "top-2.5")} />
          </span>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            onClick={(event) => event.target === event.currentTarget && setOpen(false)}
            className={cn(position === "fixed" ? "fixed" : "absolute", "inset-0 grid place-items-center bg-bg/70 px-6 pt-24 pb-6 backdrop-blur-md")}
            style={position === "absolute" ? { height: "100%" } : undefined}
          >
            <ul ref={list} id={id} className="flex max-w-3xl flex-wrap items-center justify-center gap-3 sm:gap-4">
              {items.map((item, i) => (
                <motion.li
                  key={item.href + i}
                  initial={reduced ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { scale: 0, opacity: 0, transition: { duration: 0.15, delay: (items.length - i) * 0.02 } }}
                  transition={{ type: "spring", stiffness: 420, damping: 18, delay: reduced ? 0 : i * 0.06 }}
                >
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="pl-focus-ring block rounded-full bg-surface px-8 py-4 text-title1 font-semibold text-fg shadow-[0_6px_24px_rgb(0_0_0/0.18)] transition-[transform,background-color,color] duration-300 hover:scale-105 hover:!rotate-0 hover:bg-[var(--bm-c)] hover:text-white focus-visible:!rotate-0 focus-visible:bg-[var(--bm-c)] focus-visible:text-white motion-reduce:transition-none sm:px-10 sm:py-5 sm:text-large-title"
                    style={{ rotate: `${item.rotation ?? (i % 2 ? 4 : -4)}deg`, "--bm-c": item.color ?? "var(--pl-accent)" } as CSSProperties}
                  >
                    {item.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
