// NumberField: a number in a field between − and + buttons (guests, nights, amounts). Arrow keys step, Page keys take
// ten steps, Home and End jump to the bounds; typing is parsed on blur. When the buttons change it, the number rolls.
"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { fieldControl, fieldVariants } from "../../lib/field-variants.ts";
import { MinusIcon, PlusIcon } from "../../lib/icons.tsx";
import { useControllableState } from "../../lib/use-controllable-state.ts";
import { Odometer } from "../../effects/motion-graphics/motion-graphics.tsx";

export type NumberFieldProps = {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** How the number is shown (currency, unit, percent…). */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  size?: "sm" | "md" | "lg";
  variant?: "outline" | "filled" | "surface";
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  decrementLabel?: string;
  incrementLabel?: string;
  className?: string;
};

const BUTTON = { sm: "w-8", md: "w-9", lg: "w-11" } as const;

export function NumberField({
  value,
  defaultValue = 0,
  onValueChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  format,
  locale,
  size = "md",
  variant,
  disabled,
  invalid,
  decrementLabel = "Decrease",
  incrementLabel = "Increase",
  className,
  ...props
}: NumberFieldProps) {
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const [draft, setDraft] = useState<string | null>(null); // non-null while the input has focus
  const fmt = useMemo(() => new Intl.NumberFormat(locale, format), [locale, format]);
  const decimal = useMemo(() => fmt.formatToParts(1.1).find((p) => p.type === "decimal")?.value ?? ".", [fmt]);
  const places = (String(step).split(".")[1] ?? "").length;

  const clamp = (n: number) => Math.min(max, Math.max(min, Number(n.toFixed(places))));
  const commit = (n: number) => {
    const next = clamp(n);
    setCurrent(next);
    if (draft !== null) setDraft(fmt.format(next));
  };
  const parse = (text: string) => {
    const clean = text.replace(new RegExp(`[^0-9\\-${decimal === "." ? "\\." : decimal}]`, "g"), "").replace(decimal, ".");
    const n = parseFloat(clean);
    return Number.isNaN(n) ? current : format?.style === "percent" ? n / 100 : n;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const base = draft !== null ? parse(draft) : current;
    const moves: Record<string, number | undefined> = {
      ArrowUp: base + step,
      ArrowDown: base - step,
      PageUp: base + step * 10,
      PageDown: base - step * 10,
      Home: Number.isFinite(min) ? min : undefined,
      End: Number.isFinite(max) ? max : undefined,
    };
    const next = moves[e.key];
    if (next === undefined) {
      if (e.key === "Enter") commit(base);
      return;
    }
    e.preventDefault();
    commit(next);
  };

  const atMin = current <= min;
  const atMax = current >= max;
  const stepButton = (dir: -1 | 1) => {
    const off = disabled || (dir < 0 ? atMin : atMax);
    return (
      <button
        type="button"
        tabIndex={-1}
        aria-label={dir < 0 ? decrementLabel : incrementLabel}
        aria-disabled={off || undefined}
        aria-controls={props.id}
        onClick={() => !off && commit(current + dir * step)}
        className={cn(
          "pl-touch flex shrink-0 cursor-pointer items-center justify-center self-stretch text-fg-muted transition-colors duration-(--pl-duration-fast)",
          "hover:bg-fill-3 hover:text-fg aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent",
          dir < 0 ? "rounded-s-[inherit] shadow-[inset_-1px_0_var(--pl-separator)]" : "rounded-e-[inherit] shadow-[inset_1px_0_var(--pl-separator)]",
          BUTTON[size],
        )}
      >
        {dir < 0 ? <MinusIcon /> : <PlusIcon />}
      </button>
    );
  };

  return (
    <div className={cn(fieldVariants({ variant, size }), "gap-0 px-0", className)} data-slot="field">
      {stepButton(-1)}
      <span className="relative flex flex-1 self-stretch">
        <input
          {...props}
          type="text"
          inputMode={places > 0 || format?.style === "currency" ? "decimal" : "numeric"}
          role="spinbutton"
          autoComplete="off"
          aria-valuenow={current}
          aria-valuemin={Number.isFinite(min) ? min : undefined}
          aria-valuemax={Number.isFinite(max) ? max : undefined}
          aria-valuetext={fmt.format(current)}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={draft ?? fmt.format(current)}
          onFocus={() => setDraft(fmt.format(current))}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft !== null) setCurrent(clamp(parse(draft)));
            setDraft(null);
          }}
          onKeyDown={onKeyDown}
          className={cn(fieldControl, "pl-tabular px-2 text-center", draft === null && "text-transparent")}
        />
        {draft === null && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Odometer value={current} format={format} locale={locale} duration={0.35} />
          </span>
        )}
      </span>
      {stepButton(1)}
    </div>
  );
}
