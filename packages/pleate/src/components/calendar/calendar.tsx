// Calendar: a month grid to pick a day or a range. Full keyboard support (arrows move by day/week, Page Up/Down by
// month, Shift+Page by year, Home/End to the week's edges, Enter/Space selects). Names and the first weekday come
// from the locale (Intl). min, max and isDisabled limit the choice; months slide when you navigate.
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "../../lib/cn.ts";
import { addDays, addMonths, between, compareDay, localeWeekStart, monthGrid, sameDay, sameMonth, startOfDay, startOfMonth } from "../../lib/date.ts";
import { ChevronRightIcon } from "../../lib/icons.tsx";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type DateRange = { from: Date | null; to: Date | null };

type BaseProps = {
  min?: Date;
  max?: Date;
  isDisabled?: (date: Date) => boolean;
  /** BCP 47 locale; defaults to the browser's. */
  locale?: string;
  /** 0 = Sunday … 6 = Saturday; defaults to the locale's. */
  weekStartsOn?: number;
  /** Month shown first (defaults to the selection or today). */
  defaultMonth?: Date;
  className?: string;
  previousLabel?: string;
  nextLabel?: string;
};

export type CalendarProps =
  | (BaseProps & { mode?: "single"; value?: Date | null; onValueChange?: (value: Date) => void })
  | (BaseProps & { mode: "range"; value?: DateRange; onValueChange?: (value: DateRange) => void });

