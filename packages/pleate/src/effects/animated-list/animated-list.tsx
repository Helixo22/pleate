// AnimatedList: a scrolling list whose rows scale and fade in as they enter the view, with soft fades at the top
// and bottom edges. It is a listbox: arrow keys, Home and End move the highlight (kept in view), Enter or a click
// picks a row. Reduced motion shows the rows without the entrance.
"use client";

import { motion } from "motion/react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type AnimatedListProps<T> = {
  items: T[];
  /** Row content; defaults to String(item). */
  renderItem?: (item: T, index: number, selected: boolean) => ReactNode;
  /** Called when a row is picked by click or Enter. */
  onSelect?: (item: T, index: number) => void;
  defaultSelected?: number;
  /** Fades at the top and bottom of the scroll area. */
  fades?: boolean;
  /** Height of the scroll area in px. */
  height?: number;
  /** Accessible name of the list. */
  label?: string;
  className?: string;
};

export function AnimatedList<T>({
  items,
  renderItem = (item) => String(item),
  onSelect,
  defaultSelected = -1,
  fades = true,
  height = 360,
  label = "Items",
  className,
}: AnimatedListProps<T>) {
  const id = useId();
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState(defaultSelected);
  const scroller = useRef<HTMLUListElement>(null);

  const move = (to: number) => {
    const next = Math.max(0, Math.min(items.length - 1, to));
    setSelected(next);
    scroller.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowDown: selected + 1, ArrowUp: selected - 1, Home: 0, End: items.length - 1 };
    if (event.key in map) {
      event.preventDefault();
      move(map[event.key]!);
    } else if (event.key === "Enter" && selected >= 0) {
      event.preventDefault();
      onSelect?.(items[selected]!, selected);
    }
  };

  const fade = "linear-gradient(to bottom, transparent, #000 48px, #000 calc(100% - 48px), transparent)";
  return (
    <ul
      ref={scroller}
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={selected >= 0 ? `${id}-${selected}` : undefined}
      onKeyDown={onKeyDown}
      className={cn("pl-focus-ring pl-no-scrollbar flex w-full flex-col gap-2 overflow-y-auto rounded-xl p-2", className)}
      style={{ height, ...(fades && { maskImage: fade, WebkitMaskImage: fade, paddingBlock: 40 }) }}
    >
      {items.map((item, i) => (
        <motion.li
          key={i}
          id={`${id}-${i}`}
          data-index={i}
          role="option"
          aria-selected={i === selected}
          onClick={() => {
            setSelected(i);
            onSelect?.(item, i);
          }}
          initial={reduced ? false : { opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ root: scroller, amount: 0.4 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className={cn(
            "shrink-0 cursor-pointer rounded-lg px-4 py-3 text-body transition-colors",
            i === selected ? "bg-accent text-on-accent" : "bg-surface-2 text-fg hover:bg-fill-2",
          )}
        >
          {renderItem(item, i, i === selected)}
        </motion.li>
      ))}
    </ul>
  );
}
