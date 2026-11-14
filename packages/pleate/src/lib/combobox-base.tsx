// Shared engine of Combobox and MultiSelect: a text field that filters a listbox in a popover (ARIA 1.2 combobox
// with a listbox popup: focus stays in the input and aria-activedescendant names the highlighted row). The field
// uses the Input look so it lines up next to Input and Select; the panel uses the minimal popup style.
"use client";

import { Popover } from "radix-ui";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn.ts";
import { fieldControl, fieldVariants, type FieldVariantProps } from "./field-variants.ts";
import { CheckIcon, ChevronDownIcon, XIcon } from "./icons.tsx";
import { menuItem, menuLabel } from "./menu-styles.ts";
import { overlaySurface } from "./overlay-styles.ts";
import { useControllableState } from "./use-controllable-state.ts";
import { Spinner } from "../components/spinner/spinner.tsx";
import { Tag } from "../components/tag/tag.tsx";

export type ComboboxOption = {
  value: string;
  label: string;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  /** Options with the same group are listed under one heading, in order of first appearance. */
  group?: string;
};

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Default filter: case and accent insensitive "contains" on the label. */
export function defaultFilter(option: ComboboxOption, query: string) {
  return fold(option.label).includes(fold(query.trim()));
}

/** Applies the filter (empty query keeps everything) and clusters the result by group. */
export function filterOptions(
  options: ComboboxOption[],
  query: string,
  filter: ((option: ComboboxOption, query: string) => boolean) | false = defaultFilter,
) {
  const hits = filter && query.trim() ? options.filter((o) => filter(o, query)) : options;
  if (!hits.some((o) => o.group)) return hits;
  const order = [...new Set(hits.map((o) => o.group ?? ""))];
  return order.flatMap((g) => hits.filter((o) => (o.group ?? "") === g));
}