export function Calendar(props: CalendarProps) {
  const { min, max, isDisabled, locale, className, previousLabel = "Previous month", nextLabel = "Next month" } = props;
  const reduced = useReducedMotion();
  const today = startOfDay(new Date());
  const single = props.mode !== "range" ? (props.value ?? null) : null;
  const range = props.mode === "range" ? (props.value ?? { from: null, to: null }) : null;
  const anchor = single ?? range?.from ?? props.defaultMonth ?? today;

  const [month, setMonth] = useState(() => startOfMonth(anchor));
  const [focused, setFocused] = useState(() => startOfDay(anchor));
  const [direction, setDirection] = useState(0);
  const [hover, setHover] = useState<Date | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const focusOnRender = useRef(false);

  const weekStartsOn = props.weekStartsOn ?? localeWeekStart(locale);
  const days = useMemo(() => monthGrid(month, weekStartsOn), [month, weekStartsOn]);
  const fmt = useMemo(
    () => ({
      title: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
      weekday: new Intl.DateTimeFormat(locale, { weekday: "narrow" }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: "long" }),
      full: new Intl.DateTimeFormat(locale, { dateStyle: "full" }),
    }),
    [locale],
  );

  const disabled = (d: Date) => (min && compareDay(d, min) < 0) || (max && compareDay(d, max) > 0) || Boolean(isDisabled?.(d));

  const goToMonth = (next: Date) => {
    setDirection(compareDay(next, month) > 0 ? 1 : -1);
    setMonth(startOfMonth(next));
  };

  const moveFocus = (next: Date) => {
    if (min && compareDay(next, min) < 0) next = startOfDay(min);
    if (max && compareDay(next, max) > 0) next = startOfDay(max);
    setFocused(next);
    if (!sameMonth(next, month)) goToMonth(next);
    focusOnRender.current = true;
  };

  useEffect(() => {
    if (!focusOnRender.current) return;
    focusOnRender.current = false;
    grid.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus();
  });

  const select = (d: Date) => {
    if (disabled(d)) return;
    setFocused(d);
    if (props.mode === "range") {
      const r = props.value ?? { from: null, to: null };
      if (!r.from || r.to || compareDay(d, r.from) < 0) props.onValueChange?.({ from: d, to: null });
      else props.onValueChange?.({ from: r.from, to: d });
    } else {
      props.onValueChange?.(d);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const k = event.key;
    const dow = (focused.getDay() - weekStartsOn + 7) % 7;
    const map: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
      Home: () => addDays(focused, -dow),
      End: () => addDays(focused, 6 - dow),
    };
    if (map[k]) {
      event.preventDefault();
      const next = map[k]();
      // Right-to-left layouts mirror the horizontal arrows.
      const rtl = grid.current && getComputedStyle(grid.current).direction === "rtl";
      moveFocus(rtl && (k === "ArrowLeft" || k === "ArrowRight") ? addDays(focused, k === "ArrowLeft" ? 1 : -1) : next);
    } else if (k === "Enter" || k === " ") {
      event.preventDefault();
      select(focused);
    }
  };

  const weekdays = days.slice(0, 7);
  const rangeEnd = range?.to ?? (range?.from && hover && compareDay(hover, range.from) > 0 ? hover : null);
  const canPrev = !min || compareDay(startOfMonth(month), startOfMonth(min)) > 0;
  const canNext = !max || compareDay(startOfMonth(month), startOfMonth(max)) < 0;
  const navButton =
    "pl-focus-ring grid size-9 cursor-pointer place-items-center rounded-full text-accent-ink transition-colors hover:bg-fill-2 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className={cn("w-full max-w-[20rem] select-none", className)}>
      <div className="mb-2 flex items-center justify-between ps-2">
        <h2 aria-live="polite" className="text-headline capitalize">{fmt.title.format(month)}</h2>
        <div className="flex">
          <button type="button" aria-label={previousLabel} disabled={!canPrev} onClick={() => goToMonth(addMonths(month, -1))} className={navButton}>
            <ChevronRightIcon className="size-5 rotate-180 rtl:rotate-0" strokeWidth={2.5} />
          </button>
          <button type="button" aria-label={nextLabel} disabled={!canNext} onClick={() => goToMonth(addMonths(month, 1))} className={navButton}>
            <ChevronRightIcon className="size-5 rtl:rotate-180" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <div role="grid" aria-label={fmt.title.format(month)} ref={grid} onKeyDown={onKeyDown} className="-m-1 overflow-hidden p-1">
        <div role="row" className="grid grid-cols-7">
          {weekdays.map((d) => (
            <span key={d.getDay()} role="columnheader" aria-label={fmt.weekdayLong.format(d)} className="py-1 text-center text-caption1 font-semibold text-fg-subtle uppercase">
              {fmt.weekday.format(d)}
            </span>
          ))}
        </div>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={month.toISOString()}
            custom={direction}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: direction * -40 }}
            transition={{ duration: reduced ? 0.1 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            onMouseLeave={() => setHover(null)}
          >
            {Array.from({ length: 6 }, (_, w) => (
              <div role="row" key={w} className="grid grid-cols-7">
                {days.slice(w * 7, w * 7 + 7).map((d) => {
                  const outside = !sameMonth(d, month);
                  const off = disabled(d);
                  const isFocused = sameDay(d, focused);
                  const start = range?.from && sameDay(d, range.from);
                  const end = rangeEnd && sameDay(d, rangeEnd);
                  const inRange = range?.from && rangeEnd && between(d, range.from, rangeEnd);
                  const selected = Boolean(single ? sameDay(d, single) : start || end);
                  return (
                    <div
                      role="gridcell"
                      key={d.toISOString()}
                      aria-selected={selected || Boolean(inRange) || undefined}
                      className={cn(
                        "relative flex h-10 items-center justify-center",
                        inRange && !outside && "bg-accent-soft",
                        inRange && start && "rounded-s-full",
                        inRange && end && "rounded-e-full",
                      )}
                    >
                      <button
                        type="button"
                        tabIndex={isFocused ? 0 : -1}
                        data-focused={isFocused}
                        aria-label={fmt.full.format(d)}
                        aria-current={sameDay(d, today) ? "date" : undefined}
                        aria-disabled={off || undefined}
                        onClick={() => select(d)}
                        onFocus={() => {
                          setFocused(d);
                          if (range) setHover(d);
                        }}
                        onMouseEnter={() => range && setHover(d)}
                        className={cn(
                          "pl-focus-ring pl-tabular grid size-10 cursor-pointer place-items-center rounded-full text-body transition-colors duration-(--pl-duration-instant)",
                          outside && "text-fg-subtle",
                          !selected && !off && "hover:bg-fill-2",
                          sameDay(d, today) && !selected && "font-semibold text-accent-ink",
                          selected && "bg-accent font-semibold text-on-accent",
                          off && "cursor-not-allowed text-fg-subtle line-through decoration-fg-subtle/60",
                          outside && !selected && "opacity-60",
                        )}
                      >
                        {d.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
