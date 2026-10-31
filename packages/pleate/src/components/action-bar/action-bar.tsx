// ActionBar: the contextual bar for a selection. It slides up from the bottom when `open`, shows how many items are
// selected (the count rolls) and holds the actions. Edge to edge with a margin on phones, centered on wider screens,
// above the home indicator. Lift it over a TabBar with `offset`.
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";
import { spring } from "../../motion/tokens.ts";
import { Odometer } from "../../effects/motion-graphics/motion-graphics.tsx";
import { IconButton } from "../icon-button/icon-button.tsx";

export type ActionBarProps = {
  open: boolean;
  /** Number of selected items. */
  count: number;
  /** Text after the count. */
  countLabel?: string;
  /** Usually a few Buttons. */
  actions?: ReactNode;
  /** Shows a clear button that ends the selection. */
  onClear?: () => void;
  clearLabel?: string;
  /** Accessible name of the toolbar. */
  label?: string;
  /** Extra px above the bottom edge, e.g. the height of a TabBar. */
  offset?: number;
  /** Fixed to the viewport bottom (default) or in flow (e.g. inside a demo frame). */
  position?: "fixed" | "static";
  className?: string;
};

export function ActionBar({
  open,
  count,
  countLabel = "selected",
  actions,
  onClear,
  clearLabel = "Clear selection",
  label = "Selection",
  offset = 0,
  position = "fixed",
  className,
}: ActionBarProps) {
  // Keep showing the last count while the bar slides away after a clear.
  const shown = useRef(count);
  if (open) shown.current = count;
  return (
    <div
      className={cn(
        "pointer-events-none z-(--pl-z-sticky) flex justify-center px-[max(1rem,var(--pl-safe-left))]",
        position === "fixed" && "fixed inset-x-0 bottom-0",
      )}
      style={{ paddingBottom: `calc(${offset}px + max(1rem, var(--pl-safe-bottom)))` }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            role="toolbar"
            aria-label={label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={spring.sheet}
            className={cn(
              "pointer-events-auto flex h-14 w-full items-center gap-3 rounded-lg bg-elevated ps-4 pe-2 text-fg shadow-lg sm:w-auto sm:min-w-96",
              className,
            )}
          >
            <span className="flex flex-1 items-baseline gap-1.5 text-subhead whitespace-nowrap" aria-live="polite">
              <Odometer value={shown.current} duration={0.4} className="font-mono font-medium" />
              <span className="text-fg-muted">{countLabel}</span>
            </span>
            <div className="flex items-center gap-2">{actions}</div>
            {onClear && (
              <IconButton aria-label={clearLabel} variant="plain" tone="neutral" size="sm" onClick={onClear}>
                <XIcon />
              </IconButton>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
