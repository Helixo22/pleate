"use client";

import { TimePicker } from "pleate/time-picker";
import { useState } from "react";

export default function Demo() {
  const [pickup, setPickup] = useState<string | null>("09:30");
  return (
    <div className="grid w-full max-w-sm gap-4">
      <TimePicker aria-label="Airport pickup" value={pickup} onValueChange={setPickup} minuteStep={15} listLabel="Pickup time" />
      <TimePicker aria-label="Dinner reservation" variant="outline" size="lg" hour12 min="18:00" max="22:30" minuteStep={30} defaultValue="20:00" placeholder="Reservation time" />
      <TimePicker aria-label="Check-in" size="sm" locale="de-DE" min="14:00" max="23:00" minuteStep={60} placeholder="Check-in" />
    </div>
  );
}
