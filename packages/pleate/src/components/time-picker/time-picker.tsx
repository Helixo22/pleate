// TimePicker: a field for a time of day. Type it ("930", "9:30 pm", "21.30") or pick from a list of times every
// `minuteStep` minutes. 12 or 24 hour display follows the locale unless `hour12` is set; the value is always
// "HH:mm" (24h). min and max limit the list and clamp typed times. Arrow Down opens the list; in the list, arrows,
// Home/End and Enter. `name` adds a hidden input with the value for forms.
"use client";

import { Popover } from "radix-ui";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { fieldControl, fieldVariants, type FieldVariantProps } from "../../lib/field-variants.ts";
import { overlaySurface } from "../../lib/overlay-styles.ts";
import { useIsDesktop } from "../../lib/use-media-query.ts";
import { BottomSheet } from "../bottom-sheet/bottom-sheet.tsx";

export type TimePickerProps = FieldVariantProps & {
  /** "HH:mm", 24 hour. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  /** Minutes between the times of the list (default 15). Typed times are not rounded. */
  minuteStep?: number;
  min?: string;
  max?: string;
  locale?: string;
  /** Force 12 or 24 hour display; defaults to the locale's. */
  hour12?: boolean;
  name?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  openLabel?: string;
  onBlur?: () => void;
  /** Shown above the list, e.g. "Pick-up time". */
  listLabel?: ReactNode;
};

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toValue = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

