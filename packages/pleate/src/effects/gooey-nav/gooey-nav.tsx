// GooeyNav: a navigation row where the active pill flows to the chosen item through a "goo" filter, shedding
// droplets that melt back into it. Arrow keys move between items; reduced motion just moves the pill.
"use client";

import { motion } from "motion/react";
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useControllableState } from "../../lib/use-controllable-state.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type GooeyNavItem = { label: string; href?: string };

export type GooeyNavProps = {
  items: GooeyNavItem[];
  /** Index of the active item (controlled). */
  value?: number;
  defaultValue?: number;
  onChange?: (index: number) => void;
  /** Droplets per change. */
  particleCount?: number;
  /** Pill color (CSS). */
  color?: string;
  "aria-label"?: string;
  className?: string;
};

type Burst = { key: number; x: number; y: number; drops: { dx: number; dy: number; s: number }[] };

export function GooeyNav({ items, value, defaultValue = 0, onChange, particleCount = 12, color = "var(--pl-accent)", className, ...aria }: GooeyNavProps) {
  const [active, setActive] = useControllableState({ value, defaultValue, onChange });
  const id = useId().replace(/:/g, "");
  const reduced = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[active];
      if (el) setPill({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [active, items.length]);

  const select = (i: number) => {
    if (i === active) return;
    const el = refs.current[i];
    if (el && !reduced) {
      const drops = Array.from({ length: particleCount }, () => {
        const a = Math.random() * Math.PI * 2;
        const r = 18 + Math.random() * 26;
        return { dx: Math.cos(a) * r * 1.6, dy: Math.sin(a) * r, s: 6 + Math.random() * 10 };
      });
      setBurst({ key: Date.now(), x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2, drops });
    }
    setActive(i);
  };

  const onKeyDown = (event: KeyboardEvent, i: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    refs.current[(i + step + items.length) % items.length]?.focus();
  };

  return (
    <nav aria-label={aria["aria-label"] ?? "Main"} className={cn("inline-block", className)}>
      <div ref={wrap} className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ filter: `url(#${id})` }}>
          {pill && (
            <div
              className={cn("absolute rounded-full", !reduced && "transition-all duration-500 ease-[cubic-bezier(.3,1.4,.5,1)]")}
              style={{ left: pill.x, top: pill.y, width: pill.w, height: pill.h, background: color }}
            />
          )}
          {burst?.drops.map((d, i) => (
            <motion.span
              key={`${burst.key}-${i}`}
              className="absolute rounded-full"
              style={{ left: burst.x - d.s / 2, top: burst.y - d.s / 2, width: d.s, height: d.s, background: color }}
              initial={{ x: 0, y: 0, scale: 0 }}
              animate={{ x: [0, d.dx, 0], y: [0, d.dy, 0], scale: [0, 1.2, 0] }}
              transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.012 }}
            />
          ))}
          <svg width="0" height="0" className="absolute">
            <filter id={id}>
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
              <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="g" />
              <feComposite in="SourceGraphic" in2="g" operator="atop" />
            </filter>
          </svg>
        </div>
        <ul className="relative flex flex-wrap gap-1">
          {items.map((item, i) => {
            const cls = cn(
              "pl-touch pl-focus-ring block rounded-full px-4 py-2 text-subhead font-medium transition-colors duration-300",
              i === active ? "text-on-accent" : "text-fg-muted hover:text-fg",
            );
            const common = {
              ref: (el: HTMLElement | null) => {
                refs.current[i] = el;
              },
              className: cls,
              "aria-current": i === active ? ("page" as const) : undefined,
              onClick: () => select(i),
              onKeyDown: (e: KeyboardEvent) => onKeyDown(e, i),
            };
            return (
              <li key={item.label}>
                {item.href ? <a href={item.href} {...common}>{item.label}</a> : <button type="button" {...common}>{item.label}</button>}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
