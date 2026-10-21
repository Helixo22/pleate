// Theming page controls: palettes, custom color with the generated values and their contrast, global roundness
// and the motion switch.
"use client";

import { Badge, Button, Slider, Switch } from "pleate";
import { contrast, createPalette, CUSTOM_PALETTE, PALETTES, useTheme } from "pleate/theme";
import { useEffect, useMemo, useState } from "react";
import { PaletteSwatches } from "./theme-controls";

function Swatch({ color, label, on }: { color: string; label: string; on?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl text-footnote font-semibold shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.1)]" style={{ background: color, color: on }}>
        {on ? "Aa" : null}
      </span>
      <span className="min-w-0">
        <span className="block text-subhead font-medium">{label}</span>
        <span className="block font-mono text-caption1 text-fg-muted uppercase">{color}</span>
      </span>
    </div>
  );
}

function Ratio({ value }: { value: number }) {
  const pass = value >= 4.5;
  return (
    <Badge size="sm" tone={pass ? "success" : "danger"}>
      {value.toFixed(2)} {pass ? "AA" : "fail"}
    </Badge>
  );
}

export function ThemingPlayground() {
  const { palette, customColor, motion, setMotion } = useTheme();
  const seed = palette === CUSTOM_PALETTE ? customColor : PALETTES[palette as keyof typeof PALETTES]?.seed;
  const generated = useMemo(() => (seed ? createPalette(seed) : null), [seed]);
  const [roundness, setRoundness] = useState(1);
  useEffect(() => {
    document.documentElement.style.setProperty("--pl-roundness", String(roundness));
  }, [roundness]);

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <div className="flex flex-col gap-6 rounded-3xl bg-surface p-5 shadow-xs">
        <div>
          <h2 className="mb-3 text-headline">Palette</h2>
          <PaletteSwatches />
        </div>
        <div>
          <div className="mb-3 flex justify-between">
            <h2 className="text-headline">Roundness</h2>
            <span className="pl-tabular text-subhead text-fg-muted">{roundness.toFixed(2)}×</span>
          </div>
          <Slider value={[roundness]} min={0.25} max={1.5} step={0.05} onValueChange={([v]) => setRoundness(v)} thumbLabels={["Roundness"]} />
        </div>
        <Switch
          label="Animations"
          description="Off sets data-motion=&quot;off&quot;. The system Reduce Motion setting is always respected."
          labelPlacement="start"
          checked={motion !== "off"}
          onCheckedChange={(on) => setMotion(on ? "system" : "off")}
        />
      </div>

      {generated && (
        <div className="grid gap-6 rounded-3xl bg-surface p-5 shadow-xs md:grid-cols-2">
          {(["light", "dark"] as const).map((mode) => {
            const m = generated[mode];
            const page = mode === "light" ? "#f2f2f7" : "#2c2c2e";
            return (
              <div key={mode} className="flex flex-col gap-4" data-theme={mode}>
                <div className="flex flex-col gap-4 rounded-2xl bg-bg p-4">
                  <h3 className="text-headline capitalize text-fg">{mode}</h3>
                  <Swatch color={m.accent} on={m.onAccent} label="accent + on-accent" />
                  <Ratio value={contrast(m.accent, m.onAccent)} />
                  <Swatch color={m.accentInk} label="accent-ink" />
                  <Ratio value={contrast(m.accentInk, page)} />
                  <div className="flex flex-wrap gap-2 pt-1" style={{ ["--pl-accent" as string]: m.accent, ["--pl-on-accent" as string]: m.onAccent, ["--pl-accent-ink" as string]: m.accentInk }}>
                    <Button size="sm">Filled</Button>
                    <Button size="sm" variant="tinted">Tinted</Button>
                    <Button size="sm" variant="plain">Plain</Button>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="md:col-span-2">
            <p className="mb-2 text-footnote font-semibold text-fg-muted">Scale</p>
            <div className="flex overflow-hidden rounded-xl">
              {Object.entries(generated.scale).map(([step, color]) => (
                <div key={step} title={`${step} ${color}`} className="h-12 flex-1" style={{ background: color }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
