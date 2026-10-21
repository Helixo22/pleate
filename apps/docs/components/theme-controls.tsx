// Docs header controls: light / system / dark switch and the palette picker (presets + any custom color).
"use client";

import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { motion } from "motion/react";
import { cn, IconButton, spring } from "pleate";
import { createPalette, CUSTOM_PALETTE, PALETTES, useTheme, type ThemePreference } from "pleate/theme";
import { useEffect, useRef, useState } from "react";

const MODES: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
];

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <div role="radiogroup" aria-label="Color scheme" className="flex rounded-full bg-fill-2 p-0.5">
      {MODES.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "pl-focus-ring pl-touch relative grid size-8 cursor-pointer place-items-center rounded-full transition-colors",
              active ? "text-fg" : "text-fg-muted hover:text-fg",
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-pill"
                transition={spring.snap}
                className="absolute inset-0 rounded-full bg-surface shadow-sm"
              />
            )}
            <Icon className="relative size-4" />
          </button>
        );
      })}
    </div>
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
      <label className="flex items-center gap-3 rounded-lg bg-fill-2 p-2 pe-3">
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
          <span className="text-footnote text-fg-muted uppercase">{draft}</span>
        </span>
      </label>
    </div>
  );
}

export function PalettePicker() {
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
        variant="gray"
        tone="neutral"
        onClick={() => setOpen((v) => !v)}
        icon={<Palette />}
      />
      {open && (
        <div
          data-state="open"
          className="pl-pop absolute end-0 top-full z-(--pl-z-dropdown) mt-2 w-64 rounded-2xl bg-elevated p-4 shadow-xl [--radix-popper-transform-origin:top_right]"
        >
          <p className="mb-3 text-footnote font-semibold text-fg-muted">Palette</p>
          <PaletteSwatches />
        </div>
      )}
    </div>
  );
}
