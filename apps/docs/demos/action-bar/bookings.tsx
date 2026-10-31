"use client";

import { Archive, Download } from "lucide-react";
import { ActionBar } from "pleate/action-bar";
import { Button } from "pleate/button";
import { Checkbox } from "pleate/checkbox";
import { useState } from "react";

const BOOKINGS = [
  { id: "lis", title: "Lisbon, Alfama flat", meta: "12 to 16 May" },
  { id: "opo", title: "Porto, river view room", meta: "16 to 18 May" },
  { id: "sin", title: "Sintra day train", meta: "14 May" },
  { id: "far", title: "Faro, beach house", meta: "2 to 9 Jun" },
];

export default function Demo() {
  const [selected, setSelected] = useState<string[]>(["lis", "opo"]);
  const toggle = (id: string, on: boolean) => setSelected((s) => (on ? [...s, id] : s.filter((x) => x !== id)));
  return (
    <div className="flex h-[24rem] w-full max-w-xl flex-col justify-between overflow-hidden rounded-xl bg-bg shadow-[inset_0_0_0_1px_var(--pl-separator)]">
      <ul className="divide-y divide-separator px-4 pt-2">
        {BOOKINGS.map((b) => (
          <li key={b.id} className="py-3">
            <Checkbox
              label={b.title}
              description={b.meta}
              checked={selected.includes(b.id)}
              onCheckedChange={(on) => toggle(b.id, on === true)}
            />
          </li>
        ))}
      </ul>
      <ActionBar
        position="static"
        open={selected.length > 0}
        count={selected.length}
        label="Booking actions"
        onClear={() => setSelected([])}
        actions={
          <>
            <Button variant="outline" tone="neutral" size="sm" startIcon={<Download />}>
              <span className="max-sm:sr-only">Export</span>
            </Button>
            <Button variant="tinted" tone="neutral" size="sm" startIcon={<Archive />}>
              Archive
            </Button>
          </>
        }
      />
    </div>
  );
}
