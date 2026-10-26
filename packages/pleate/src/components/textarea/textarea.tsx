// Textarea: grows with its content between minRows and maxRows (CSS field-sizing where supported, a small script
// elsewhere) and can show a character counter against maxLength.
"use client";

import { useCallback, useEffect, useRef, useState, type Ref, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";
import { fieldControl, fieldVariants, type FieldVariantProps } from "../../lib/field-variants.ts";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  FieldVariantProps & {
    ref?: Ref<HTMLTextAreaElement>;
    /** Grow with the content (default true). */
    autoResize?: boolean;
    minRows?: number;
    maxRows?: number;
    /** Shows "used / maxLength" under the text. */
    showCount?: boolean;
    textareaClassName?: string;
    invalid?: boolean;
  };

const supportsFieldSizing = () => typeof CSS !== "undefined" && CSS.supports("field-sizing", "content");

export function Textarea({
  ref,
  className,
  textareaClassName,
  variant,
  size,
  autoResize = true,
  minRows = 3,
  maxRows = 12,
  showCount = false,
  invalid,
  onChange,
  style,
  ...props
}: TextareaProps) {
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const [count, setCount] = useState(() => String(props.value ?? props.defaultValue ?? "").length);

  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      inner.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const fit = useCallback(() => {
    const node = inner.current;
    if (!node || !autoResize || supportsFieldSizing()) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [autoResize]);

  useEffect(() => {
    fit();
    if (props.value !== undefined) setCount(String(props.value).length);
  }, [fit, props.value]);

  return (
    <div className={cn(fieldVariants({ variant, size }), "flex-col items-stretch py-2.5", className)} data-slot="field">
      <textarea
        ref={setRefs}
        aria-invalid={invalid || props["aria-invalid"] || undefined}
        className={cn(fieldControl, "w-full resize-none leading-[inherit]", autoResize && "field-sizing-content", textareaClassName)}
        style={{
          minHeight: `${minRows}lh`,
          maxHeight: autoResize ? `${maxRows}lh` : undefined,
          ...style,
        }}
        rows={autoResize ? undefined : minRows}
        onChange={(event) => {
          setCount(event.target.value.length);
          fit();
          onChange?.(event);
        }}
        {...props}
      />
      {showCount && (
        <span
          className={cn(
            "pl-tabular mt-1 self-end text-caption1 text-fg-subtle",
            props.maxLength && count >= props.maxLength && "text-danger-ink",
          )}
          aria-live="polite"
        >
          {props.maxLength ? `${count} / ${props.maxLength}` : count}
        </span>
      )}
    </div>
  );
}
