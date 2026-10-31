"use client";

import { HorizontalScroll } from "pleate/effects/scroll";

const places = [
  { city: "Lisbon", country: "Portugal", nights: 3, from: "€412" },
  { city: "Kyoto", country: "Japan", nights: 5, from: "€1,280" },
  { city: "Oaxaca", country: "Mexico", nights: 4, from: "€960" },
  { city: "Tromsø", country: "Norway", nights: 3, from: "€738" },
  { city: "Marrakesh", country: "Morocco", nights: 4, from: "€544" },
  { city: "Hobart", country: "Australia", nights: 6, from: "€1,690" },
];

export default function Demo() {
  return (
    <HorizontalScroll gap={16} offset={56} label="Destinations" className="w-full">
      {places.map((p) => (
        <a
          key={p.city}
          href={`#${p.city.toLowerCase()}`}
          className="pl-field pl-focus-ring flex h-80 w-64 flex-col justify-between rounded-xl bg-surface-2 p-5 transition-colors hover:bg-fill [--pl-field-border:var(--pl-separator)]"
        >
          <span className="font-mono text-caption1 text-fg-subtle">{p.country}</span>
          <div className="flex flex-col gap-1">
            <span className="text-title2 text-fg">{p.city}</span>
            <span className="font-mono text-footnote text-fg-muted tabular-nums">
              {p.nights} nights from {p.from}
            </span>
          </div>
        </a>
      ))}
    </HorizontalScroll>
  );
}
