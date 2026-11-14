"use client";

import { useState } from "react";
import { Combobox, type ComboboxOption } from "pleate/combobox";

const CITIES: ComboboxOption[] = [
  { value: "lisbon", label: "Lisbon", description: "Portugal · 3 nights from 142 EUR", group: "Europe" },
  { value: "seville", label: "Seville", description: "Spain · 2 nights from 96 EUR", group: "Europe" },
  { value: "naples", label: "Naples", description: "Italy · 4 nights from 88 EUR", group: "Europe" },
  { value: "porto", label: "Porto", description: "Portugal · fully booked in May", group: "Europe", disabled: true },
  { value: "kyoto", label: "Kyoto", description: "Japan · 5 nights from 210 EUR", group: "Asia" },
  { value: "hanoi", label: "Hanoi", description: "Vietnam · 4 nights from 64 EUR", group: "Asia" },
  { value: "oaxaca", label: "Oaxaca", description: "Mexico · 3 nights from 78 EUR", group: "Americas" },
];

export default function Demo() {
  const [city, setCity] = useState<string | null>("lisbon");
  return (
    <div className="mx-auto grid w-full max-w-sm gap-3">
      <Combobox aria-label="Destination" options={CITIES} value={city} onValueChange={setCity} placeholder="Where to?" clearable />
      <Combobox aria-label="Departure city" variant="outline" options={CITIES} placeholder="Leaving from" />
      <p className="text-footnote text-fg-muted">Selected: {CITIES.find((c) => c.value === city)?.label ?? "nothing"}</p>
    </div>
  );
}
