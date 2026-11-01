"use client";

import { Progress, ProgressCircle } from "pleate/progress";
import { useEffect, useState } from "react";

const MAPS = [
  { city: "Lisbon", size: "312 MB" },
  { city: "Porto", size: "188 MB" },
  { city: "Sintra", size: "64 MB" },
];

export default function Demo() {
  const [value, setValue] = useState(18);
  useEffect(() => {
    const id = setInterval(() => setValue((v) => (v >= 100 ? 0 : v + 7)), 700);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="grid w-full max-w-md gap-6">
      <div className="grid gap-2">
        <p className="px-4 text-footnote text-fg-muted">Offline maps</p>
        <ul className="overflow-hidden rounded-xl bg-fill-3">
          {MAPS.map((map, i) => {
            const done = i === 2;
            const current = i === 0 ? value : i === 1 ? null : 100;
            return (
              <li key={map.city} className="flex min-h-14 items-center ps-4">
                <div className="grid flex-1 gap-2 self-stretch border-b border-fg/10 py-3 pe-4 in-[li:last-child]:border-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-body">{map.city}</span>
                    <span className="pl-tabular text-subhead text-fg-muted">
                      {done ? map.size : current === null ? "Waiting" : `${current}%`}
                    </span>
                  </div>
                  {!done && <Progress value={current} size="sm" aria-label={`${map.city} download`} />}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <Progress value={640} max={1000} tone="success" label="Trip budget" valueLabel="€640 of €1,000" />
      <div className="flex items-center gap-5">
        <ProgressCircle value={72} size={64} thickness={6} tone="success" aria-label="Packing list">72%</ProgressCircle>
        <p className="text-subhead text-fg-muted">18 of 25 items packed</p>
      </div>
    </div>
  );
}
