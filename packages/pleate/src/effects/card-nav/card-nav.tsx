// CardNav: a floating navigation bar that springs open into a row of cards, each with a title and its own links.
// The menu button is a disclosure (aria-expanded), the cards rise in one after another, Escape closes and returns
// focus. On narrow screens the cards stack. Reduced motion opens without the spring.
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type CardNavGroup = {
  title: string;
  links: { label: string; href: string }[];
  /** Card background (CSS); defaults to a surface. */
  background?: string;
  /** Card text color (CSS). */
  color?: string;
};

export type CardNavProps = {
  groups: CardNavGroup[];
  /** Brand in the middle of the bar. */
  logo: ReactNode;
  /** Call to action on the right of the bar. */
  action?: ReactNode;
  openLabel?: string;
  closeLabel?: string;
  /** Accessible name of the navigation. */
  label?: string;
  className?: string;
};

export function CardNav({ groups, logo, action, openLabel = "Open menu", closeLabel = "Close menu", label = "Main", className }: CardNavProps) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const spring = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 340, damping: 30 };
  return (
    <nav
      aria-label={label}
      className={cn("w-full max-w-3xl overflow-hidden rounded-2xl bg-surface shadow-[0_10px_40px_rgb(0_0_0/0.18),inset_0_0_0_1px_var(--pl-separator)]", className)}
    >
      <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center px-2">
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          aria-controls={id}
          aria-label={open ? closeLabel : openLabel}
          onClick={() => setOpen(!open)}
          className="pl-focus-ring pl-touch grid size-11 cursor-pointer place-items-center rounded-full text-fg hover:bg-fill-3"
        >
          <span aria-hidden="true" className="relative block h-3 w-5">
            <span className={cn("absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300", open ? "top-[5px] rotate-45" : "top-0")} />
            <span className={cn("absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300", open ? "top-[5px] -rotate-45" : "top-2.5")} />
          </span>
        </button>
        <div className="text-headline">{logo}</div>
        <div className="flex justify-end">{action}</div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={id} key="cards" initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={spring}>
            <ul className="grid gap-2 p-2 pt-0 sm:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
              {groups.map((group, i) => (
                <motion.li
                  key={group.title}
                  initial={reduced ? false : { y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ ...spring, delay: reduced ? 0 : 0.05 + i * 0.06 }}
                  className="flex min-h-36 flex-col gap-3 rounded-xl p-4 sm:min-h-44"
                  style={{ background: group.background ?? "var(--pl-fill-3)", color: group.color }}
                >
                  <p className="text-title3">{group.title}</p>
                  <ul className="mt-auto grid gap-1">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <a href={link.href} className="pl-focus-ring inline-flex items-center gap-1.5 rounded-sm text-callout opacity-90 hover:opacity-100 hover:underline">
                          <span aria-hidden="true">↗</span>
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
