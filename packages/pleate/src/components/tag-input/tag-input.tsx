// TagInput: type a value and press Enter or comma to turn it into a Tag; Backspace in the empty field removes the
// last one; pasting "a, b, c" adds three. Duplicates (case-insensitive) are ignored, `max` caps the count and
// `validate` can reject a value with a message. Controlled (value + onValueChange) or uncontrolled (defaultValue).
// With `name`, the tags are submitted as one comma-separated value.
"use client";

import { useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { fieldControl, fieldVariants, type FieldVariantProps } from "../../lib/field-variants.ts";
import { Tag } from "../tag/tag.tsx";

export type TagInputProps = Omit<FieldVariantProps, "size"> & {
  size?: "sm" | "md" | "lg";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Return true to accept, or false / a message to reject (the message shows under the field). */
  validate?: (tag: string, current: string[]) => boolean | string;
  max?: number;
  placeholder?: string;
  /** Add the typed text when the field loses focus. Defaults to true. */
  addOnBlur?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
};

const tagSize = { xs: "sm", sm: "sm", md: "md", lg: "md", xl: "md" } as const;

export function TagInput({
  value,
  defaultValue = [],
  onValueChange,
  validate,
  max,
  placeholder,
  addOnBlur = true,
  disabled,
  invalid,
  name,
  variant,
  size,
  className,
  id,
  ...aria
}: TagInputProps) {
  const [inner, setInner] = useState(defaultValue);
  const tags = value ?? inner;
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string>();
  const input = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const full = max !== undefined && tags.length >= max;

  const set = (next: string[]) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  /** Adds each value in turn; returns false when one was rejected, so the draft stays for editing. */
  const add = (raw: string[]) => {
    let next = tags;
    let message: string | undefined;
    for (const v of raw.map((t) => t.trim()).filter(Boolean)) {
      if (max !== undefined && next.length >= max) {
        message = `Up to ${max} allowed`;
        break;
      }
      if (next.some((t) => t.toLowerCase() === v.toLowerCase())) continue;
      const verdict = validate?.(v, next) ?? true;
      if (verdict !== true) {
        message = typeof verdict === "string" ? verdict : `"${v}" is not valid`;
        continue;
      }
      next = [...next, v];
    }
    if (next !== tags) set(next);
    setError(message);
    return !message;
  };

  const commit = () => {
    if (!draft.trim()) return setDraft("");
    if (add([draft])) setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && tags.length) {
      set(tags.slice(0, -1));
      setError(undefined);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!/[,\n]/.test(text)) return;
    e.preventDefault();
    add((draft + text).split(/[,\n]/));
    setDraft("");
  };

  return (
    <div className="grid w-full gap-1.5">
      <div
        data-slot="field"
        onClick={() => input.current?.focus()}
        aria-invalid={invalid || !!error || undefined}
        className={cn(fieldVariants({ variant, size }), "h-auto cursor-text flex-wrap gap-1.5 py-1", className)}
      >
        {tags.map((tag) => (
          <Tag
            key={tag}
            variant="accent"
            size={tagSize[size ?? "md"]}
            disabled={disabled}
            removeLabel={`Remove ${tag}`}
            onRemove={() => {
              set(tags.filter((t) => t !== tag));
              setError(undefined);
              input.current?.focus();
            }}
          >
            {tag}
          </Tag>
        ))}
        <input
          ref={input}
          id={id}
          value={draft}
          disabled={disabled || full}
          placeholder={tags.length ? undefined : placeholder}
          aria-invalid={invalid || !!error || undefined}
          aria-describedby={error ? errorId : undefined}
          enterKeyHint="enter"
          onChange={(e) => {
            setDraft(e.target.value);
            setError(undefined);
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => addOnBlur && commit()}
          className={cn(fieldControl, "min-w-24 py-1")}
          {...aria}
        />
        {name && <input type="hidden" name={name} value={tags.join(",")} />}
      </div>
      <p id={errorId} role="status" className={cn("px-1 text-footnote text-danger-ink", !error && "sr-only")}>
        {error}
      </p>
    </div>
  );
}
