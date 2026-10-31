"use client";

import { Countdown } from "pleate/countdown";
import { useState } from "react";

export default function Demo() {
  // Fixed once per mount so the targets do not move on re-render.
  const [now] = useState(() => Date.now());
  return (
    <div className="grid gap-5">
      <Countdown label="Seats held for" to={now + 15 * 60_000} />
      <Countdown label="Check-in opens in" format="hh:mm:ss" size="sm" to={now + 5 * 3_600_000 + 42 * 60_000} />
      <Countdown label="Lisbon in" format="d h m" size="lg" to={now + 12 * 86_400_000 + 7 * 3_600_000} />
    </div>
  );
}
