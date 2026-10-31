"use client";

import { Button } from "pleate/button";
import { DrawPath } from "pleate/effects/motion-graphics";
import { useState } from "react";

// Lisbon to Porto along the coast, in a 320×200 box.
const ROUTE = "M70 176 C 84 150, 64 132, 86 112 S 118 84, 112 64 S 140 34, 168 26";

export default function Demo() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative w-full max-w-sm">
        <DrawPath key={run} d={ROUTE} viewBox="0 0 320 200" duration={1.8} strokeWidth={2} label="Route from Lisbon to Porto" className="w-full text-accent-ink" />
        <span className="absolute start-[21.9%] top-[88%] size-2.5 -translate-1/2 rounded-full border-2 border-accent-ink bg-surface" />
        <span className="absolute start-[52.5%] top-[13%] size-2.5 -translate-1/2 rounded-full bg-accent-ink" />
        <span className="absolute start-[24%] top-[88%] ms-3 -translate-y-1/2 font-mono text-caption1 text-fg-muted">LIS</span>
        <span className="absolute start-[52.5%] top-[13%] ms-3 -translate-y-1/2 font-mono text-caption1 text-fg-muted">OPO · 313 km</span>
      </div>
      <Button variant="surface" tone="neutral" size="sm" onClick={() => setRun((r) => r + 1)}>
        Replay
      </Button>
    </div>
  );
}
