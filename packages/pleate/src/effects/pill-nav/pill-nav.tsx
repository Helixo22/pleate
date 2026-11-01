// PillNav: a capsule navigation bar. Hovering a pill floods it from below with a circle while the label rolls up
// to a fresh copy; the current page carries a small dot. On narrow screens the pills fold into a menu button.
"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";

export type PillNavItem = { label: string; href: string };

export type PillNavProps = {
  items: PillNavItem[];
  /** href of the current page. */
  activeHref?: string;
  /** Logo shown in its own round pill. */
  logo?: ReactNode;
  logoHref?: string;
  logoLabel?: string;
  "aria-label"?: string;
  className?: string;
};

function Pill({ item, active, className }: { item: PillNavItem; active: boolean; className?: string }) {
  return (
    <a
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn("group pl-focus-ring pl-touch relative isolate flex h-10 items-center overflow-hidden rounded-full bg-surface px-5 text-subhead font-medium text-fg", className)}
    >
      <span
        aria-hidden="true"
        className="absolute top-full left-1/2 -z-[1] aspect-square w-[150%] -translate-x-1/2 rounded-full bg-fg transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:-translate-y-[70%] motion-reduce:transition-none"
      />
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:-translate-y-full motion-reduce:transition-none">{item.label}</span>
        <span aria-hidden="true" className="absolute inset-0 block translate-y-full text-bg transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:translate-y-0 motion-reduce:transition-none">
          {item.label}
        </span>
      </span>
      {active && <span aria-hidden="true" className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent" />}
    </a>
  );
}

export function PillNav({ items, activeHref, logo, logoHref = "/", logoLabel = "Home", className, ...aria }: PillNavProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <nav aria-label={aria["aria-label"] ?? "Main"} className={cn("relative flex items-center gap-2", className)}>
      {logo && (
        <a href={logoHref} aria-label={logoLabel} className="pl-focus-ring grid size-10 shrink-0 place-items-center rounded-full bg-fg text-bg shadow-[var(--pl-shadow-sm)] [&_svg]:size-5">
          {logo}
        </a>
      )}
      <ul className="hidden items-center gap-1 rounded-full bg-fill-2 p-1 md:flex">
        {items.map((item) => (
          <li key={item.href}>
            <Pill item={item} active={item.href === activeHref} />
          </li>
        ))}
      </ul>
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className="pl-focus-ring pl-touch grid size-10 place-items-center rounded-full bg-fill-2 text-fg md:hidden [&_svg]:size-5"
      >
        {open ? (
          <XIcon />
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
            <path d="M5 9h14M5 15h14" />
          </svg>
        )}
      </button>
      <ul
        id={menuId}
        hidden={!open}
        className="absolute top-12 right-0 left-0 z-20 flex flex-col gap-1 rounded-3xl bg-elevated p-2 shadow-[var(--pl-shadow-xl)] md:hidden"
      >
        {items.map((item) => (
          <li key={item.href}>
            <Pill item={item} active={item.href === activeHref} className="w-full bg-transparent" />
          </li>
        ))}
      </ul>
    </nav>
  );
}
