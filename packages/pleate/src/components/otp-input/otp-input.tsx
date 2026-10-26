// OTPInput: a one-time code typed into separate boxes. Typing advances, Backspace goes back, arrows move, and pasting
// (or the phone's SMS autofill, autocomplete="one-time-code") fills every box at once. onComplete fires with the
// code when the last box is filled. With `name` the code is part of the form (a hidden input); inside FormField the
// id lands on the first box and validation runs when focus leaves the whole group.
"use client";

import { useEffect, useRef, type ChangeEvent, type ClipboardEvent, type FocusEvent, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { useControllableState } from "../../lib/use-controllable-state.ts";

export type OTPInputProps = {
  /** Number of characters. */
  length?: number;
  /** "numeric" accepts digits and shows the number pad; "alphanumeric" letters and digits (uppercased). */
  mode?: "numeric" | "alphanumeric";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called with the full code once every box is filled. */
  onComplete?: (code: string) => void;
  /** Put a small gap after every N boxes (e.g. 3 for "123 456"). */
  groupSize?: number;
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Form field name; the joined code is submitted with the form. */
  name?: string;
  /** Id of the first box (so a <label for> focuses it). */
  id?: string;
  labels?: { group?: string; box?: (index: number, length: number) => string };
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-required"?: boolean | "true" | "false";
  "aria-label"?: string;
  /** Called when focus leaves the whole group (FormField validation). */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  /** Called after each edit with the box's change event (FormField validation). */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

const SIZE = {
  sm: "h-10 text-title3 rounded-lg",
  md: "h-12 text-title2 rounded-xl",
  lg: "h-14 text-title1 rounded-xl",
} as const;
const TRACK = { sm: "minmax(0,2.5rem)", md: "minmax(0,3rem)", lg: "minmax(0,3.5rem)" } as const;

export function OTPInput({
  length = 6,
  mode = "numeric",
  value,
  defaultValue = "",
  onValueChange,
  onComplete,
  groupSize,
  size = "md",
  invalid,
  disabled,
  autoFocus,
  name,
  id,
  labels,
  className,
  onBlur,
  onChange,
  ...aria
}: OTPInputProps) {
  const [code, setCode] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const hidden = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const boxLabel = labels?.box ?? ((i: number, n: number) => `Character ${i + 1} of ${n}`);
  const isInvalid = invalid || aria["aria-invalid"] === true || aria["aria-invalid"] === "true";
  const chars = Array.from({ length }, (_, i) => (code[i] && code[i] !== " " ? code[i] : ""));
  const columns = chars.map((_, i) => (groupSize && i > 0 && i % groupSize === 0 ? `0.25rem ${TRACK[size]}` : TRACK[size])).join(" ");

  const clean = (text: string) => {
    return mode === "numeric" ? text.replace(/\D/g, "") : text.replace(/[^a-z0-9]/gi, "").toUpperCase();
  };
  const focusBox = (i: number) => {
    const box = boxes.current[Math.max(0, Math.min(length - 1, i))];
    box?.focus();
    box?.select();
  };

  const commit = (next: string[], event?: ChangeEvent<HTMLInputElement>) => {
    // Trailing empty boxes are dropped; gaps in the middle keep their place with a space.
    const joined = next.map((c) => c || " ").join("").trimEnd();
    if (hidden.current) hidden.current.value = joined.replaceAll(" ", "");
    setCode(joined);
    if (event) onChange?.(event);
    if (next.every(Boolean) && joined.length === length) onComplete?.(joined);
  };

  const fill = (from: number, text: string, event?: ChangeEvent<HTMLInputElement>) => {
    const incoming = clean(text);
    if (!incoming) return;
    // A whole code always starts at the first box, wherever it was pasted.
    const start = incoming.length >= length ? 0 : from;
    const next = [...chars];
    for (let i = 0; i < incoming.length && start + i < length; i++) next[start + i] = incoming[i];
    commit(next, event);
    focusBox(Math.min(length - 1, start + incoming.length));
  };

  const onBoxChange = (i: number, event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const current = chars[i];
    if (raw === "") {
      const next = [...chars];
      next[i] = "";
      commit(next, event);
      return;
    }
    // Typing over a filled box: keep the new character only.
    const typed = current && raw.length === 2 ? raw.replace(current, "") || raw.slice(-1) : raw;
    if (clean(typed).length > 1) return fill(i, typed, event);
    const ch = clean(typed);
    if (!ch) {
      event.target.value = current;
      return;
    }
    const next = [...chars];
    next[i] = ch;
    commit(next, event);
    if (i < length - 1) focusBox(i + 1);
  };

  const onKeyDown = (i: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !chars[i] && i > 0) {
      event.preventDefault();
      const next = [...chars];
      next[i - 1] = "";
      commit(next);
      focusBox(i - 1);
    } else if (event.key === "Delete") {
      event.preventDefault();
      const next = [...chars];
      next[i] = "";
      commit(next);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(i - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(i + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusBox(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusBox(length - 1);
    }
  };

  const onPaste = (i: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    fill(i, event.clipboardData.getData("text"));
  };

  useEffect(() => {
    if (autoFocus) focusBox(0);
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={root}
      role="group"
      aria-label={aria["aria-label"] ?? labels?.group ?? "Verification code"}
      className={cn("inline-grid w-fit max-w-full gap-2", disabled && "opacity-50", className)}
      style={{ gridTemplateColumns: columns }}
      onBlur={(event) => {
        if (!root.current?.contains(event.relatedTarget as Node)) onBlur?.(event as FocusEvent<HTMLInputElement>);
      }}
    >
      {name && <input ref={hidden} type="hidden" name={name} value={code.replaceAll(" ", "")} readOnly />}
      {chars.map((ch, i) => (
        <input
          key={i}
          ref={(node) => {
            boxes.current[i] = node;
          }}
          id={i === 0 ? id : undefined}
          style={groupSize && i > 0 && i % groupSize === 0 ? { gridColumnStart: i + 1 + Math.floor(i / groupSize) } : undefined}
          value={ch}
          disabled={disabled}
          inputMode={mode === "numeric" ? "numeric" : "text"}
          pattern={mode === "numeric" ? "[0-9]*" : undefined}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoCapitalize={mode === "alphanumeric" ? "characters" : "off"}
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint={i === length - 1 ? "done" : "next"}
          aria-label={boxLabel(i, length)}
          aria-invalid={isInvalid || undefined}
          aria-describedby={aria["aria-describedby"]}
          aria-required={aria["aria-required"]}
          onChange={(event) => onBoxChange(i, event)}
          onKeyDown={(event) => onKeyDown(i, event)}
          onPaste={(event) => onPaste(i, event)}
          onFocus={(event) => event.target.select()}
          className={cn(
            "w-full min-w-0 bg-fill-2 text-center font-semibold text-fg caret-accent outline-2 outline-offset-2 outline-transparent pl-tabular",
            "transition-[background-color,box-shadow,outline-color] duration-(--pl-duration-fast) ease-ios",
            "focus:bg-surface focus:shadow-[inset_0_0_0_1.5px_var(--pl-accent)] focus:outline-ring/40 disabled:cursor-not-allowed",
            ch && "bg-surface shadow-[inset_0_0_0_1px_var(--pl-border)]",
            isInvalid && "shadow-[inset_0_0_0_1.5px_var(--pl-danger-ink)] focus:shadow-[inset_0_0_0_1.5px_var(--pl-danger-ink)]",
            SIZE[size],
          )}
        />
      ))}
    </div>
  );
}
