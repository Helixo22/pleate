// PromptSuggestions: starter prompts for an empty chat. Cards with an icon, a title and a hint ("grid"), or compact
// chips that scroll sideways on phones ("chips"). They appear one after another; choosing one calls onSelect.
"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { spring } from "../../motion/tokens.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type PromptSuggestion = { id?: string; title: ReactNode; description?: ReactNode; icon?: ReactNode; prompt: string };

export type PromptSuggestionsProps = {
  suggestions: PromptSuggestion[];
  onSelect: (prompt: string, suggestion: PromptSuggestion) => void;
  variant?: "grid" | "chips";
  label?: string;
  className?: string;
};

export function PromptSuggestions({ suggestions, onSelect, variant = "grid", label = "Suggestions", className }: PromptSuggestionsProps) {
  const reduced = useReducedMotion();
  const grid = variant === "grid";
  return (
    <ul
      aria-label={label}
      className={cn(
        grid ? "grid gap-2.5 sm:grid-cols-2" : "pl-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 [contain:inline-size] md:mx-0 md:flex-wrap md:overflow-visible md:px-0",
        className,
      )}
    >
      {suggestions.map((s, i) => (
        <motion.li
          key={s.id ?? s.prompt}
          className={cn(!grid && "shrink-0")}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.soft, delay: reduced ? 0 : i * 0.06 }}
        >
          <button
            type="button"
            onClick={() => onSelect(s.prompt, s)}
            className={cn(
              "pl-focus-ring pl-touch group flex w-full cursor-pointer text-start transition-[background-color,box-shadow,scale] duration-(--pl-duration-fast) motion-safe:active:scale-[0.98]",
              grid
                ? "h-full items-start gap-3 rounded-2xl bg-surface p-3.5 shadow-xs hover:shadow-md"
                : "items-center gap-2 rounded-full bg-fill-2 px-3.5 py-2 hover:bg-fill",
            )}
          >
            {s.icon && (
              <span
                className={cn(
                  "grid shrink-0 place-items-center text-accent-ink",
                  grid ? "size-8 rounded-lg bg-accent-soft [&_svg]:size-[1.125rem]" : "[&_svg]:size-4",
                )}
              >
                {s.icon}
              </span>
            )}
            <span className="flex min-w-0 flex-col">
              <span className={cn("text-fg", grid ? "text-subhead font-semibold" : "text-subhead font-medium whitespace-nowrap")}>{s.title}</span>
              {grid && s.description && <span className="text-footnote text-fg-muted">{s.description}</span>}
            </span>
          </button>
        </motion.li>
      ))}
    </ul>
  );
}
