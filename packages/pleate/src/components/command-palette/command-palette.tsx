// CommandPalette: a search-first dialog opened with ⌘K / Ctrl+K (Radix Dialog: focus trap, Escape, scroll lock). Type to
// filter grouped commands, arrows move the active row, Enter runs it and closes. The input is a combobox that points
// at the active option (aria-activedescendant), so focus never leaves the field.
"use client";

import { Dialog } from "radix-ui";
import { useEffect, useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { menuItem, menuLabel } from "../../lib/menu-styles.ts";
import { useControllableState } from "../../lib/use-controllable-state.ts";
import { overlayBackdrop } from "../../lib/overlay-styles.ts";
import { Kbd, isApplePlatform, parseKeys } from "../kbd/kbd.tsx";

export type CommandItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Shown as keycaps, e.g. "mod+n". Display only: bind the shortcut yourself. */
  shortcut?: string;
  /** Extra words that should match the item. */
  keywords?: string[];
  onSelect: () => void;
};

export type CommandGroup = { heading: string; items: CommandItem[] };

export type CommandPaletteProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Global shortcut that toggles the palette; false to disable. */
  shortcut?: string | false;
  groups: CommandGroup[];
  placeholder?: string;
  emptyLabel?: ReactNode;
  /** Accessible name of the dialog. */
  label?: string;
  className?: string;
};

/** True when a keyboard event is exactly the combination ("mod+k", "shift+?"). */
export function matchesShortcut(event: { key: string; metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }, combo: string) {
  const parts = parseKeys(combo.toLowerCase());
  const key = parts.pop();
  const mods = new Set(parts.map((p) => (p === "mod" ? (isApplePlatform() ? "meta" : "ctrl") : p === "option" ? "alt" : p)));
  return (
    event.key.toLowerCase() === key &&
    event.metaKey === mods.has("meta") &&
    event.ctrlKey === mods.has("ctrl") &&
    event.altKey === mods.has("alt") &&
    // Symbols like "?" need shift on most layouts, so a stray shift only fails letters and digits.
    (mods.has("shift") ? event.shiftKey : !event.shiftKey || !/^[a-z0-9]$/.test(key ?? ""))
  );
}

export function CommandPalette({
  open,
  defaultOpen = false,
  onOpenChange,
  shortcut = "mod+k",
  groups,
  placeholder = "Search",
  emptyLabel = "No results",
  label = "Command palette",
  className,
}: CommandPaletteProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange });

  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.repeat || !matchesShortcut(e, shortcut)) return;
      e.preventDefault();
      setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut, setOpen]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlayBackdrop} />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            "pl-dialog fixed inset-x-4 top-[12dvh] z-(--pl-z-modal) mx-auto flex max-h-[min(30rem,76dvh)] max-w-xl flex-col overflow-hidden rounded-xl bg-elevated text-fg shadow-xl outline-none",
            className,
          )}
        >
          <Dialog.Title className="sr-only">{label}</Dialog.Title>
          {/* Lives inside Content so the query resets every time the palette opens. */}
          <PaletteBody groups={groups} placeholder={placeholder} emptyLabel={emptyLabel} close={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PaletteBody({ groups, placeholder, emptyLabel, close }: Pick<CommandPaletteProps, "groups" | "placeholder" | "emptyLabel"> & { close: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const optionId = (item: CommandItem) => `${listId}-o-${item.id}`;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => !q || [i.label, ...(i.keywords ?? [])].join(" ").toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);
  const flat = filtered.flatMap((g) => g.items);
  const current = flat[Math.min(active, flat.length - 1)];

  useEffect(() => {
    if (current) document.getElementById(`${listId}-o-${current.id}`)?.scrollIntoView({ block: "nearest" });
  }, [current, listId]);

  const run = (item: CommandItem) => {
    close();
    item.onSelect();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!flat.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = flat.indexOf(current!) + (e.key === "ArrowDown" ? 1 : -1);
      setActive((next + flat.length) % flat.length);
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      run(current!);
    }
  };

  return (
    <>
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-separator px-4">
        <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-fg-subtle" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5L20 20" />
        </svg>
        <input
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={current ? optionId(current) : undefined}
          aria-label={placeholder}
          autoComplete="off"
          spellCheck={false}
          autoFocus
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-[1rem] text-fg outline-none placeholder:text-fg-subtle md:text-callout"
        />
      </div>

      <div id={listId} role="listbox" aria-label={placeholder} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
        {flat.length === 0 ? (
          <p role="status" className="px-3 py-8 text-center text-subhead text-fg-muted">
            {emptyLabel}
          </p>
        ) : (
          filtered.map((group, g) => (
            <div key={group.heading} role="group" aria-labelledby={`${listId}-g${g}`} className="not-first:mt-1">
              <div id={`${listId}-g${g}`} className={menuLabel}>
                {group.heading}
              </div>
              {group.items.map((item) => {
                const isActive = item === current;
                return (
                  <div
                    key={item.id}
                    id={optionId(item)}
                    role="option"
                    aria-selected={isActive}
                    data-highlighted={isActive ? "" : undefined}
                    onPointerMove={() => !isActive && setActive(flat.indexOf(item))}
                    onPointerDown={(e) => e.preventDefault() /* keep focus in the field */}
                    onClick={() => run(item)}
                    className={cn(menuItem, "min-h-9")}
                  >
                    {item.icon}
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.shortcut && <Kbd keys={item.shortcut} className="ms-auto ps-4" />}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div aria-hidden="true" className="flex shrink-0 items-center gap-4 border-t border-separator bg-surface-2 px-4 py-2 text-caption1 text-fg-subtle max-md:hidden">
        <span className="flex items-center gap-1.5">
          <Kbd keys={["up", "down"]} /> Move
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd keys="enter" /> Open
        </span>
        <span className="ms-auto flex items-center gap-1.5">
          <Kbd keys="esc" /> Close
        </span>
      </div>
    </>
  );
}
