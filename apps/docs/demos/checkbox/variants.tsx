"use client";

import { Checkbox } from "pleate/checkbox";
import { useState } from "react";

const MAIL = [
  { id: "a", from: "Iberia", subject: "Your boarding pass for IB3117", time: "09:41" },
  { id: "b", from: "Casa do Fado", subject: "Table for two confirmed", time: "Yesterday" },
  { id: "c", from: "Lisboa Card", subject: "Your 72 hour pass is ready", time: "Mon" },
];

export default function Demo() {
  const [picked, setPicked] = useState<string[]>(["a"]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <div className="grid w-full max-w-md gap-8">
      <div className="flex flex-wrap items-center gap-4">
        <Checkbox aria-label="Small" size="sm" defaultChecked />
        <Checkbox aria-label="Medium" defaultChecked />
        <Checkbox aria-label="Large" size="lg" defaultChecked />
        <Checkbox aria-label="Unchecked" />
        <Checkbox aria-label="Circle" shape="circle" size="lg" defaultChecked />
        <Checkbox aria-label="Circle unchecked" shape="circle" size="lg" />
        <Checkbox aria-label="Disabled" disabled defaultChecked />
      </div>
      <Checkbox label="Email me trip updates" description="Price drops, gate changes and reminders" defaultChecked />
      {/* Edit mode in Mail: selection circles at the start of each row */}
      <div className="grid gap-1.5 rounded-2xl bg-bg p-4">
        <p className="px-4 text-footnote text-fg-muted">{picked.length} selected</p>
        <ul className="divide-y divide-separator overflow-hidden rounded-xl bg-surface">
          {MAIL.map((m) => (
            <li key={m.id}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5">
                <Checkbox shape="circle" size="lg" aria-label={`Select ${m.from}`} checked={picked.includes(m.id)} onCheckedChange={() => toggle(m.id)} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-headline">{m.from}</span>
                    <span className="shrink-0 text-footnote text-fg-muted">{m.time}</span>
                  </span>
                  <span className="truncate text-subhead text-fg-muted">{m.subject}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
