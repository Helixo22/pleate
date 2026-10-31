"use client";

import { Button } from "pleate/button";
import { Odometer } from "pleate/effects/motion-graphics";
import { useState } from "react";

const EUR: Intl.NumberFormatOptions = { style: "currency", currency: "EUR", maximumFractionDigits: 0 };

export default function Demo() {
  const [total, setTotal] = useState(1840);
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-caption1 text-fg-subtle">Trip total</p>
        <Odometer value={total} format={EUR} locale="en-IE" className="text-display-sm" />
      </div>
      <div className="flex gap-2">
        <Button variant="surface" tone="neutral" size="sm" onClick={() => setTotal((t) => Math.max(0, t - 215))}>
          Remove hotel night
        </Button>
        <Button size="sm" onClick={() => setTotal((t) => t + 389)}>
          Add flight
        </Button>
      </div>
    </div>
  );
}
