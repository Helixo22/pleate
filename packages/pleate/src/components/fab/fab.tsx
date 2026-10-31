// Fab: the floating action button for phone layouts, pinned bottom-end above the home indicator. With `actions` it is
// a speed dial: pressing it opens a column of labelled actions above it (staggered fade and rise); Escape or a press
// outside closes it. Hide it from a breakpoint up with hideFrom, like TabBar.
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { PlusIcon } from "../../lib/icons.tsx";
import { ease } from "../../motion/tokens.ts";
import { IconButton } from "../icon-button/icon-button.tsx";

const HIDE = { never: "", md: "md:hidden", lg: "lg:hidden" } as const;

export type FabAction = { id: string; label: string; icon: ReactNode; onSelect: () => void };

export type FabProps = {
  /** Accessible name of the main button. */
  label: string;
  /** Defaults to a plus, which turns into a close mark while the dial is open. */
  icon?: ReactNode;
  /** Plain button mode (no actions). */
  onClick?: () => void;
  /** Speed-dial actions, listed bottom-up nearest the button first. */
  actions?: FabAction[];
  /** Fixed to the viewport (default) or in flow (e.g. inside a demo frame). */
  position?: "fixed" | "static";
  hideFrom?: keyof typeof HIDE;
  /** Extra px above the bottom edge, e.g. the height of a TabBar. */
  offset?: number;
  className?: string;
};

export function Fab({ label, icon, onClick, actions, position = "fixed", hideFrom = "never", offset = 0, className }: FabProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const dial = !!actions?.length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div
      ref={root}
      className={cn(
        "z-(--pl-z-sticky) flex w-fit flex-col items-end gap-3",
        position === "fixed" && "fixed end-[max(1rem,var(--pl-safe-right))]",
        HIDE[hideFrom],
        className,
      )}
      style={position === "fixed" ? { bottom: `calc(${offset}px + max(1rem, var(--pl-safe-bottom)))` } : undefined}
    >
      <AnimatePresence>
        {dial && open && (
          <motion.ul id={listId} aria-label={label} className="flex flex-col-reverse items-end gap-2" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            {actions!.map((action, i) => (
              <motion.li
                key={action.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.18, delay: i * 0.035, ease: ease.out } }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    action.onSelect();
                  }}
                  className="group pl-focus-ring pl-touch flex cursor-pointer items-center gap-3 rounded-md"
                >
                  <span className="rounded-sm bg-elevated px-2.5 py-1 text-footnote font-medium text-fg shadow-md">{action.label}</span>
                  <span className="grid size-10 place-items-center rounded-md bg-elevated text-fg shadow-md transition-[background-color,scale] duration-(--pl-duration-fast) group-hover:bg-surface-2 motion-safe:group-active:scale-95 [&_svg]:size-[1.125rem]">
                    {action.icon}
                  </span>
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <IconButton
        ref={trigger}
        aria-label={label}
        variant="filled"
        aria-expanded={dial ? open : undefined}
        aria-controls={dial && open ? listId : undefined}
        onClick={dial ? () => setOpen((o) => !o) : onClick}
        className="size-14 rounded-xl shadow-lg! [&_svg]:size-6"
      >
        <span className={cn("grid transition-[rotate] duration-(--pl-duration-base) ease-out", dial && !icon && open && "rotate-45")}>
          {icon ?? <PlusIcon />}
        </span>
      </IconButton>
    </div>
  );
}
