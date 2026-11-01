// BlobCursor: a few soft blobs trail the cursor and melt into each other (an SVG "goo" filter). It lives inside its
// container (or the whole page with `global`), sits behind the content, ignores touch and reduced motion, and keeps
// the system cursor.
"use client";

import { useId, useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { useCanvasLoop, useFinePointer, useHostPointer } from "../cursor-kit/cursor-kit.ts";

export type BlobCursorProps = HTMLAttributes<HTMLDivElement> & {
  /** Blob color (CSS). */
  color?: string;
  /** Diameter of each blob in px, leader first. */
  sizes?: number[];
  /** 0 to 1: how quickly the leader catches the pointer; followers are slower. */
  speed?: number;
  /** Melt the blobs together. */
  goo?: boolean;
  /** Follow the pointer across the whole page (fixed layer on top) instead of only this container. */
  global?: boolean;
};

export function BlobCursor({ color = "var(--pl-accent)", sizes = [64, 40, 26], speed = 0.35, goo = true, global = false, className, children, ...props }: BlobCursorProps) {
  const host = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const canvasless = useRef<HTMLCanvasElement>(null);
  const active = useFinePointer();
  const filterId = "pl-goo-" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const state = useRef({ tx: 0, ty: 0, shown: false, pts: sizes.map(() => ({ x: 0, y: 0 })) });

  // The loop only moves DOM nodes; the hidden canvas just borrows the shared frame scheduler.
  const wake = useCanvasLoop(
    canvasless,
    () => {
      const s = state.current;
      const nodes = layer.current?.children;
      if (!nodes) return false;
      let moving = false;
      s.pts.forEach((p, i) => {
        const k = speed * Math.pow(0.7, i);
        p.x += (s.tx - p.x) * k;
        p.y += (s.ty - p.y) * k;
        if (Math.abs(s.tx - p.x) + Math.abs(s.ty - p.y) > 0.2) moving = true;
        const n = nodes[i] as HTMLElement | undefined;
        if (n) n.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
      });
      return moving;
    },
    active,
  );

  useHostPointer(
    host,
    {
      move: (x, y) => {
        const s = state.current;
        if (s.pts.length !== sizes.length) s.pts = sizes.map(() => ({ x, y }));
        if (!s.shown) s.pts.forEach((p) => Object.assign(p, { x, y }));
        Object.assign(s, { tx: x, ty: y, shown: true });
        if (layer.current) layer.current.style.opacity = "1";
        wake();
      },
      leave: () => {
        state.current.shown = false;
        if (layer.current) layer.current.style.opacity = "0";
      },
    },
    global,
    active,
  );

  return (
    <div ref={host} className={cn("relative isolate", className)} {...props}>
      {active && (
        <div aria-hidden="true" className={cn("pointer-events-none overflow-hidden", global ? "fixed inset-0 z-50" : "absolute inset-0 -z-[1] rounded-[inherit]")}>
          <canvas ref={canvasless} className="absolute size-px opacity-0" />
          <svg className="absolute size-0">
            <filter id={filterId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
              <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
            </filter>
          </svg>
          <div ref={layer} className="absolute inset-0 opacity-0 transition-opacity duration-300" style={{ filter: goo ? `url(#${filterId})` : undefined }}>
            {sizes.map((size, i) => (
              <span key={i} className="absolute top-0 left-0 rounded-full" style={{ width: size, height: size, background: color }} />
            ))}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