export type ComboboxBaseProps = FieldVariantProps & {
  options: ComboboxOption[];
  placeholder?: string;
  /** Custom matcher, or `false` to show every option (server-side filtering). */
  filter?: ((option: ComboboxOption, query: string) => boolean) | false;
  /** Fires as the user types; use it to fetch options. */
  onInputChange?: (query: string) => void;
  loading?: boolean;
  emptyText?: ReactNode;
  clearable?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  /** Called when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
};

type Multi = { multiple: true; value?: string[]; defaultValue?: string[]; onValueChange?: (v: string[]) => void; max?: number; selectAll?: string };
type Single = { multiple?: false; value?: string | null; defaultValue?: string | null; onValueChange?: (v: string | null) => void };

const ALL = "\0all";

export function ComboboxBase(props: ComboboxBaseProps & (Multi | Single)) {
  const {
    options, placeholder, filter, onInputChange, loading, emptyText = "No results", clearable, invalid, disabled, name, id,
    variant, size, className, onOpenChange,
  } = props;
  const multiple = props.multiple === true;
  const max = multiple ? (props as Multi).max : undefined;
  const selectAllLabel = multiple ? (props as Multi).selectAll : undefined;

  const [value, setValue] = useControllableState<string | string[] | null>({
    value: props.value as string | string[] | null | undefined,
    defaultValue: (props.defaultValue as string | string[] | null | undefined) ?? (multiple ? [] : null),
    onChange: props.onValueChange as (v: string | string[] | null) => void,
  });
  const selected = multiple ? ((value as string[]) ?? []) : value ? [value as string] : [];
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  const single = !multiple ? byValue.get(value as string) : undefined;

  const [open, setOpenState] = useState(false);
  const [query, setQuery] = useState<string | null>(null); // null: not typing, the field shows the chosen label
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const listId = `${uid}-list`;
  const setOpen = (next: boolean) => {
    if (next === open) return;
    setOpenState(next);
    if (!next) setQuery(null);
    onOpenChange?.(next);
  };

  const shown = useMemo(() => filterOptions(options, query ?? "", filter), [options, query, filter]);
  const atMax = max !== undefined && selected.length >= max;
  const canSelectAll = Boolean(selectAllLabel) && max === undefined && !(query ?? "").trim() && shown.length > 0;
  const rows: { key: string; option?: ComboboxOption }[] = [
    ...(canSelectAll ? [{ key: ALL }] : []),
    ...shown.map((option) => ({ key: option.value, option })),
  ];
  const isDisabled = (row: (typeof rows)[number]) =>
    row.option ? Boolean(row.option.disabled) || (atMax && !selected.includes(row.option.value)) : false;
  const rowId = (i: number) => `${uid}-opt-${i}`;

  const firstEnabled = (from: number, dir: 1 | -1) => {
    for (let i = from; i >= 0 && i < rows.length; i += dir) if (!isDisabled(rows[i])) return i;
    return -1;
  };
  const move = (dir: 1 | -1) => {
    const n = rows.length;
    if (!n) return;
    for (let step = 1; step <= n; step++) {
      const i = (((active + dir * step) % n) + n) % n;
      if (!isDisabled(rows[i])) return setActive(i);
    }
  };

  // Keep the highlight valid: on open land on the chosen row, after filtering on the first match.
  useEffect(() => {
    if (!open) return;
    const chosen = rows.findIndex((r) => r.option && selected.includes(r.option.value) && !multiple);
    setActive(Math.max(firstEnabled(chosen >= 0 ? chosen : 0, 1), 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, options]);
  useEffect(() => {
    if (open) document.getElementById(rowId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open]);

  const choose = (row: (typeof rows)[number]) => {
    if (isDisabled(row)) return;
    if (!multiple) {
      setValue(row.option!.value);
      setQuery(null);
      setOpen(false);
      return;
    }
    if (row.key === ALL) {
      const ids = shown.filter((o) => !o.disabled).map((o) => o.value);
      const all = ids.every((v) => selected.includes(v));
      setValue(all ? selected.filter((v) => !ids.includes(v)) : [...new Set([...selected, ...ids])]);
      return;
    }
    const v = row.option!.value;
    setValue(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
    if (query) {
      setQuery(null);
      onInputChange?.("");
    }
  };
  const remove = (v: string) => setValue(selected.filter((s) => s !== v));
  const clear = () => {
    setValue(multiple ? [] : null);
    setQuery(null);
    onInputChange?.("");
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        if (!open) setOpen(true);
        else move(e.key === "ArrowDown" ? 1 : -1);
        break;
      case "Home":
      case "End":
        if (!open) break;
        e.preventDefault();
        setActive(Math.max(e.key === "Home" ? firstEnabled(0, 1) : firstEnabled(rows.length - 1, -1), 0));
        break;
      case "Enter":
        if (open && rows[active]) {
          e.preventDefault();
          choose(rows[active]);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        } else if (clearable && hasValue) {
          e.preventDefault();
          clear();
        }
        break;
      case "Backspace":
        if (multiple && !(e.currentTarget.value) && selected.length) remove(selected[selected.length - 1]);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const text = query ?? (multiple ? "" : (single?.label ?? ""));
  const hasValue = selected.length > 0;
  const rowCount = rows.length;
  const fieldClass = cn(
    fieldVariants({ variant, size }),
    "cursor-text",
    multiple && "h-auto items-start gap-1 py-1 ps-1.5",
    className,
  );
  const tagSize = size === "lg" ? "md" : "sm";

  const input = (
    <input
      ref={inputRef}
      id={id}
      role="combobox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-activedescendant={open && rows[active] ? rowId(active) : undefined}
      aria-autocomplete="list"
      aria-haspopup="listbox"
      aria-invalid={invalid || undefined}
      aria-label={props["aria-label"]}
      aria-labelledby={props["aria-labelledby"]}
      autoComplete="off"
      disabled={disabled}
      placeholder={multiple && hasValue ? undefined : placeholder}
      value={text}
      onChange={(e) => {
        setQuery(e.target.value);
        onInputChange?.(e.target.value);
        setOpen(true);
      }}
      onFocus={(e) => !multiple && e.currentTarget.select()}
      onClick={() => !disabled && setOpen(true)}
      onKeyDown={onKeyDown}
      className={cn(fieldControl, multiple && cn("h-6 self-auto ps-1", hasValue && !text ? "min-w-6 basis-6" : "min-w-16 basis-16"))}
    />
  );

  return (
    <Popover.Root open={open && !disabled} onOpenChange={(o) => !o && setOpen(false)}>
      <Popover.Anchor asChild>
        <div
          ref={fieldRef}
          data-slot="field"
          className={fieldClass}
          onMouseDown={(e) => {
            // Clicks on the padding or a chip focus the input; real buttons keep their own behaviour.
            if (disabled || e.target === inputRef.current || (e.target as HTMLElement).closest("button")) return;
            e.preventDefault();
            inputRef.current?.focus();
            setOpen(true);
          }}
        >
          <div className={cn("flex min-w-0 flex-1 items-center", multiple && "flex-wrap gap-1")}>
          {multiple &&
            selected.map((v) => (
              <Tag
                key={v}
                size={tagSize}
                variant="surface"
                disabled={disabled}
                icon={byValue.get(v)?.icon}
                removeLabel={`Remove ${byValue.get(v)?.label ?? v}`}
                onRemove={() => {
                  remove(v);
                  inputRef.current?.focus();
                }}
                className="max-w-[calc(100%-0.5rem)]"
              >
                {byValue.get(v)?.label ?? v}
              </Tag>
            ))}
          {!multiple && single?.icon && query === null && <span className="me-2 flex shrink-0 items-center text-fg-muted">{single.icon}</span>}
          {input}
          </div>
          <span className={cn("flex shrink-0 items-center gap-1 text-fg-muted", multiple && "h-6")}>
            {loading && <Spinner size="xs" label={null} />}
            {clearable && hasValue && !disabled && (
              <button
                type="button"
                aria-label="Clear"
                onClick={clear}
                className="pl-focus-ring pl-hit relative grid size-5 cursor-pointer place-items-center rounded-full bg-fill text-fg-muted transition-colors hover:text-fg [&_svg]:size-3"
              >
                <XIcon strokeWidth={2.75} />
              </button>
            )}
            <button
              type="button"
              tabIndex={-1}
              aria-label={open ? "Close options" : "Show options"}
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                inputRef.current?.focus();
                setOpen(!open);
              }}
              className="grid size-5 cursor-pointer place-items-center rounded-full disabled:cursor-not-allowed"
            >
              <ChevronDownIcon className={cn("transition-transform duration-(--pl-duration-fast)", open && "rotate-180")} />
            </button>
          </span>
          {name &&
            (selected.length ? selected : [""]).map((v) => <input key={v} type="hidden" name={name} value={v} />)}
        </div>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (fieldRef.current?.contains(e.target as Node)) e.preventDefault();
          }}
          onMouseDown={(e) => e.preventDefault()} // keep focus in the input while clicking rows
          className={cn(
            "pl-pop z-(--pl-z-dropdown) w-(--radix-popover-trigger-width) min-w-48 max-w-[calc(100vw-1rem)] rounded-xl p-1 outline-none",
            overlaySurface,
          )}
        >
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-multiselectable={multiple || undefined}
            aria-label={props["aria-label"]}
            aria-labelledby={props["aria-labelledby"]}
            className="max-h-[min(18rem,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain"
          >
            {rows.map((row, i) => {
              const o = row.option;
              const isAll = row.key === ALL;
              const prevGroup = i > 0 ? rows[i - 1].option?.group : undefined;
              const heading = o?.group && o.group !== prevGroup ? o.group : null;
              const on = isAll ? shown.filter((x) => !x.disabled).every((x) => selected.includes(x.value)) : selected.includes(o!.value);
              return (
                <div key={row.key} role="presentation">
                  {heading && <div role="presentation" className={cn(menuLabel, i > 0 && "mt-1")}>{heading}</div>}
                  <div
                    id={rowId(i)}
                    role="option"
                    aria-selected={on}
                    aria-disabled={isDisabled(row) || undefined}
                    data-active={i === active || undefined}
                    onMouseMove={() => !isDisabled(row) && i !== active && setActive(i)}
                    onClick={() => {
                      choose(row);
                      if (multiple) inputRef.current?.focus();
                    }}
                    className={cn(menuItem, "data-[active]:bg-fill-2", isDisabled(row) && "pointer-events-none opacity-40", isAll && "font-medium")}
                  >
                    {o?.icon}
                    <span className="flex min-w-0 flex-1 flex-col py-1">
                      <span className="truncate">{isAll ? selectAllLabel : o!.label}</span>
                      {o?.description && <span className="truncate text-footnote text-fg-muted">{o.description}</span>}
                    </span>
                    {on && <CheckIcon className="size-4! text-accent-ink" strokeWidth={2.75} />}
                  </div>
                </div>
              );
            })}
            {rowCount === 0 && (
              <div role="presentation" className="flex items-center gap-2 px-2.5 py-3 text-subhead text-fg-muted">
                {loading ? <><Spinner size="xs" label={null} />Loading</> : emptyText}
              </div>
            )}
          </div>
          {multiple && max !== undefined && (
            <div aria-live="polite" className="border-t border-separator-raised px-2.5 pt-1.5 pb-1 text-footnote text-fg-muted">
              {selected.length} of {max} selected
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
