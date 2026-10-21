// Reveal on scroll.
// - Reveal: its content enters (fade, slide from a side, zoom, blur) when it scrolls into view.
// - RevealGroup + RevealItem: children enter one after another.
// - ScrollProgress: a thin bar at the top showing how far the page (or an element) has been read.
// - Parallax: content that moves slower or faster than the scroll.
// All of them render in place, still, with reduced motion.
"use client";

import { motion, useScroll, useSpring, useTransform, type Variants } from "motion/react";
import { createContext, useContext, useRef, type ReactNode, type RefObject } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type RevealEffect = "fade" | "up" | "down" | "left" | "right" | "zoom" | "blur";

function variantsFor(effect: RevealEffect, distance: number): Variants {
  const hidden: Record<string, number | string> = { opacity: 0 };
  if (effect === "up") hidden.y = distance;
  if (effect === "down") hidden.y = -distance;
  if (effect === "left") hidden.x = distance;
  if (effect === "right") hidden.x = -distance;
  if (effect === "zoom") hidden.scale = 0.92;
  if (effect === "blur") Object.assign(hidden, { filter: "blur(12px)", y: distance / 2 });
  return { hidden, shown: { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" } };
}

const EASE = [0.22, 1, 0.36, 1] as const;

export type RevealProps = {
  children: ReactNode;
  effect?: RevealEffect;
  /** Pixels traveled. */
  distance?: number;
  delay?: number;
  duration?: number;
  /** Animate once (default) or every time it enters. */
  once?: boolean;
  /** How much must be visible first (0–1). */
  amount?: number;
  as?: "div" | "section" | "li" | "span" | "article";
  className?: string;
};

export function Reveal({ children, effect = "up", distance = 28, delay = 0, duration = 0.7, once = true, amount = 0.25, as = "div", className }: RevealProps) {
  const reduced = useReducedMotion();
  const Comp = motion[as];
  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }
  return (
    <Comp
      className={className}
      variants={variantsFor(effect, distance)}
      initial="hidden"
      whileInView="shown"
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

const GroupContext = createContext<{ effect: RevealEffect; distance: number; duration: number } | null>(null);

export type RevealGroupProps = Omit<RevealProps, "effect" | "delay"> & {
  effect?: RevealEffect;
  /** Seconds between children. */
  stagger?: number;
  delay?: number;
};

export function RevealGroup({ children, effect = "up", distance = 24, duration = 0.6, stagger = 0.08, delay = 0, once = true, amount = 0.15, as = "div", className }: RevealGroupProps) {
  const reduced = useReducedMotion();
  const Comp = motion[as];
  return (
    <GroupContext.Provider value={{ effect, distance, duration }}>
      <Comp
        className={className}
        initial={reduced ? false : "hidden"}
        whileInView="shown"
        viewport={{ once, amount }}
        variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      >
        {children}
      </Comp>
    </GroupContext.Provider>
  );
}

export function RevealItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: RevealProps["as"] }) {
  const group = useContext(GroupContext);
  const Comp = motion[as];
  const v = variantsFor(group?.effect ?? "up", group?.distance ?? 24);
  return (
    <Comp className={className} variants={{ hidden: v.hidden, shown: { ...(v.shown as object), transition: { duration: group?.duration ?? 0.6, ease: EASE } } }}>
      {children}
    </Comp>
  );
}

export type ScrollProgressProps = {
  /** Track an element instead of the page. */
  target?: RefObject<HTMLElement | null>;
  position?: "top" | "bottom";
  /** Fixed to the viewport (default) or in flow. */
  fixed?: boolean;
  className?: string;
};

export function ScrollProgress({ target, position = "top", fixed = true, className }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll(target ? { target, offset: ["start start", "end end"] } : undefined);
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className={cn(
        "h-[3px] origin-left bg-accent rtl:origin-right",
        fixed && cn("fixed inset-x-0 z-(--pl-z-toast)", position === "top" ? "top-0" : "bottom-0"),
        className,
      )}
    />
  );
}

export type ParallaxProps = {
  children: ReactNode;
  /** -1…1: negative moves against the scroll, positive with it. 0.2 is subtle. */
  speed?: number;
  className?: string;
};

export function Parallax({ children, speed = 0.2, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-speed * 100}px`, `${speed * 100}px`]);
  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}
