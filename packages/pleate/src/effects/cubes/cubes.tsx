// Cubes: a grid of small 3D cubes that turn to face the cursor as it passes, and roll in a wave from wherever you
// click. CSS 3D only. Touch gets the click wave, reduced motion gets a still grid.
"use client";

import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type MouseEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { useFinePointer, useHostPointer } from "../cursor-kit/cursor-kit.ts";

export type CubesProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** Cubes per row and per column. */
  grid?: number;
  /** Largest turn in degrees. */
  maxAngle?: number;
  /** Reach of the cursor, in cells. */
  radius?: number;
  /** Space between cubes, as a share of a cell (0 to 0.5). */
  gap?: number;
  /** Face color (CSS). */
  faceColor?: string;
  /** Edge color (CSS). */
  borderColor?: string;
  /** Roll a wave from the click point. */
  ripple?: boolean;
};

// Transform and shade (% of black mixed in) per face, so the sides read as 3D.
const FACES: [string, number][] = [["rotateY(0deg)", 0], ["rotateY(180deg)", 0], ["rotateY(90deg)", 14], ["rotateY(-90deg)", 14], ["rotateX(90deg)", 6], ["rotateX(-90deg)", 22]];

export function Cubes({ grid = 8, maxAngle = 45, radius = 3, gap = 0.12, faceColor = "var(--pl-surface-2)", borderColor = "var(--pl-separator)", ripple = true, className, style, ...props }: CubesProps) {
  const host = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const cubes = () => Array.from(host.current?.querySelectorAll<HTMLElement>("[data-cube]") ?? []);

  // Cube depth follows the cell width.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(() => el.style.setProperty("--cube", `${(el.clientWidth / grid) * (1 - gap)}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, [grid, gap]);

  const cellAt = (x: number, y: number) => {
    const el = host.current!;
    return [(x / el.clientWidth) * grid - 0.5, (y / el.clientHeight) * grid - 0.5];
  };

  useHostPointer(
    host,
    {
      move: (x, y) => {
        const [cx, cy] = cellAt(x, y);
        cubes().forEach((c, i) => {
          const dx = (i % grid) - cx, dy = Math.floor(i / grid) - cy;
          const t = Math.max(0, 1 - Math.hypot(dx, dy) / radius);
          c.style.transform = `rotateX(${(-dy / radius) * maxAngle * t}deg) rotateY(${(dx / radius) * maxAngle * t}deg)`;
        });
      },
      leave: () => cubes().forEach((c) => (c.style.transform = "")),
    },
    false,
    fine,
  );

  const onClick = (e: MouseEvent) => {
    if (!ripple || reduced) return;
    const box = host.current!.getBoundingClientRect();
    const [cx, cy] = cellAt(e.clientX - box.left, e.clientY - box.top);
    cubes().forEach((c, i) => {
      const d = Math.hypot((i % grid) - cx, Math.floor(i / grid) - cy);
      c.animate([{ transform: "rotateX(0deg)" }, { transform: "rotateX(180deg)" }], { duration: 600, delay: d * 70, easing: "cubic-bezier(.22,1,.36,1)" });
    });
  };

  return (
    <div
      ref={host}
      onClick={onClick}
      className={cn("grid aspect-square w-full [perspective:900px]", className)}
      style={{ gridTemplateColumns: `repeat(${grid}, 1fr)`, ...style } as CSSProperties}
      aria-hidden="true"
      {...props}
    >
      {Array.from({ length: grid * grid }, (_, i) => (
        <div key={i} className="grid place-items-center">
          <div data-cube className="relative size-[var(--cube)] transition-transform duration-300 ease-out [transform-style:preserve-3d]">
            {FACES.map(([f, shade]) => (
              <span
                key={f}
                className="absolute inset-0 border"
                style={{ transform: `${f} translateZ(calc(var(--cube) / 2))`, background: `color-mix(in oklab, ${faceColor}, black ${shade}%)`, borderColor }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
