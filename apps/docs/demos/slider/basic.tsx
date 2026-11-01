"use client";

import { Sun, SunDim, Volume2 } from "lucide-react";
import { Slider } from "pleate/slider";
import { useState } from "react";

export default function Demo() {
  const [price, setPrice] = useState([80, 240]);
  return (
    <div className="grid w-full max-w-md gap-8">
      {/* Settings: a slider between two glyphs, inside an inset grouped card */}
      <div className="grid gap-1.5 rounded-2xl bg-bg p-4">
        <p className="px-4 text-footnote text-fg-muted">Brightness</p>
        <div className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 text-fg-muted">
          <SunDim className="size-5 shrink-0" aria-hidden="true" />
          <Slider defaultValue={[60]} thumbLabels={["Brightness"]} />
          <Sun className="size-6 shrink-0" aria-hidden="true" />
        </div>
      </div>
      <div className="grid gap-3">
        <div className="flex justify-between text-subhead">
          <span>Price per night</span>
          <span className="pl-tabular text-fg-muted">
            €{price[0]} to €{price[1]}
          </span>
        </div>
        <Slider value={price} onValueChange={setPrice} min={0} max={400} step={10} thumbLabels={["Minimum price", "Maximum price"]} />
      </div>
      {/* Control Center style: the fill is the handle */}
      <div className="relative">
        <Slider variant="bar" size="lg" defaultValue={[70]} thumbLabels={["Volume"]} />
        <Volume2 className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-on-accent" aria-hidden="true" />
      </div>
    </div>
  );
}
