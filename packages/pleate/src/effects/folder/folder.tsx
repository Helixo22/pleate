// Folder: a folder that opens when clicked: the front flap tilts down and up to three papers fan out of it. While
// open, the papers lean a little towards the pointer. The folder is a toggle button (aria-expanded); paper content
// is hidden from assistive tech while closed. Reduced motion opens without the springs.
"use client";

import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useControllableState } from "../../lib/use-controllable-state.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type FolderProps = {
  /** Up to three papers (text, an image, anything small). */
  items?: ReactNode[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Folder color (CSS); defaults to the accent. */
  color?: string;
  /** Width in px; height follows. */
  size?: number;
  /** Accessible name of the toggle. */
  label?: string;
  className?: string;
};

const FAN = [
  { x: -0.55, y: -0.55, r: -14 },
  { x: 0.05, y: -0.72, r: 3 },
  { x: 0.6, y: -0.5, r: 15 },
];

export function Folder({ items = [], open, defaultOpen = false, onOpenChange, color = "var(--pl-accent)", size = 120, label = "Folder", className }: FolderProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange });
  const reduced = useReducedMotion();
  const [lean, setLean] = useState({ x: 0, y: 0 });
  const height = size * 0.8;
  const papers = items.slice(0, 3);
  const spring = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 300, damping: 20 };

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-label={label}
      onClick={() => setOpen(!isOpen)}
      onPointerMove={(event) => {
        if (!isOpen || reduced) return;
        const box = event.currentTarget.getBoundingClientRect();
        setLean({ x: (event.clientX - box.left - box.width / 2) * 0.12, y: (event.clientY - box.top - box.height / 2) * 0.12 });
      }}
      onPointerLeave={() => setLean({ x: 0, y: 0 })}
      className={cn("pl-focus-ring pl-touch relative block cursor-pointer rounded-lg [perspective:600px]", className)}
      style={{ width: size, height }}
    >
      {/* Back of the folder, with its tab. */}
      <span aria-hidden="true" className="absolute inset-0 rounded-lg rounded-tl-none" style={{ background: `color-mix(in oklab, ${color} 78%, black)` }}>
        <span className="absolute bottom-full left-0 h-[12%] w-[38%] rounded-t-md" style={{ background: `color-mix(in oklab, ${color} 78%, black)` }} />
      </span>
      {papers.map((paper, i) => {
        const fan = FAN[papers.length === 1 ? 1 : papers.length === 2 ? i * 2 : i]!;
        return (
          <motion.span
            key={i}
            aria-hidden={!isOpen || undefined}
            initial={false}
            animate={
              isOpen
                ? { x: fan.x * size + lean.x, y: fan.y * size + lean.y, rotate: fan.r, scale: 1 }
                : { x: 0, y: size * 0.05 - i * 4, rotate: 0, scale: 0.92 }
            }
            transition={{ ...spring, delay: isOpen && !reduced ? i * 0.04 : 0 }}
            className="absolute inset-x-[10%] top-[8%] grid h-[80%] place-items-center overflow-hidden rounded-md bg-white text-caption1 text-black shadow-[0_2px_8px_rgb(0_0_0/0.18)]"
          >
            {paper}
          </motion.span>
        );
      })}
      {/* Front flap: tilts down when open. */}
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ rotateX: isOpen ? 38 : 0, skewX: isOpen ? 6 : 0 }}
        transition={spring}
        className="absolute inset-x-0 bottom-0 h-[86%] origin-bottom rounded-lg [transform-style:preserve-3d]"
        style={{ background: `linear-gradient(to bottom, color-mix(in oklab, ${color} 92%, white), ${color})`, boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.3)" }}
      />
    </button>
  );
}
