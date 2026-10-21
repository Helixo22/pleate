"use client";

import { Parallax, ScrollProgress } from "pleate/effects/reveal";
import { useRef } from "react";

export default function Demo() {
  const box = useRef<HTMLDivElement>(null);
  return (
    <div ref={box} className="relative h-80 w-full overflow-y-auto rounded-2xl bg-fill-3">
      <div className="sticky top-0 z-10">
        <ScrollProgress target={box} fixed={false} />
      </div>
      <div className="grid gap-16 p-6 pb-40">
        <p className="text-subhead text-fg-muted">Scroll inside this box: the bar tracks it, the cards drift at different speeds.</p>
        {[-0.3, 0.2, -0.15].map((speed, i) => (
          <Parallax key={i} speed={speed}>
            <div className="grid h-28 place-items-center rounded-2xl bg-surface text-headline shadow-sm">speed {speed}</div>
          </Parallax>
        ))}
      </div>
    </div>
  );
}
