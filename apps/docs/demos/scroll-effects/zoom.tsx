"use client";

import { ScrollZoom } from "pleate/effects/scroll";

export default function Demo() {
  return (
    <div className="flex w-full flex-col gap-10">
      <p className="text-subhead text-fg-muted">Scroll down. The frame opens up as it reaches the middle of the screen.</p>
      <ScrollZoom caption="Douro valley · 41.19° N, 7.54° W · June">
        {/* A photo stand-in drawn with solid surfaces: sky, two ridges and the river. */}
        <div role="img" aria-label="Terraced hills above a river" className="relative aspect-[16/9] bg-surface-2">
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-fill-2 [clip-path:polygon(0_40%,22%_10%,48%_35%,70%_0,100%_30%,100%_100%,0_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-fill-3 [clip-path:polygon(0_30%,30%_0,60%_40%,100%_10%,100%_100%,0_100%)]" />
          <div className="absolute inset-x-0 bottom-[12%] h-[6%] bg-accent-200 dark:bg-accent-800" />
        </div>
      </ScrollZoom>
      <p className="text-subhead text-fg-muted">Three nights, two stays, one river.</p>
    </div>
  );
}
