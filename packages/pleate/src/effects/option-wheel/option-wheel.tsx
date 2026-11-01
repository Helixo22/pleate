// OptionWheel: an iOS style picker wheel. Options sit on a drum that tilts them away from the center row; scroll,
// drag or use the arrow keys to spin it, and it settles on the nearest option. It is a listbox: the centered option
// is the selected one.
"use client";

import { animate, useMotionValue, useMotionValueEvent } from "motion/react";
import { useEffect, useId, useRef, type KeyboardEvent, type WheelEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useControllableState } from "../../lib/use-controllable-state.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type OptionWheelProps = {
  options: string[];
  /** Selected index (controlled). */
  value?: number;
  defaultValue?: number;
  onChange?: (index: number) => void;
  /** Row height (px). */
  itemHeight?: number;
  /** Rows visible above and below the center. */
  visible?: number;
  "aria-label"?: string;
  className?: string;
};

export function OptionWheel({ options, value, defaultValue = 0, onChange, itemHeight = 40, visible = 3, className, ...aria }: OptionWheelProps) {
  const [selected, setSelected] = useControllableState({ value, defaultValue, onChange });
  const reduced = useReducedMotion();
  const id = useId();
  const pos = useMotionValue(selected);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const drag = useRef<{ y: number; start: number; last: number; t: number; v: number } | null>(null);
  const wheel = useRef<ReturnType<typeof setTimeout> | null>(null);
  const step = 20; // degrees between rows
  const radius = itemHeight / (2 * Math.tan((step * Math.PI) / 360));
  const max = options.length - 1;
  const clamp = (n: number) => Math.max(0, Math.min(max, n));

  const paint = (p: number) =>
    rows.current.forEach((el, i) => {
      if (!el) return;
      const deg = (i - p) * step;
      const hidden = Math.abs(deg) > (visible + 0.5) * step;
      el.style.transform = `translateY(-50%) translateZ(${-radius}px) rotateX(${-deg}deg) translateZ(${radius}px)`;
      el.style.opacity = hidden ? "0" : String(1 - Math.abs(deg) / ((visible + 1.5) * step));
    });
  useMotionValueEvent(pos, "change", paint);
  useEffect(() => paint(pos.get()));

  const settle = (target: number) => {
    const t = clamp(Math.round(target));
    if (reduced) pos.set(t);
    else animate(pos, t, { type: "spring", stiffness: 300, damping: 32 });
    setSelected(t);
  };
  useEffect(() => {
    if (!drag.current && Math.round(pos.get()) !== selected) settle(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const onKeyDown = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, PageUp: -visible, PageDown: visible, Home: -Infinity, End: Infinity };
    if (!(e.key in map)) return;
    e.preventDefault();
    settle(clamp(selected + map[e.key]));
  };
  const onWheel = (e: WheelEvent) => {
    pos.stop();
    pos.set(Math.max(-0.4, Math.min(max + 0.4, pos.get() + e.deltaY / itemHeight / 2)));
    if (wheel.current) clearTimeout(wheel.current);
    wheel.current = setTimeout(() => settle(pos.get()), 120);
  };

  return (
    <div className={cn("relative w-full max-w-64 select-none", className)} style={{ height: itemHeight * (visible * 2 + 1) }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 rounded-xl bg-fill-2" style={{ height: itemHeight }} />
      <ul
        role="listbox"
        tabIndex={0}
        aria-label={aria["aria-label"] ?? "Options"}
        aria-activedescendant={`${id}-${selected}`}
        onKeyDown={onKeyDown}
        onWheel={onWheel}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pos.stop();
          drag.current = { y: e.clientY, start: pos.get(), last: e.clientY, t: performance.now(), v: 0 };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const now = performance.now();
          d.v = (d.last - e.clientY) / itemHeight / Math.max(1, now - d.t);
          d.last = e.clientY;
          d.t = now;
          pos.set(Math.max(-0.5, Math.min(max + 0.5, d.start + (d.y - e.clientY) / itemHeight)));
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (d) settle(pos.get() + d.v * 180);
        }}
        className="pl-focus-ring relative size-full cursor-grab touch-none overflow-hidden rounded-xl [perspective:800px] [mask-image:linear-gradient(transparent,#000_30%,#000_70%,transparent)] active:cursor-grabbing"
      >
        {options.map((o, i) => (
          <li
            key={o + i}
            id={`${id}-${i}`}
            role="option"
            aria-selected={i === selected}
            ref={(el) => {
              rows.current[i] = el;
            }}
            onClick={() => settle(i)}
            className={cn("absolute inset-x-0 top-1/2 flex items-center justify-center text-title3 [backface-visibility:hidden]", i === selected ? "text-fg" : "text-fg-muted")}
            style={{ height: itemHeight }}
          >
            {o}
          </li>
        ))}
      </ul>
    </div>
  );
}
