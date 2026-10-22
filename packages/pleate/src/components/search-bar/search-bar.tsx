// SearchBar: the iOS search field, filled capsule with a magnifier, a clear button once there is text, and an
// optional "Cancel" that slides in while focused (phones). Enter submits (onSearch); onValueChange can be debounced.
// A keyboard shortcut (e.g. "/" or "mod+k") focuses it from anywhere.
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type InputHTMLAttributes, type Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";
import { spring } from "../../motion/tokens.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Spinner } from "../spinner/spinner.tsx";

export type SearchBarProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "size"> & {
  ref?: Ref<HTMLInputElement>;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Delay in ms before onValueChange fires while typing (0 = immediate). */
  debounce?: number;
  onSearch?: (value: string) => void;
  /** Show a Cancel button while focused, which clears and blurs (iOS). */
  cancelable?: boolean;
  cancelLabel?: string;
  clearLabel?: string;
  loading?: boolean;
  /** Focus shortcut: "/" or "mod+k" (⌘ on Apple, Ctrl elsewhere). Shown as a hint while empty. */
  shortcut?: "/" | "mod+k";
  size?: "sm" | "md";
  variant?: "filled" | "surface";
  /** Accessible name of the search landmark. */
  label?: string;
  className?: string;
};

export function SearchBar({
  ref,
  value,
  defaultValue = "",
  onValueChange,
  debounce = 0,
  onSearch,
  cancelable = false,
  cancelLabel = "Cancel",
  clearLabel = "Clear search",
  loading = false,
  shortcut,
  size = "md",
  variant = "filled",
  label = "Search",
  placeholder = "Search",
  className,
  onFocus,
  onBlur,
  ...props
}: SearchBarProps) {
  const inner = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState(value ?? defaultValue);
  const [focused, setFocused] = useState(false);
  const reduced = useReducedMotion();
  const timer = useRef<number>(undefined);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (value !== undefined) setText(value);
  }, [value]);
  useEffect(() => setIsMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      const hit = shortcut === "/" ? event.key === "/" && !typing : event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      if (hit) {
        event.preventDefault();
        inner.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const emit = (next: string) => {
    window.clearTimeout(timer.current);
    if (debounce > 0) timer.current = window.setTimeout(() => onValueChange?.(next), debounce);
    else onValueChange?.(next);
  };
  const change = (next: string) => {
    setText(next);
    emit(next);
  };

  const setRefs = (node: HTMLInputElement | null) => {
    inner.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  const height = size === "sm" ? "h-8 text-callout md:text-subhead" : "h-10 text-body";
  return (
    // A search landmark, not a <form>: it can live inside your own form without nesting forms.
    <div role="search" aria-label={label} className={cn("flex w-full min-w-0 items-center gap-2", className)}>
      <div
        className={cn(
          "pl-focus-within-ring relative flex min-w-0 flex-1 items-center gap-1.5 rounded-[0.625rem] ps-2.5 pe-1.5 text-fg",
          variant === "filled" ? "bg-fill-2" : "bg-surface shadow-xs",
          height,
        )}
      >
        <svg viewBox="0 0 24 24" className="size-[1.0625rem] shrink-0 text-fg-muted" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5L20 20" />
        </svg>
        <input
          ref={setRefs}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          onChange={(event) => change(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && text) {
              event.preventDefault();
              change("");
            } else if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              window.clearTimeout(timer.current);
              onValueChange?.(text);
              onSearch?.(text);
            }
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          className="w-0 min-w-0 flex-1 self-stretch bg-transparent outline-none placeholder:text-fg-muted [&::-webkit-search-cancel-button]:appearance-none"
          {...props}
        />
        {loading && <Spinner size="sm" label={null} className="text-fg-muted" />}
        {text && !loading && (
          <button
            type="button"
            aria-label={clearLabel}
            onClick={() => {
              change("");
              inner.current?.focus();
            }}
            className="pl-focus-ring grid size-5 shrink-0 cursor-pointer place-items-center rounded-full bg-fg-subtle/70 text-surface hover:bg-fg-subtle [&_svg]:size-3"
          >
            <XIcon strokeWidth={3.2} />
          </button>
        )}
        {shortcut && !text && !focused && (
          <kbd className="hidden shrink-0 rounded-md bg-surface px-1.5 py-0.5 font-sans text-caption1 font-medium text-fg-muted shadow-xs md:inline">
            {shortcut === "/" ? "/" : isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        )}
      </div>
      <AnimatePresence initial={false}>
        {cancelable && focused && (
          <motion.button
            type="button"
            // Keep focus on the input until the press completes, so blur doesn't hide the button first.
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => {
              change("");
              inner.current?.blur();
            }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, width: 0 }}
            transition={reduced ? { duration: 0.1 } : spring.snap}
            className="pl-focus-ring shrink-0 cursor-pointer overflow-hidden rounded-md text-body whitespace-nowrap text-accent-ink"
          >
            {cancelLabel}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
