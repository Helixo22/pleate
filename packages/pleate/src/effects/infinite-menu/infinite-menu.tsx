// InfiniteMenu: items laid out on a sphere you spin by dragging. On release it coasts, then the nearest item swings
// to the front and its title shows below. Arrow keys hop to the neighbor in that direction, Enter opens the
// front item. Pure DOM projection (no WebGL); reduced motion snaps without coasting.
"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronRightIcon } from "../../lib/icons.tsx";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type InfiniteMenuItem = {
  /** Image URL shown on the disc. */
  image: string;
  title: string;
  description?: string;
  href?: string;
};

export type InfiniteMenuProps = {
  items: InfiniteMenuItem[];
  /** Discs on the sphere; items repeat to fill it. */
  count?: number;
  /** Called with the front item when its button is pressed (or Enter). */
  onSelect?: (item: InfiniteMenuItem) => void;
  "aria-label"?: string;
  className?: string;
};

type V = [number, number, number];
type M = number[]; // 3x3 row-major

const mul = (m: M, v: V): V => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
function axisAngle([x, y, z]: V, a: number): M {
  const c = Math.cos(a), s = Math.sin(a), t = 1 - c;
  return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c];
}
const mm = (a: M, b: M): M => [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]));

function fibonacci(n: number): V[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    return [Math.cos(golden * i) * r, y, Math.sin(golden * i) * r] as V;
  });
}

export function InfiniteMenu({ items, count = 24, onSelect, className, ...aria }: InfiniteMenuProps) {
  const reduced = useReducedMotion();
  const n = Math.max(count, items.length);
  const points = useMemo(() => fibonacci(n), [n]);
  const stage = useRef<HTMLDivElement>(null);
  const discs = useRef<(HTMLDivElement | null)[]>([]);
  const state = useRef({ rot: [1, 0, 0, 0, 1, 0, 0, 0, 1] as M, spin: [0, 1, 0] as V, speed: 0, drag: null as null | { x: number; y: number }, target: -1, front: 0 });
  const [front, setFront] = useState(0);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const s = state.current;
      const el = stage.current;
      if (!el) return;
      const radius = Math.min(el.clientWidth, el.clientHeight) * 0.4;
      if (!s.drag && s.speed > 0.0004 && !reduced) {
        s.rot = mm(axisAngle(s.spin, s.speed), s.rot);
        s.speed *= 0.93;
      } else if (!s.drag) {
        s.speed = 0;
        // Ease the chosen (or nearest) disc to the front.
        let best = s.target;
        if (best < 0) {
          let z = -2;
          points.forEach((p, i) => {
            const q = mul(s.rot, p);
            if (q[2] > z) (z = q[2]), (best = i);
          });
        }
        const q = mul(s.rot, points[best]);
        const axis: V = [q[1], -q[0], 0];
        const len = Math.hypot(axis[0], axis[1]);
        const angle = Math.acos(Math.min(1, q[2]));
        if (angle > 0.002 && len > 1e-6) s.rot = mm(axisAngle([axis[0] / len, axis[1] / len, 0], reduced ? angle : angle * 0.12), s.rot);
        else s.target = -1;
        if (best !== s.front) (s.front = best), setFront(best);
      }
      points.forEach((p, i) => {
        const d = discs.current[i];
        if (!d) return;
        const [x, y, z] = mul(s.rot, p);
        const scale = 0.2 + 0.8 * ((z + 1) / 2) ** 2;
        d.style.width = d.style.height = `${radius * 0.55}px`;
        d.style.transform = `translate(-50%, -50%) translate3d(${x * radius}px, ${y * radius}px, 0) scale(${scale})`;
        d.style.zIndex = String(Math.round((z + 1) * 100));
        d.style.opacity = String(z < -0.1 ? 0.15 : 0.3 + 0.7 * z);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [points, reduced]);

  const item = items[front % items.length];

  const hop = (dx: number, dy: number) => {
    const s = state.current;
    let best = -1, bestZ = -2;
    points.forEach((p, i) => {
      const q = mul(s.rot, p);
      if (q[0] * dx + q[1] * dy > 0.15 && q[2] > bestZ) (bestZ = q[2]), (best = i);
    });
    if (best >= 0) s.target = best;
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const dir: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dir[event.key]) {
      event.preventDefault();
      hop(...dir[event.key]);
    } else if (event.key === "Enter") {
      if (item.href) window.location.assign(item.href);
      onSelect?.(item);
    }
  };

  return (
    <div className={cn("relative flex h-[30rem] flex-col items-center", className)}>
      <div
        ref={stage}
        tabIndex={0}
        role="group"
        aria-roledescription="3D menu"
        aria-label={aria["aria-label"] ?? "Menu sphere. Drag or use the arrow keys to rotate."}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          state.current.drag = { x: e.clientX, y: e.clientY };
          state.current.target = -1;
          setMoving(true);
        }}
        onPointerMove={(e) => {
          const s = state.current;
          if (!s.drag || !stage.current) return;
          const dx = e.clientX - s.drag.x, dy = e.clientY - s.drag.y;
          s.drag = { x: e.clientX, y: e.clientY };
          const len = Math.hypot(dx, dy);
          if (!len) return;
          const radius = Math.min(stage.current.clientWidth, stage.current.clientHeight) * 0.4;
          s.spin = [-dy / len, dx / len, 0];
          s.speed = len / radius;
          s.rot = mm(axisAngle(s.spin, s.speed), s.rot);
        }}
        onPointerUp={() => {
          state.current.drag = null;
          setMoving(false);
        }}
        className="pl-focus-ring relative w-full flex-1 cursor-grab touch-none overflow-hidden rounded-3xl select-none active:cursor-grabbing"
      >
        {points.map((_, i) => {
          const it = items[i % items.length];
          return (
            <div
              key={i}
              ref={(el) => {
                discs.current[i] = el;
              }}
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 size-24 rounded-full bg-fill bg-cover bg-center shadow-[var(--pl-shadow-lg)] ring-1 ring-white/10 will-change-transform"
              style={{ backgroundImage: `url("${it.image}")` }}
            />
          );
        })}
      </div>
      <div aria-live="polite" className={cn("pointer-events-none mt-4 min-h-16 px-16 text-center transition-opacity duration-300", moving ? "opacity-0" : "opacity-100")}>
        <p className="text-title2 text-fg">{item.title}</p>
        {item.description && <p className="text-subhead text-fg-muted">{item.description}</p>}
      </div>
      {(item.href || onSelect) &&
        (() => {
          const cls = cn(
            "pl-focus-ring absolute bottom-3 right-3 grid size-12 place-items-center rounded-full bg-accent text-on-accent shadow-[var(--pl-shadow-lg)] transition duration-300 [&_svg]:size-6",
            moving ? "scale-0 opacity-0" : "scale-100 opacity-100",
          );
          return item.href ? (
            <a href={item.href} onClick={() => onSelect?.(item)} aria-label={`Open ${item.title}`} className={cls}>
              <ChevronRightIcon />
            </a>
          ) : (
            <button type="button" onClick={() => onSelect?.(item)} aria-label={`Open ${item.title}`} className={cls}>
              <ChevronRightIcon />
            </button>
          );
        })()}
    </div>
  );
}
