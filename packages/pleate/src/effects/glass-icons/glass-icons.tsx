// GlassIcons: app-style icon tiles. A colored tile sits tilted behind a frosted glass tile; on hover or keyboard
// focus the back tile swings out and the label slides in. Touch screens always show the labels.
"use client";

import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

export type GlassIconItem = {
  icon: ReactNode;
  /** Visible label, also the accessible name. */
  label: string;
  /** Back tile color (any CSS color). Defaults to the accent. */
  color?: string;
  /** Renders a link instead of a button. */
  href?: string;
  onClick?: () => void;
};

export type GlassIconsProps = {
  items: GlassIconItem[];
  className?: string;
};

export function GlassIcons({ items, className }: GlassIconsProps) {
  return (
    <ul className={cn("flex flex-wrap justify-center gap-x-8 gap-y-10", className)}>
      {items.map((item) => {
        const color = item.color ?? "var(--pl-accent)";
        const inner = (
          <>
            <span className="relative block size-16 [perspective:400px]">
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl transition-transform duration-300 ease-out [transform:rotate(14deg)] group-hover:[transform:rotate(22deg)_translate(4px,-6px)] group-focus-visible:[transform:rotate(22deg)_translate(4px,-6px)] motion-reduce:transition-none"
                style={{ background: `linear-gradient(140deg, ${color}, color-mix(in oklab, ${color} 55%, #000))`, boxShadow: `0 10px 24px -8px color-mix(in oklab, ${color} 70%, transparent)` }}
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 grid place-items-center rounded-2xl bg-white/15 text-white backdrop-blur-md transition-transform duration-300 ease-out [box-shadow:inset_0_1px_0_rgb(255_255_255/0.55),inset_0_0_0_1px_rgb(255_255_255/0.25)] group-hover:[transform:translateZ(18px)_scale(1.04)] group-focus-visible:[transform:translateZ(18px)_scale(1.04)] motion-reduce:transition-none dark:bg-white/10 [&_svg]:size-7"
              >
                {item.icon}
              </span>
            </span>
            <span className="text-footnote text-fg transition duration-300 ease-out [@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
              {item.label}
            </span>
          </>
        );
        const cls = "group pl-touch pl-focus-ring flex flex-col items-center gap-3 rounded-2xl p-1";
        return (
          <li key={item.label}>
            {item.href ? (
              <a href={item.href} onClick={item.onClick} className={cls}>{inner}</a>
            ) : (
              <button type="button" onClick={item.onClick} className={cls}>{inner}</button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
