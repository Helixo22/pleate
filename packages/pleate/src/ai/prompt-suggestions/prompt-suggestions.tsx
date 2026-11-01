// PromptSuggestions: starter prompts for an empty chat. Cards with an icon, a title and a hint ("grid"), or compact
// chips that scroll sideways on phones ("chips"), or an inset grouped list with chevrons and hairlines ("list"). They appear one after another; choosing one calls onSelect.
"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronRightIcon } from "../../lib/icons.tsx";
import { spring } from "../../motion/tokens.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type PromptSuggestion = { id?: string; title: ReactNode; description?: ReactNode; icon?: ReactNode; prompt: string };

export type PromptSuggestionsProps = {
  suggestions: PromptSuggestion[];
  onSelect: (prompt: string, suggestion: PromptSuggestion) => void;
  variant?: "grid" | "chips" | "list";
  label?: string;
  className?: string;
};

export function PromptSuggestions({ suggestions, onSelect, variant = "grid", label = "Suggestions", className }: PromptSuggestionsProps) {
  const reduced = useReducedMotion();
  const grid = variant === "grid";
  const list = variant === "list";
  return (
    <ul
      aria-label={label}
      className={cn(
        list
          ? "flex flex-col overflow-hidden rounded-xl bg-surface shadow-[var(--pl-edge)]"
          : grid
            ? "grid gap-2.5 sm:grid-cols-2"
            : "pl-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 [contain:inline-size] md:mx-0 md:flex-wrap md:overflow-visible md:px-0",
        className,
      )}
    >
      {suggestions.map((s, i) => (
        <motion.li
          key={s.id ?? s.prompt}
          className={cn(!grid && !list && "shrink-0", list && "group/row")}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.soft, delay: reduced ? 0 : i * 0.06 }}
        >
          <button
            type="button"
            onClick={() => onSelect(s.prompt, s)}
            className={cn(
              "pl-focus-ring pl-touch group flex w-full cursor-pointer text-start transition-[background-color,box-shadow,scale] duration-(--pl-duration-fast) motion-safe:active:scale-[0.98]",
              list
                ? "min-h-11 items-center gap-3 ps-4 hover:bg-fill-3 active:bg-fill-2 motion-safe:active:scale-100"
                : grid
                  ? "h-full items-start gap-3 pl-field [--pl-field-border:var(--pl-separator)] rounded-xl bg-surface p-3.5 hover:bg-surface-2"
                  : "relative pl-hit items-center gap-2 rounded-full bg-fill-2 px-3.5 py-2 hover:bg-fill",
            )}
          >
            {s.icon && (
              <span
                className={cn(
                  "grid shrink-0 place-items-center text-fg-muted",
                  grid ? "size-8 rounded-full bg-fill-2 [&_svg]:size-[1.125rem]" : list ? "size-7 rounded-[0.4375rem] bg-accent text-on-accent [&_svg]:size-4" : "[&_svg]:size-4",
                )}
              >
                {s.icon}
              </span>
            )}
            <span
              className={cn(
                "flex min-w-0 flex-col",
                // iOS inset list: the hairline starts at the text, not at the icon, and is skipped on the first row.
                list && "flex-1 flex-row items-center gap-3 self-stretch py-2.5 pe-4 group-not-first/row:shadow-[inset_0_1px_0_var(--pl-separator)]",
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={cn("text-fg", list ? "text-body" : grid ? "text-subhead font-medium" : "text-subhead font-medium whitespace-nowrap")}>{s.title}</span>
                {(grid || list) && s.description && <span className="text-footnote text-fg-muted">{s.description}</span>}
              </span>
              {list && <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" strokeWidth={2.5} />}
            </span>
          </button>
        </motion.li>
      ))}
    </ul>
  );
}
