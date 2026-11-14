// DateRangePicker: a field showing "12 Jun · 15 Jun" that opens two months side by side (one on phones) with the
// range highlighted and a hover preview. Optional presets, min/max/isDisabled, controlled or uncontrolled { from, to },
// names and formats from the locale (Intl). Keyboard: arrows move by day/week, Page Up/Down by month, Home/End, Enter.
// `name` adds a hidden input with the ISO interval (yyyy-mm-dd/yyyy-mm-dd).
"use client";

import { Popover } from "radix-ui";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { addDays, addMonths, between, compareDay, localeWeekStart, monthGrid, sameDay, sameMonth, startOfDay, startOfMonth, toISODate } from "../../lib/date.ts";
import { fieldVariants, type FieldVariantProps } from "../../lib/field-variants.ts";
import { ChevronRightIcon, XIcon } from "../../lib/icons.tsx";
import { overlaySurface } from "../../lib/overlay-styles.ts";
import { useIsDesktop } from "../../lib/use-media-query.ts";
import { BottomSheet } from "../bottom-sheet/bottom-sheet.tsx";
import { Button } from "../button/button.tsx";
import type { DateRange } from "../calendar/calendar.tsx";

export type DateRangePreset = { label: ReactNode; value: () => DateRange };

export type DateRangePickerProps = FieldVariantProps & {
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (value: DateRange) => void;
  placeholder?: ReactNode;
  presets?: DateRangePreset[];
  min?: Date;
  max?: Date;
  isDisabled?: (date: Date) => boolean;
  locale?: string;
  /** 0 = Sunday … 6 = Saturday; defaults to the locale's. */
  weekStartsOn?: number;
  /** Form field name (hidden input with yyyy-mm-dd/yyyy-mm-dd). */
  name?: string;
  disabled?: boolean;
  clearable?: boolean;
  clearLabel?: string;
  /** Title of the phone sheet. */
  sheetTitle?: ReactNode;
  doneLabel?: ReactNode;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  onBlur?: () => void;
};

