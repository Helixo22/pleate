"use client";

import { useState } from "react";
import { OptionWheel } from "pleate/effects/option-wheel";

const cities = ["Amsterdam", "Berlin", "Lisbon", "Madrid", "Milan", "Oslo", "Paris", "Prague", "Rome", "Vienna", "Zurich"];

export default function Demo() {
  const [city, setCity] = useState(4);
  return (
    <div className="flex flex-col items-center gap-4">
      <OptionWheel options={cities} value={city} onChange={setCity} aria-label="City" />
      <p className="text-subhead text-fg-muted">Flying to {cities[city]}</p>
    </div>
  );
}
