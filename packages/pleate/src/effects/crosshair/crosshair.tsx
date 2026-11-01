// Crosshair: two thin lines meet at the cursor, like a viewfinder, with an optional coordinate readout. It lives
// inside its container (or the whole page with `global`), draws on top without catching clicks, ignores touch and
// reduced motion, and keeps the system cursor.
"use client";

import { useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useFinePointer, useHostPointer } from "../cursor-kit/cursor-kit.ts";

export type CrosshairProps = HTMLAttributes<HTMLDivElement> & {
  /** Line color (CSS). */
  color?: string;
  /** Line thickness in px. */
  thickness?: number;
  /** Show the x and y position next to the cursor. */
  coordinates?: boolean;
  /** Follow the pointer across the whole page (fixed layer) instead of only this container. */
  global?: boolean;
};

export function Crosshair({ color = "var(--pl-accent)", thickness = 1, coordinates = true, global = false, className, children, ...props }: CrosshairProps) {
  const host = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const h = useRef<HTMLDivElement>(null);
  const v = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const active = useFinePointer();

  useHostPointer(
    host,
    {
      move: (x, y) => {
        if (layer.current) layer.current.style.opacity = "1";
        if (h.current) h.current.style.transform = `translateY(${y}px)`;
        if (v.current) v.current.style.transform = `translateX(${x}px)`;
        if (label.current) {
          label.current.style.transform = `translate(${x + 10}px, ${y + 10}px)`;
          label.current.textContent = `${Math.round(x)}, ${Math.round(y)}`;
        }
      },
      leave: () => {
        if (layer.current) layer.current.style.opacity = "0";
      },
    },
    global,
    active,
  );

  return (
    <div ref={host} className={cn("relative", className)} {...props}>
      {children}
      {active && (
        <div ref={layer} aria-hidden="true" className={cn("pointer-events-none overflow-hidden opacity-0 transition-opacity duration-200", global ? "fixed inset-0 z-50" : "absolute inset-0 rounded-[inherit]")}>
          <div ref={h} className="absolute top-0 left-0 w-full" style={{ height: thickness, marginTop: -thickness / 2, background: color }} />
          <div ref={v} className="absolute top-0 left-0 h-full" style={{ width: thickness, marginLeft: -thickness / 2, background: color }} />
          {coordinates && <span ref={label} className="absolute top-0 left-0 rounded-sm bg-elevated px-1.5 py-0.5 font-mono text-caption2 text-fg-muted pl-tabular" />}
        </div>
      )}
    </div>
  );
}
