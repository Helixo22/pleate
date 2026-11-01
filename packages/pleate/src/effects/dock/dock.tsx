// Dock: a row of app icons on a glass shelf that magnify as the pointer passes over them, neighbours growing a
// little less, with a label popping up above the hovered or focused one. It is a toolbar: Tab enters it once and
// arrow keys, Home and End move between items. Touch screens and reduced motion keep the icons at rest size.
"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useMediaQuery } from "../../lib/use-media-query.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type DockItem = {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  /** Renders a link instead of a button. */
  href?: string;
  /** Shows a dot under the icon (an open app). */
  active?: boolean;
};

export type DockProps = {
  items: DockItem[];
  /** Icon size at rest, px. */
  size?: number;
  /** Icon size right under the pointer, px. */
  magnification?: number;
  /** How far the magnification reaches, px. */
  distance?: number;
  /** Accessible name of the toolbar. */
  label?: string;
  className?: string;
};

export function Dock({ items, size = 48, magnification = 76, distance = 150, label = "Dock", className }: DockProps) {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const live = fine && !reduced;
  const mouseX = useMotionValue(Infinity);
  const [focus, setFocus] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent) => {
    const to = { ArrowRight: focus + 1, ArrowLeft: focus - 1, Home: 0, End: items.length - 1 }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    const next = (to + items.length) % items.length;
    setFocus(next);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="toolbar"
      aria-label={label}
      onKeyDown={onKeyDown}
      onPointerMove={(event) => live && mouseX.set(event.clientX)}
      onPointerLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto flex w-fit max-w-full items-end gap-2.5 rounded-[calc(var(--radius-xl)+4px)] bg-surface/70 px-3 pb-2.5 pt-2.5 shadow-[0_10px_40px_rgb(0_0_0/0.2),inset_0_0_0_1px_var(--pl-separator)] backdrop-blur-xl",
        className,
      )}
      style={{ height: size + 22 }}
    >
      {items.map((item, i) => (
        <DockIcon
          key={item.label}
          item={item}
          mouseX={mouseX}
          size={size}
          magnification={live ? magnification : size}
          distance={distance}
          tabIndex={i === focus ? 0 : -1}
          onFocus={() => setFocus(i)}
          refFn={(el) => {
            refs.current[i] = el;
          }}
        />
      ))}
    </div>
  );
}

function DockIcon({
  item,
  mouseX,
  size,
  magnification,
  distance,
  tabIndex,
  onFocus,
  refFn,
}: {
  item: DockItem;
  mouseX: MotionValue<number>;
  size: number;
  magnification: number;
  distance: number;
  tabIndex: number;
  onFocus: () => void;
  refFn: (el: HTMLElement | null) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState(false);
  const target = useTransform(mouseX, (x) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect || !Number.isFinite(x)) return size;
    const d = Math.abs(x - (rect.left + rect.width / 2));
    // Cosine falloff: full size under the pointer, rest size at `distance`.
    return d > distance ? size : size + (magnification - size) * (0.5 + 0.5 * Math.cos((d / distance) * Math.PI));
  });
  const width = useSpring(target, { stiffness: 380, damping: 28, mass: 0.2 });
  const Tag = item.href ? "a" : "button";

  return (
    <motion.div ref={box} className="relative flex shrink-0 flex-col items-center" style={{ width, height: width }}>
      <AnimatePresence>
        {tip && (
          <motion.span
            role="presentation"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-elevated px-2 py-1 text-caption1 text-fg shadow-[0_4px_14px_rgb(0_0_0/0.2),inset_0_0_0_1px_var(--pl-separator)]"
            aria-hidden="true"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      <Tag
        ref={refFn as never}
        href={item.href}
        type={item.href ? undefined : "button"}
        aria-label={item.label}
        tabIndex={tabIndex}
        onClick={item.onClick}
        onFocus={() => {
          onFocus();
          setTip(true);
        }}
        onBlur={() => setTip(false)}
        onPointerEnter={() => setTip(true)}
        onPointerLeave={() => setTip(false)}
        className="pl-focus-ring grid size-full cursor-pointer place-items-center rounded-[28%] bg-fill-3 text-fg [&_svg]:size-[45%]"
      >
        {item.icon}
      </Tag>
      {item.active && <span aria-hidden="true" className="absolute -bottom-2 size-1 rounded-full bg-fg-muted" />}
    </motion.div>
  );
}