const EMPTY: DateRange = { from: null, to: null };

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function DateRangePicker(props: DateRangePickerProps) {
  const { variant, size, placeholder = "Select dates", presets, min, max, isDisabled, locale, name, disabled, clearable = true, clearLabel = "Clear dates", sheetTitle, doneLabel = "Done", className, onBlur } = props;
  const desktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<DateRange>(props.defaultValue ?? EMPTY);
  const value = props.value ?? internal;
  const [month, setMonth] = useState(() => startOfMonth(value.from ?? new Date()));
  const [focused, setFocused] = useState(() => startOfDay(value.from ?? new Date()));
  const [hover, setHover] = useState<Date | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const focusOnRender = useRef(false);
  const count = desktop ? 2 : 1;
  const weekStartsOn = props.weekStartsOn ?? localeWeekStart(locale);

  const set = (next: DateRange) => {
    if (props.value === undefined) setInternal(next);
    props.onValueChange?.(next);
  };

  const fmt = useMemo(
    () => ({
      title: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
      weekday: new Intl.DateTimeFormat(locale, { weekday: "narrow" }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: "long" }),
      full: new Intl.DateTimeFormat(locale, { dateStyle: "full" }),
    }),
    [locale],
  );
  // "12 Jun · 15 Jun"; the year shows only when it isn't the current one.
  const label = useMemo(() => {
    if (!value.from) return null;
    const thisYear = new Date().getFullYear();
    const one = (d: Date) =>
      new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", ...(d.getFullYear() !== thisYear ? { year: "numeric" } : {}) }).format(d);
    return value.to ? `${one(value.from)} · ${one(value.to)}` : `${one(value.from)} · …`;
  }, [value.from, value.to, locale]);

  const off = (d: Date) => (min && compareDay(d, min) < 0) || (max && compareDay(d, max) > 0) || Boolean(isDisabled?.(d));

  const goToMonth = (next: Date) => {
    setMonth(startOfMonth(next));
  };
  const moveFocus = (next: Date) => {
    if (min && compareDay(next, min) < 0) next = startOfDay(min);
    if (max && compareDay(next, max) > 0) next = startOfDay(max);
    setFocused(next);
    const last = addMonths(month, count - 1);
    if (compareDay(next, month) < 0 || (!sameMonth(next, last) && compareDay(next, last) > 0)) {
      goToMonth(compareDay(next, month) < 0 ? next : addMonths(next, 1 - count));
    }
    focusOnRender.current = true;
  };
  useEffect(() => {
    if (!focusOnRender.current) return;
    focusOnRender.current = false;
    panel.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus();
  });

  const select = (d: Date) => {
    if (off(d)) return;
    setFocused(d);
    if (!value.from || value.to || compareDay(d, value.from) < 0) set({ from: d, to: null });
    else {
      set({ from: value.from, to: d });
      setOpen(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const k = event.key;
    const dow = (focused.getDay() - weekStartsOn + 7) % 7;
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const map: Record<string, Date> = {
      ArrowLeft: addDays(focused, rtl ? 1 : -1),
      ArrowRight: addDays(focused, rtl ? -1 : 1),
      ArrowUp: addDays(focused, -7),
      ArrowDown: addDays(focused, 7),
      PageUp: addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: addMonths(focused, event.shiftKey ? 12 : 1),
      Home: addDays(focused, -dow),
      End: addDays(focused, 6 - dow),
    };
    if (map[k]) {
      event.preventDefault();
      moveFocus(map[k]);
    }
  };

  const openChanged = (next: boolean) => {
    if (next) {
      const anchor = startOfDay(value.from ?? new Date());
      setMonth(startOfMonth(anchor));
      setFocused(anchor);
      setHover(null);
    }
    setOpen(next);
  };

  const rangeEnd = value.to ?? (value.from && hover && compareDay(hover, value.from) > 0 ? hover : null);
  const canPrev = !min || compareDay(month, startOfMonth(min)) > 0;
  const canNext = !max || compareDay(addMonths(month, count - 1), startOfMonth(max)) < 0;
  const navButton =
    "pl-focus-ring grid size-8 cursor-pointer place-items-center rounded-full bg-fill-2 text-fg-muted transition-colors hover:bg-fill hover:text-fg disabled:pointer-events-none disabled:opacity-30";
  const today = startOfDay(new Date());
  const hasValue = Boolean(value.from);
  const iso = value.from && value.to ? `${toISODate(value.from)}/${toISODate(value.to)}` : "";

  const months = Array.from({ length: count }, (_, i) => addMonths(month, i));

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
            onClick={desktop ? undefined : () => openChanged(true)}
            onBlur={onBlur}
            className={cn(
              fieldVariants({ variant, size }),
              "pl-touch cursor-pointer text-start focus-visible:outline-ring aria-invalid:shadow-[inset_0_0_0_1.5px_var(--pl-danger-ink)] disabled:cursor-not-allowed disabled:opacity-50",
              clearable && hasValue && "pe-10",
            )}
          >
            <span className="flex shrink-0 text-fg-muted">
              <CalendarIcon />
            </span>
            <span className={cn("pl-tabular min-w-0 flex-1 truncate", !label && "text-fg-subtle")}>{label ?? placeholder}</span>
          </button>
  );

  const body = (
    <>
            {presets?.length ? (
              <div className="flex gap-1.5 overflow-x-auto md:w-36 md:flex-col md:overflow-visible md:border-e md:border-separator-raised md:pe-2">
                {presets.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      set(preset.value());
                      setOpen(false);
                    }}
                    className="pl-focus-ring shrink-0 cursor-pointer rounded-md bg-fill-2 px-3 py-1.5 text-start text-footnote font-medium text-fg transition-colors hover:bg-fill md:bg-transparent md:text-subhead md:hover:bg-fill-2"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div ref={panel} onKeyDown={onKeyDown} className="mx-auto select-none md:mx-0">
              <div className="relative mb-1">
                <div className="flex gap-6">
                  {months.map((m, i) => (
                    <h2 key={i} aria-live="polite" className="w-[17.5rem] ps-2 text-headline capitalize">
                      {fmt.title.format(m)}
                    </h2>
                  ))}
                </div>
              <div className="absolute end-0 top-0 flex gap-1.5">
                <button type="button" aria-label="Previous month" disabled={!canPrev} onClick={() => goToMonth(addMonths(month, -1))} className={navButton}>
                  <ChevronRightIcon className="size-4 rotate-180 rtl:rotate-0" strokeWidth={2.5} />
                </button>
                <button type="button" aria-label="Next month" disabled={!canNext} onClick={() => goToMonth(addMonths(month, 1))} className={navButton}>
                  <ChevronRightIcon className="size-4 rtl:rotate-180" strokeWidth={2.5} />
                </button>
              </div>
              </div>
              <div className="flex gap-6" onMouseLeave={() => setHover(null)}>
                {months.map((m) => {
                  const days = monthGrid(m, weekStartsOn);
                  const rows = Math.ceil((days.findLastIndex((d) => sameMonth(d, m)) + 1) / 7);
                  return (
                    <div key={m.getTime()} role="grid" aria-label={fmt.title.format(m)} className="w-[17.5rem]">
                      <div role="row" className="grid grid-cols-7">
                        {days.slice(0, 7).map((d) => (
                          <span key={d.getDay()} role="columnheader" aria-label={fmt.weekdayLong.format(d)} className="py-1 text-center text-caption1 font-medium text-fg-subtle">
                            {fmt.weekday.format(d)}
                          </span>
                        ))}
                      </div>
                      {Array.from({ length: rows }, (_, w) => (
                        <div role="row" key={w} className="grid grid-cols-7">
                          {days.slice(w * 7, w * 7 + 7).map((d, col) => {
                            if (!sameMonth(d, m)) return <div role="gridcell" key={d.getTime()} aria-hidden="true" />;
                            const disabledDay = off(d);
                            const start = sameDay(d, value.from);
                            const end = rangeEnd ? sameDay(d, rangeEnd) : false;
                            const inRange = Boolean(value.from && rangeEnd && between(d, value.from, rangeEnd));
                            const preview = !value.to && inRange;
                            const selected = start || (end && Boolean(value.to));
                            const isFocused = sameDay(d, focused);
                            return (
                              <div
                                role="gridcell"
                                key={d.getTime()}
                                aria-selected={selected || inRange || undefined}
                                className={cn(
                                  "relative flex h-10 items-center justify-center",
                                  inRange && "bg-accent-soft",
                                  inRange && (start || d.getDate() === 1 || col === 0) && "rounded-s-full",
                                  inRange && (end || sameDay(d, new Date(m.getFullYear(), m.getMonth() + 1, 0)) || col === 6) && "rounded-e-full",
                                  inRange && value.from && sameDay(value.from, rangeEnd) && "rounded-full",
                                )}
                              >
                                <button
                                  type="button"
                                  tabIndex={isFocused ? 0 : -1}
                                  data-focused={isFocused}
                                  aria-label={fmt.full.format(d)}
                                  aria-current={sameDay(d, today) ? "date" : undefined}
                                  aria-disabled={disabledDay || undefined}
                                  onClick={() => select(d)}
                                  onFocus={() => {
                                    setFocused(d);
                                    setHover(d);
                                  }}
                                  onMouseEnter={() => setHover(d)}
                                  className={cn(
                                    "pl-focus-ring pl-tabular grid size-10 cursor-pointer place-items-center rounded-md text-body transition-colors duration-(--pl-duration-instant)",
                                    !selected && !disabledDay && "hover:bg-fill-2",
                                    sameDay(d, today) && !selected && "font-medium text-accent-ink",
                                    selected && "bg-accent font-medium text-on-accent",
                                    preview && end && !selected && "bg-accent-soft text-accent-ink",
                                    disabledDay && "cursor-not-allowed text-fg-subtle line-through decoration-fg-subtle/60",
                                  )}
                                >
                                  {d.getDate()}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
    </>
  );

  return (
    <div className={cn("relative w-full", className)}>
      {name && <input type="hidden" name={name} value={iso} />}
      {desktop ? (
        <Popover.Root open={open} onOpenChange={openChanged}>
          <Popover.Trigger asChild>{trigger}</Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={8}
              collisionPadding={8}
              // Keyboard users land on the selected (or today's) day, ready for the arrow keys.
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                panel.current?.querySelector<HTMLElement>('[data-focused="true"]')?.focus();
              }}
              className={cn(
                "pl-pop relative z-(--pl-z-dropdown) flex max-w-[calc(100vw-1rem)] gap-3 rounded-2xl p-3 outline-none [--radix-popper-transform-origin:var(--radix-popover-content-transform-origin)]",
                overlaySurface,
              )}
            >
              {body}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      ) : (
        <>
          {trigger}
          <BottomSheet
            open={open}
            onOpenChange={openChanged}
            title={sheetTitle ?? placeholder}
            snapPoints={[presets?.length ? 0.68 : 0.6]}
            footer={
              <Button fullWidth size="lg" onClick={() => setOpen(false)}>
                {doneLabel}
              </Button>
            }
          >
            <div className="flex flex-col gap-4">{body}</div>
          </BottomSheet>
        </>
      )}
      {clearable && hasValue && !disabled && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => set(EMPTY)}
          className="pl-focus-ring pl-hit absolute end-2.5 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-xs bg-fill text-fg-muted hover:text-fg [&_svg]:size-3"
        >
          <XIcon strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
