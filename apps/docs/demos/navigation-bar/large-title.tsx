"use client";

import { Plus } from "lucide-react";
import { IconButton } from "pleate/icon-button";
import { Input } from "pleate/input";
import { NavigationBar, NavigationBarBack } from "pleate/navigation-bar";
import { useRef } from "react";

const TRIPS = [
  ["Weekend in Lisbon", "14 to 17 Nov"],
  ["Kyoto in spring", "2 to 11 Apr"],
  ["Porto and the Douro", "May, 5 nights"],
  ["Road trip in Andalusia", "June, 9 nights"],
  ["Reykjavik", "Draft"],
  ["Marrakesh", "Draft"],
  ["Naples and Procida", "12 to 18 Sep"],
  ["Oaxaca", "Day of the Dead, 6 nights"],
  ["Hanoi to Hoi An", "Feb, 10 nights"],
  ["Valencia", "Las Fallas, 4 nights"],
  ["Copenhagen", "Draft"],
  ["Sintra day trip", "Saturday"],
];

export default function Demo() {
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div ref={scroller} className="h-[32rem] w-full max-w-sm overflow-y-auto rounded-[2.5rem] bg-bg shadow-[inset_0_0_0_1px_var(--pl-separator)]">
      <NavigationBar
        largeTitle
        title="Trips"
        scrollContainer={scroller}
        leading={<NavigationBarBack label="Home" />}
        trailing={<IconButton aria-label="New trip" size="sm" variant="plain" icon={<Plus />} />}
        accessory={<Input size="sm" type="search" aria-label="Search trips" placeholder="Search" />}
      />
      <ul className="mx-4 mb-6 overflow-hidden rounded-xl bg-surface">
        {TRIPS.map(([place, dates]) => (
          <li key={place} className="flex min-h-14 flex-col justify-center border-b border-separator px-4 py-2 last:border-0">
            <span className="text-body">{place}</span>
            <span className="text-subhead text-fg-muted">{dates}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
