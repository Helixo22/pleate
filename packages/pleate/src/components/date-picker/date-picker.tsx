// DatePicker: a field that opens a Calendar — in a popover on desktop, in a bottom sheet on phones. Single date or
// range (mode="range"), optional presets ("This weekend"), clearable. For forms, `name` adds a hidden input with
// the ISO date (yyyy-mm-dd) or the ISO interval (yyyy-mm-dd/yyyy-mm-dd), so FormField rules work on it.
"use client";

import { Popover } from "radix-ui";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { toISODate } from "../../lib/date.ts";
import { fieldVariants, type FieldVariantProps } from "../../lib/field-variants.ts";
import { XIcon } from "../../lib/icons.tsx";
import { useIsDesktop } from "../../lib/use-media-query.ts";
import { BottomSheet } from "../bottom-sheet/bottom-sheet.tsx";
import { Button } from "../button/button.tsx";
import { Calendar, type DateRange } from "../calendar/calendar.tsx";

export type DatePreset<V> = { label: ReactNode; value: () => V };

type Common = FieldVariantProps & {
  placeholder?: ReactNode;
  min?: Date;
  max?: Date;
  isDisabled?: (date: Date) => boolean;
  locale?: string;
  weekStartsOn?: number;
  /** Form field name (hidden input with the ISO value). */
  name?: string;
  disabled?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  /** Title of the phone sheet. */
  sheetTitle?: ReactNode;
  doneLabel?: ReactNode;
  formatOptions?: Intl.DateTimeFormatOptions;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  onBlur?: () => void;
};

export type DatePickerProps =
  | (Common & { mode?: "single"; value?: Date | null; defaultValue?: Date | null; onValueChange?: (value: Date | null) => void; presets?: DatePreset<Date>[] })
  | (Common & { mode: "range"; value?: DateRange; defaultValue?: DateRange; onValueChange?: (value: DateRange) => void; presets?: DatePreset<DateRange>[] });

const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function DatePicker(props: DatePickerProps) {
  const {
    variant,
    size,
    placeholder = props.mode === "range" ? "Select dates" : "Select a date",
    min,
    max,
    isDisabled,
    locale,
    weekStartsOn,
    name,
    disabled,
    clearable = true,
    clearLabel = "Clear date",
    sheetTitle,
    doneLabel = "Done",
    formatOptions = DEFAULT_FORMAT,
    className,
    onBlur,
  } = props;
  const range = props.mode === "range";
  const desktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<Date | null | DateRange>(props.defaultValue ?? (range ? { from: null, to: null } : null));
  const value = props.value !== undefined ? props.value : internal;

  const set = (next: Date | null | DateRange) => {
    if (props.value === undefined) setInternal(next);
    (props.onValueChange as ((v: typeof next) => void) | undefined)?.(next);
  };

  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, formatOptions), [locale, formatOptions]);
  const r = range ? (value as DateRange) : null;
  const d = range ? null : (value as Date | null);
  const label = range
    ? r?.from
      ? r.to
        ? fmt.formatRange(r.from, r.to)
        : `${fmt.format(r.from)} – …`
      : null
    : d
      ? fmt.format(d)
      : null;
  const iso = range ? (r?.from && r.to ? `${toISODate(r.from)}/${toISODate(r.to)}` : "") : d ? toISODate(d) : "";
  const hasValue = range ? Boolean(r?.from) : Boolean(d);

  const onPick = (next: Date | DateRange) => {
    set(next);
    // Close once the choice is complete (a day, or both ends of a range).
    if (!range || (next as DateRange).to) setOpen(false);
  };

  const calendar = (
    <Calendar
      {...(range
        ? { mode: "range" as const, value: r ?? undefined, onValueChange: onPick }
        : { mode: "single" as const, value: d, onValueChange: onPick })}
      min={min}
      max={max}
      isDisabled={isDisabled}
      locale={locale}
      weekStartsOn={weekStartsOn}
      className="mx-auto"
    />
  );

  const presets = props.presets?.length ? (
    <div className="flex flex-wrap gap-1.5 md:w-36 md:flex-col md:flex-nowrap">
      {(props.presets as DatePreset<Date | DateRange>[]).map((preset, i) => (
        <button
          key={i}
          type="button"
          onClick={() => {
            set(preset.value());
            setOpen(false);
          }}
          className="pl-focus-ring cursor-pointer rounded-full bg-fill-2 px-3 py-1.5 text-start text-footnote font-medium text-fg transition-colors hover:bg-fill md:rounded-md md:bg-transparent md:text-subhead md:hover:bg-fill-2"
        >
          {preset.label}
        </button>
      ))}
    </div>
  ) : null;

  const trigger = (
    <button
      type="button"
      id={props.id}
      disabled={disabled}
      aria-label={props["aria-label"]}
      aria-describedby={props["aria-describedby"]}
      aria-invalid={props["aria-invalid"]}
      aria-haspopup="dialog"
      aria-expanded={open}
      onBlur={onBlur}
      onClick={desktop ? undefined : () => setOpen(true)}
      className={cn(
        fieldVariants({ variant, size }),
        "pl-touch cursor-pointer text-start focus-visible:outline-ring aria-invalid:shadow-[inset_0_0_0_1.5px_var(--pl-danger-ink)] disabled:cursor-not-allowed disabled:opacity-50",
        clearable && hasValue && "pe-10",
      )}
    >
      <span className="flex shrink-0 text-fg-muted">
        <CalendarIcon />
      </span>
      <span className={cn("min-w-0 flex-1 truncate", !label && "text-fg-subtle")}>{label ?? placeholder}</span>
    </button>
  );

  return (
    <div className={cn("relative w-full", className)}>
      {name && <input type="hidden" name={name} value={iso} />}
      {desktop ? (
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>{trigger}</Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={8}
              // Keyboard users land on the selected (or today's) day, ready for the arrow keys.
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                (event.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>('[data-focused="true"]')?.focus();
              }}
              collisionPadding={8}
              className="pl-pop z-(--pl-z-dropdown) flex gap-3 rounded-2xl bg-elevated p-3 text-fg shadow-xl outline-none [--radix-popper-transform-origin:var(--radix-popover-content-transform-origin)]"
            >
              {presets && <div className="border-e border-separator pe-2">{presets}</div>}
              {calendar}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      ) : (
        <>
          {trigger}
          <BottomSheet
            open={open}
            onOpenChange={setOpen}
            title={sheetTitle ?? placeholder}
            snapPoints={[presets ? 0.68 : 0.6]}
            footer={
              range ? (
                <Button fullWidth size="lg" onClick={() => setOpen(false)}>
                  {doneLabel}
                </Button>
              ) : undefined
            }
          >
            <div className="flex flex-col gap-4">
              {presets}
              {calendar}
            </div>
          </BottomSheet>
        </>
      )}
      {clearable && hasValue && !disabled && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => set(range ? { from: null, to: null } : null)}
          className="pl-focus-ring absolute end-2.5 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-fill text-fg-muted hover:text-fg [&_svg]:size-3"
        >
          <XIcon strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
