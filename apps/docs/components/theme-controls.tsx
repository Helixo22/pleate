// Docs header controls: light / system / dark switch and the palette picker (presets + any custom color).
"use client";

import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { cn, IconButton, SegmentedControl } from "pleate";
import { createPalette, CUSTOM_PALETTE, PALETTES, useTheme, type ThemePreference } from "pleate/theme";
import { useEffect, useRef, useState } from "react";

const MODES: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "system", label: "Auto", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

/** Auto / Light / Dark. Icons only by default; `labels` spells them out (the sidebar footer). */
export function ThemeSwitch({ labels = false }: { labels?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <SegmentedControl<ThemePreference>
      aria-label="Color scheme"
      size="sm"
      fullWidth={labels}
      value={theme}
      onValueChange={setTheme}
      options={MODES.map(({ value, label, Icon }) => ({
        value,
        icon: <Icon />,
        label: labels ? label : null,
        "aria-label": labels ? undefined : label,
      }))}
    />
  );
}

export function PaletteSwatches({ className }: { className?: string }) {
  const { palette, setPalette, customColor, setCustomColor } = useTheme();
  const [draft, setDraft] = useState(customColor ?? "#ff2d55");
  useEffect(() => {
    if (customColor) setDraft(customColor);
  }, [customColor]);
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div role="radiogroup" aria-label="Palette" className="grid grid-cols-5 gap-2.5">
        {Object.entries(PALETTES).map(([name, { label, seed }]) => {
          const active = palette === name;
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={label}
              title={label}
              onClick={() => setPalette(name)}
              className="pl-focus-ring pl-touch grid size-9 cursor-pointer place-items-center rounded-full transition-[scale] duration-150 motion-safe:active:scale-90"
              style={{ background: seed }}
            >
              {active && <Check className="size-4" style={{ color: createPalette(seed).light.onAccent }} strokeWidth={3} />}
            </button>
          );
        })}
      </div>
      <label className="pl-field flex items-center gap-3 rounded-md bg-surface-2 p-2 pe-3 [--pl-field-border:var(--pl-separator)]">
        <span
          className={cn(
            "relative size-9 shrink-0 overflow-hidden rounded-full",
            palette === CUSTOM_PALETTE && "ring-2 ring-ring ring-offset-2 ring-offset-surface",
          )}
          style={{ background: draft }}
        >
          <input
            type="color"
            value={draft}
            aria-label="Custom palette color"
            onChange={(event) => {
              setDraft(event.target.value);
              setCustomColor(event.target.value);
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-subhead font-medium">Custom</span>
          <span className="font-mono text-caption1 text-fg-muted">{draft}</span>
        </span>
      </label>
    </div>
  );
}

/** `up` opens the swatches above the button (when it sits at the bottom of the screen). */
export function PalettePicker({ up = false }: { up?: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={root} className="relative">
      <IconButton
        aria-label="Palette"
        aria-expanded={open}
        size="sm"
        variant="surface"
        tone="neutral"
        onClick={() => setOpen((v) => !v)}
        icon={<Palette />}
      />
      {open && (
        <div
          data-state="open"
          className={cn("pl-pop absolute z-(--pl-z-dropdown) w-64 rounded-lg bg-elevated p-3 shadow-lg", up ? "start-0 bottom-full mb-2 [--radix-popper-transform-origin:bottom_left]" : "end-0 top-full mt-2 [--radix-popper-transform-origin:top_right]")}
        >
          <p className="mb-3 text-caption1 font-medium text-fg-subtle">Palette</p>
          <PaletteSwatches />
        </div>
      )}
    </div>
  );
}