/** "930", "9:30", "9.30 pm", "21:30" to minutes since midnight; null when it isn't a time. */
function parse(text: string, hour12: boolean): number | null {
  const match = /^(\d{1,2})(?:[:.\s]?(\d{2}))?\s*([ap])?\.?m?\.?$/i.exec(text.trim());
  if (!match) return null;
  let h = Number(match[1]);
  const m = Number(match[2] ?? 0);
  const mer = match[3]?.toLowerCase();
  if (m > 59) return null;
  if (mer) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (mer === "p" ? 12 : 0);
  } else if (h > 23 || (hour12 && h === 24)) return null;
  return h * 60 + m;
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function TimePicker(props: TimePickerProps) {
  const { variant, size, placeholder, minuteStep = 15, min = "00:00", max = "23:59", locale, name, disabled, className, openLabel = "Choose a time", onBlur, listLabel } = props;
  const [internal, setInternal] = useState<string | null>(props.defaultValue ?? null);
  const value = props.value !== undefined ? props.value : internal;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const desktop = useIsDesktop();
  const [hydrated, setHydrated] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  useEffect(() => setHydrated(true), []);
  // On phones the list sits in a sheet: bring the chosen time into view once it mounts.
  useEffect(() => {
    if (open && !desktop) requestAnimationFrame(() => list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "center" }));
  }, [open, desktop]);

  const hour12 = props.hour12 ?? (hydrated ? (new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hour12 ?? false) : false);
  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, { hour: hour12 ? "numeric" : "2-digit", minute: "2-digit", hour12 }), [locale, hour12]);
  const format = (v: string) => fmt.format(new Date(2000, 0, 1, 0, toMinutes(v)));

  const options = useMemo(() => {
    const lo = toMinutes(min);
    const hi = toMinutes(max);
    const out: string[] = [];
    for (let t = Math.ceil(lo / minuteStep) * minuteStep; t <= hi; t += minuteStep) out.push(toValue(t));
    return out;
  }, [min, max, minuteStep]);

  const set = (next: string | null) => {
    if (props.value === undefined) setInternal(next);
    props.onValueChange?.(next);
    setDraft(null);
  };
  const clamp = (m: number) => Math.min(Math.max(m, toMinutes(min)), toMinutes(max));
  const commit = () => {
    if (draft === null) return;
    if (draft.trim() === "") return set(null);
    const m = parse(draft, hour12);
    if (m === null) return setDraft(null); // not a time: fall back to the last good value
    set(toValue(clamp(m)));
  };

  const text = draft ?? (value ? format(value) : "");
  const focusOption = (target: string | undefined) => list.current?.querySelector<HTMLElement>(`[data-time="${target}"]`)?.focus();

  const onInputKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") commit();
    else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      commit();
      setOpen(true);
    }
  };

  const onListKeyDown = (event: KeyboardEvent) => {
    const items = Array.from(list.current?.querySelectorAll<HTMLElement>("[data-time]") ?? []);
    const at = items.indexOf(document.activeElement as HTMLElement);
    const to = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: items.length - 1, PageDown: at + 4, PageUp: at - 4 }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    items[Math.min(Math.max(to, 0), items.length - 1)]?.focus();
  };

  const listBody = (
    <>
            {listLabel && <p className="hidden px-2.5 pt-2 pb-1.5 text-caption1 font-medium text-fg-subtle md:block">{listLabel}</p>}
            <div ref={list} id={listId} role="listbox" aria-label={openLabel} onKeyDown={onListKeyDown} className="md:max-h-60 md:overflow-y-auto overscroll-contain">
              {options.map((o) => (
                <button
                  key={o}
                  type="button"
                  role="option"
                  data-time={o}
                  aria-selected={o === value}
                  tabIndex={-1}
                  onClick={() => {
                    set(o);
                    setOpen(false);
                  }}
                  className={cn(
                    "pl-focus-ring pl-tabular pl-touch flex min-h-9 w-full cursor-pointer items-center rounded-md px-2.5 text-start text-subhead transition-colors duration-(--pl-duration-instant) pointer-coarse:min-h-11 hover:bg-fill-2 focus-visible:bg-fill-2",
                    o === value && "bg-accent font-medium text-on-accent hover:bg-accent focus-visible:bg-accent",
                  )}
                >
                  {format(o)}
                </button>
              ))}
              {options.length === 0 && <p className="px-2.5 py-2 text-subhead text-fg-subtle">No times available</p>}
            </div>
    </>
  );

  return (
    <div className={cn("w-full", className)}>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Anchor asChild>
          <div className={cn(fieldVariants({ variant, size }), "pe-1")}>
            <span className="flex shrink-0 text-fg-muted">
              <ClockIcon />
            </span>
            <input
              ref={input}
              id={props.id}
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              disabled={disabled}
              value={text}
              placeholder={placeholder ?? (hour12 ? "9:30 AM" : "09:30")}
              aria-label={props["aria-label"]}
              aria-describedby={props["aria-describedby"]}
              aria-invalid={props["aria-invalid"]}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={open ? listId : undefined}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => {
                commit();
                onBlur?.();
              }}
              onKeyDown={onInputKeyDown}
              className={cn(fieldControl, "pl-tabular")}
            />
            {desktop ? <Popover.Trigger asChild>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={desktop ? undefined : () => setOpen(true)}
                disabled={disabled}
                aria-label={openLabel}
                className="pl-focus-ring pl-hit relative grid size-7 shrink-0 cursor-pointer place-items-center rounded-sm text-fg-muted transition-colors hover:bg-fill hover:text-fg disabled:pointer-events-none"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3.5!">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </Popover.Trigger> :
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={desktop ? undefined : () => setOpen(true)}
                disabled={disabled}
                aria-label={openLabel}
                className="pl-focus-ring pl-hit relative grid size-7 shrink-0 cursor-pointer place-items-center rounded-sm text-fg-muted transition-colors hover:bg-fill hover:text-fg disabled:pointer-events-none"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3.5!">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            }
          </div>
        </Popover.Anchor>
        {desktop && <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={8}
            collisionPadding={8}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              const target = value && options.includes(value) ? value : options.find((o) => !value || o >= value) ?? options[0];
              const el = list.current?.querySelector<HTMLElement>(`[data-time="${target}"]`);
              el?.focus();
              el?.scrollIntoView({ block: "center" });
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              input.current?.focus();
            }}
            className={cn(
              "pl-pop z-(--pl-z-dropdown) w-(--radix-popover-trigger-width) min-w-36 max-w-[calc(100vw-1rem)] rounded-xl p-1 outline-none [--radix-popper-transform-origin:var(--radix-popover-content-transform-origin)]",
              overlaySurface,
            )}
          >
            {listBody}
          </Popover.Content>
        </Popover.Portal>}
      </Popover.Root>
      {!desktop && (
        <BottomSheet open={open} onOpenChange={setOpen} title={listLabel ?? openLabel} snapPoints={[0.6]}>
          {listBody}
        </BottomSheet>
      )}
    </div>
  );
}
