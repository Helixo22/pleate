"use client";

import { Label } from "pleate/label";
import { NumberField } from "pleate/number-field";
import { useState } from "react";

export default function Demo() {
  const [guests, setGuests] = useState(2);
  return (
    <div className="grid w-full max-w-xs gap-5">
      <div className="grid gap-1.5">
        <Label id="guests-label">Guests</Label>
        <NumberField aria-labelledby="guests-label" value={guests} onValueChange={setGuests} min={1} max={8} />
      </div>
      <div className="grid gap-1.5">
        <Label id="budget-label">Nightly budget</Label>
        <NumberField
          aria-labelledby="budget-label"
          defaultValue={140}
          min={40}
          max={600}
          step={10}
          format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
        />
      </div>
    </div>
  );
}
