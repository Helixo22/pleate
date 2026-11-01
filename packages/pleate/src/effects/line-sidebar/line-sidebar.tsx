// LineSidebar: a quiet list navigation where each item has a short line in front of it. Items near the pointer
// lean out, their lines grow and their text brightens, fading with distance. The current item keeps an accent line.
// Keyboard focus gets the full effect on the focused item.
"use client";

import { useRef, type PointerEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useControllableState } from "../../lib/use-controllable-state.ts";

export type LineSidebarItem = { label: string; href?: string };

export type LineSidebarProps = {
  items: LineSidebarItem[];
  /** Index of the current item (controlled). */
  value?: number;
  defaultValue?: number;
  onChange?: (index: number) => void;
  /** How far the pointer reaches (px). */
  range?: number;
  "aria-label"?: string;
  className?: string;
};

export function LineSidebar({ items, value, defaultValue = 0, onChange, range = 90, className, ...aria }: LineSidebarProps) {
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange });
  const refs = useRef<(HTMLElement | null)[]>([]);
  const near = (event: PointerEvent<HTMLUListElement> | null) => {
    refs.current.forEach((el) => {
      if (!el) return;
      if (!event) return el.style.removeProperty("--f");
      const r = el.getBoundingClientRect();
      const f = Math.max(0, 1 - Math.abs(event.clientY - (r.top + r.height / 2)) / range);
      el.style.setProperty("--f", (f * f * (3 - 2 * f)).toFixed(3));
    });
  };
  return (
    <nav aria-label={aria["aria-label"] ?? "Sections"} className={className}>
      <ul onPointerMove={near} onPointerLeave={() => near(null)} className="flex flex-col">
        {items.map((item, i) => {
          const on = i === current;
          const common = {
            ref: (el: HTMLElement | null) => {
              refs.current[i] = el;
            },
            "aria-current": on ? ("page" as const) : undefined,
            onClick: () => setCurrent(i),
            style: on ? undefined : { color: "color-mix(in oklab, var(--pl-fg) calc(42% + var(--f, 0) * 58%), transparent)" },
            className: cn(
              "group pl-touch pl-focus-ring flex items-center gap-3 rounded-md py-1.5 pr-2 text-left text-callout transition-[color] duration-200 focus-visible:[--f:1]",
              on && "text-fg",
            ),
          };
          const inner = (
            <>
              <span
                aria-hidden="true"
                className={cn("h-0.5 shrink-0 rounded-full transition-[width,background-color] duration-200 ease-out", on ? "bg-accent" : "bg-fg-subtle")}
                style={{ width: on ? 28 : "calc(12px + var(--f, 0) * 22px)" }}
              />
              <span className="transition-transform duration-200 ease-out [transform:translateX(calc(var(--f,0)*6px))]">{item.label}</span>
            </>
          );
          return (
            <li key={item.label}>
              {item.href ? <a href={item.href} {...common}>{inner}</a> : <button type="button" {...common}>{inner}</button>}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
