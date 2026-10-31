"use client";

import { BedDouble, Plane, StickyNote } from "lucide-react";
import { Fab } from "pleate/fab";
import { toast } from "pleate/toast";

export default function Demo() {
  return (
    <div className="flex h-[26rem] w-full max-w-[20rem] flex-col justify-end overflow-hidden rounded-[2.5rem] bg-bg p-5 shadow-[inset_0_0_0_1px_var(--pl-separator)]">
      <div className="mb-auto pt-6">
        <p className="text-title3 font-semibold text-fg">Lisbon</p>
        <p className="font-mono text-footnote text-fg-muted">12 to 16 May · 4 nights</p>
      </div>
      <Fab
        position="static"
        className="self-end"
        label="Add to trip"
        actions={[
          { id: "flight", label: "Flight", icon: <Plane />, onSelect: () => toast("Add a flight") },
          { id: "stay", label: "Stay", icon: <BedDouble />, onSelect: () => toast("Add a stay") },
          { id: "note", label: "Note", icon: <StickyNote />, onSelect: () => toast("Add a note") },
        ]}
      />
    </div>
  );
}
