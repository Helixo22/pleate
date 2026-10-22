"use client";

import { Sun, Volume1, Volume2 } from "lucide-react";
import { Slider } from "pleate/slider";
import { useState } from "react";

export default function Demo() {
  const [price, setPrice] = useState([80, 240]);
  return (
    <div className="grid w-full max-w-md gap-8">
      <div className="flex items-center gap-3 text-fg-muted">
        <Volume1 className="size-5 shrink-0" />
        <Slider defaultValue={[60]} thumbLabels={["Volume"]} />
        <Volume2 className="size-5 shrink-0" />
      </div>
      <div className="grid gap-2">
        <div className="flex justify-between text-subhead">
          <span>Price per night</span>
          <span className="pl-tabular text-fg-muted">€{price[0]} to €{price[1]}</span>
        </div>
        <Slider value={price} onValueChange={setPrice} min={0} max={400} step={10} thumbLabels={["Minimum price", "Maximum price"]} />
      </div>
      <div className="relative">
        <Slider variant="bar" size="lg" defaultValue={[70]} thumbLabels={["Brightness"]} />
        <Sun className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-on-accent" />
      </div>
    </div>
  );
}
