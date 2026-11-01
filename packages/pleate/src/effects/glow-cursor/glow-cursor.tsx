// GlowCursor: a soft glow trails the cursor with a little lag, with a small bright core at the pointer. It lights the
// surface behind the content. It lives inside its container (or the whole page with `global`), ignores touch and
// reduced motion, and keeps the system cursor.
"use client";

import { motion, useSpring } from "motion/react";
import { useRef, useState, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useFinePointer, useHostPointer } from "../cursor-kit/cursor-kit.ts";

export type GlowCursorProps = HTMLAttributes<HTMLDivElement> & {
  /** Glow color (CSS). */
  color?: string;
  /** Glow diameter in px. */
  size?: number;
  /** 0 to 1: glow strength. */
  intensity?: number;
  /** Show a small dot right at the pointer. */
  core?: boolean;
  /** Follow the pointer across the whole page (fixed layer) instead of only this container. */
  global?: boolean;
};

export function GlowCursor({ color = "var(--pl-accent)", size = 280, intensity = 0.5, core = true, global = false, className, children, ...props }: GlowCursorProps) {
  const host = useRef<HTMLDivElement>(null);
  const active = useFinePointer();
  const [shown, setShown] = useState(false);
  const spring = { stiffness: 150, damping: 20, mass: 0.6 };
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);
  const cx = useSpring(0, { stiffness: 900, damping: 50 });
  const cy = useSpring(0, { stiffness: 900, damping: 50 });

  useHostPointer(
    host,
    {
      move: (px, py) => {
        if (!shown) [x, y, cx, cy].forEach((m, i) => m.jump(i % 2 ? py : px));
        x.set(px);
        y.set(py);
        cx.set(px);
        cy.set(py);
        setShown(true);
      },
      leave: () => setShown(false),
    },
    global,
    active,
  );

  return (
    <div ref={host} className={cn("relative isolate", className)} {...props}>
      {active && (
        <div aria-hidden="true" className={cn("pointer-events-none overflow-hidden transition-opacity duration-300", global ? "fixed inset-0 z-50" : "absolute inset-0 -z-[1] rounded-[inherit]", shown ? "opacity-100" : "opacity-0")}>
          <motion.div
            className="absolute top-0 left-0 rounded-full"
            style={{
              x,
              y,
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              background: `radial-gradient(circle, color-mix(in oklab, ${color} ${Math.round(intensity * 100)}%, transparent), transparent 65%)`,
            }}
          />
          {core && <motion.div className="absolute top-0 left-0 -mt-1 -ml-1 size-2 rounded-full" style={{ x: cx, y: cy, background: color, boxShadow: `0 0 12px 2px ${color}` }} />}
        </div>
      )}
      {children}
    </div>
  );
}
