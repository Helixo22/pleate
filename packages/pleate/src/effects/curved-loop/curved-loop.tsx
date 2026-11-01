// CurvedLoop: a marquee that runs along a curve. Drag it to scrub; let go and it keeps going the way you threw it.
// Reduced motion shows the curved text at rest; screen readers get the plain text once.
"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type CurvedLoopProps = {
  text: string;
  /** Pixels per frame (in the 1440 wide drawing). */
  speed?: number;
  /** How far the middle of the line bends down (negative bends up). */
  curve?: number;
  direction?: "left" | "right";
  /** Drag to scrub and fling. */
  interactive?: boolean;
  className?: string;
};

const W = 1440;

export function CurvedLoop({ text, speed = 2, curve = 280, direction = "left", interactive = true, className }: CurvedLoopProps) {
  const id = useId();
  const reduced = useReducedMotion();
  const measure = useRef<SVGTextElement>(null);
  const path = useRef<SVGTextPathElement>(null);
  const [unit, setUnit] = useState(0);
  const label = text.trim() + "  ";
  const y = 60 + Math.max(0, -curve);
  const height = y + Math.max(0, curve) + 60;
  const d = `M -100,${y} Q ${W / 2},${y + curve * 2} ${W + 100},${y}`;

  useLayoutEffect(() => setUnit(measure.current?.getComputedTextLength() ?? 0), [label]);

  const state = useRef({ offset: 0, dir: direction === "left" ? -1 : 1, drag: false, lastX: 0 });
  useEffect(() => {
    state.current.dir = direction === "left" ? -1 : 1;
  }, [direction]);
  useEffect(() => {
    if (!unit) return;
    let raf = 0;
    const tick = () => {
      const s = state.current;
      if (!s.drag && !reduced) s.offset += s.dir * speed;
      s.offset = ((s.offset % unit) + unit) % unit - unit;
      path.current?.setAttribute("startOffset", `${s.offset}`);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [unit, speed, reduced]);

  const drag = interactive && !reduced;
  const copies = unit ? Math.ceil((W + 400) / unit) + 2 : 1;
  return (
    <div className={cn("w-full text-fg", className)}>
      <span className="sr-only">{text}</span>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${W} ${height}`}
        className={cn("block w-full overflow-visible select-none", drag && "cursor-grab touch-pan-y active:cursor-grabbing")}
        onPointerDown={
          drag
            ? (e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                Object.assign(state.current, { drag: true, lastX: e.clientX });
              }
            : undefined
        }
        onPointerMove={(e) => {
          const s = state.current;
          if (!s.drag) return;
          const dx = (e.clientX - s.lastX) * (W / e.currentTarget.clientWidth);
          s.offset += dx;
          s.lastX = e.clientX;
          if (dx) s.dir = Math.sign(dx);
        }}
        onPointerUp={() => (state.current.drag = false)}
        onPointerCancel={() => (state.current.drag = false)}
      >
        <path id={id} d={d} fill="none" />
        <text ref={measure} className="fill-current" style={{ visibility: "hidden", fontSize: 96, fontWeight: 700 }} xmlSpace="preserve">
          {label}
        </text>
        {unit > 0 && (
          <text className="fill-current" style={{ fontSize: 96, fontWeight: 700 }} xmlSpace="preserve">
            <textPath ref={path} href={`#${id}`}>
              {label.repeat(copies)}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
}
