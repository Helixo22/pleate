// Pointer effects (desktop only: touch screens and reduced motion get the plain content).
// - Magnet: pulls its content towards the cursor when it comes close.
// - Spotlight: a soft light in the accent follows the cursor across a surface.
// - Tilt: a card that tilts in 3D towards the cursor, with an optional glare.
// - ClickSpark: little sparks burst from every click inside it.
"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { useRef, useState, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

function useFinePointer() {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  return fine && !reduced;
}

export type MagnetProps = {
  children: ReactNode;
  /** How far beyond the element the pull starts (px). */
  padding?: number;
  /** 0–1: how much of the distance it follows. */
  strength?: number;
  className?: string;
};

export function Magnet({ children, padding = 60, strength = 0.3, className }: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useFinePointer();
  const x = useSpring(0, { stiffness: 220, damping: 18, mass: 0.6 });
  const y = useSpring(0, { stiffness: 220, damping: 18, mass: 0.6 });
  const onMove = (event: PointerEvent) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || !active) return;
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    const near = Math.abs(dx) < box.width / 2 + padding && Math.abs(dy) < box.height / 2 + padding;
    x.set(near ? dx * strength : 0);
    y.set(near ? dy * strength : 0);
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={cn("inline-block", className)}
      style={{ padding, margin: -padding }}
    >
      <motion.div style={{ x, y }}>{children}</motion.div>
    </div>
  );
}

export type SpotlightProps = HTMLAttributes<HTMLDivElement> & {
  /** Radius of the light (px). */
  size?: number;
  /** Light color (CSS); defaults to the soft accent. */
  color?: string;
};

export function Spotlight({ size = 320, color = "color-mix(in oklab, var(--pl-accent-ink) 18%, transparent)", className, children, ...props }: SpotlightProps) {
  const active = useFinePointer();
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const background = useMotionTemplate`radial-gradient(${size}px circle at ${x}px ${y}px, ${color}, transparent 70%)`;
  return (
    <div
      onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - box.left);
        y.set(event.clientY - box.top);
      }}
      onPointerLeave={() => {
        x.set(-1000);
        y.set(-1000);
      }}
      className={cn("relative isolate overflow-hidden", className)}
      {...props}
    >
      {active && <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[1]" style={{ background }} />}
      {children}
    </div>
  );
}

export type TiltProps = HTMLAttributes<HTMLDivElement> & {
  /** Maximum rotation in degrees. */
  max?: number;
  /** A light reflection following the tilt. */
  glare?: boolean;
  /** Slight zoom while hovered. */
  scale?: number;
};

export function Tilt({ max = 10, glare = true, scale = 1.02, className, children, ...props }: TiltProps) {
  const active = useFinePointer();
  const rx = useSpring(0, { stiffness: 260, damping: 22 });
  const ry = useSpring(0, { stiffness: 260, damping: 22 });
  const s = useSpring(1, { stiffness: 260, damping: 22 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, color-mix(in srgb, var(--pl-knob) 22%, transparent), transparent 55%)`;
  return (
    <div className={cn("[perspective:900px]", className)} {...props}>
      <motion.div
        onPointerMove={(event) => {
          if (!active) return;
          const box = event.currentTarget.getBoundingClientRect();
          const px = (event.clientX - box.left) / box.width;
          const py = (event.clientY - box.top) / box.height;
          ry.set((px - 0.5) * 2 * max);
          rx.set(-(py - 0.5) * 2 * max);
          s.set(scale);
          gx.set(px * 100);
          gy.set(py * 100);
        }}
        onPointerLeave={() => {
          rx.set(0);
          ry.set(0);
          s.set(1);
        }}
        style={{ rotateX: rx, rotateY: ry, scale: s, transformStyle: "preserve-3d" }}
        className="relative h-full rounded-[inherit]"
      >
        {children}
        {glare && active && <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: glareBg }} />}
      </motion.div>
    </div>
  );
}

type Spark = { id: number; x: number; y: number };

export type ClickSparkProps = HTMLAttributes<HTMLDivElement> & {
  color?: string;
  count?: number;
  /** Length the sparks travel (px). */
  radius?: number;
};

export function ClickSpark({ color = "var(--pl-accent-ink)", count = 8, radius = 22, className, children, onPointerDown, ...props }: ClickSparkProps) {
  const reduced = useReducedMotion();
  const [sparks, setSparks] = useState<Spark[]>([]);
  return (
    <div
      className={cn("relative", className)}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (reduced) return;
        const box = event.currentTarget.getBoundingClientRect();
        const spark = { id: Date.now() + Math.random(), x: event.clientX - box.left, y: event.clientY - box.top };
        setSparks((list) => [...list, spark]);
        setTimeout(() => setSparks((list) => list.filter((s) => s.id !== spark.id)), 600);
      }}
      {...props}
    >
      {children}
      {sparks.map((spark) => (
        <svg key={spark.id} aria-hidden="true" className="pointer-events-none absolute overflow-visible" style={{ left: spark.x, top: spark.y }} width="1" height="1">
          {Array.from({ length: count }, (_, i) => {
            const a = (i / count) * Math.PI * 2;
            return (
              <motion.line
                key={i}
                x1={0}
                y1={0}
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                initial={{ x2: Math.cos(a) * 4, y2: Math.sin(a) * 4, opacity: 1, pathLength: 1 }}
                animate={{ x1: Math.cos(a) * radius * 0.6, y1: Math.sin(a) * radius * 0.6, x2: Math.cos(a) * radius, y2: Math.sin(a) * radius, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            );
          })}
        </svg>
      ))}
    </div>
  );
}
