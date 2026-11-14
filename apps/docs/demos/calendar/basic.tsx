"use client";

import { Calendar, type DateRange } from "pleate/calendar";
import { useEffect, useState } from "react";

export default function Demo() {
  // The page is prerendered: read the clock only after mount so the markup hydrates.
  const [day, setDay] = useState<Date | null>(null);
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [today, setToday] = useState<Date>();
  useEffect(() => {
    const now = new Date();
    setToday(now);
    setDay(now);
  }, []);
  return (
    <div className="grid w-full gap-8 md:grid-cols-2">
      <div className="grid content-start gap-2">
        <p className="text-subhead font-medium">Single day</p>
        <div className="rounded-2xl bg-fill-3 p-3">
          <Calendar value={day} onValueChange={setDay} />
        </div>
      </div>
      <div className="grid content-start gap-2">
        <p className="text-subhead font-medium">Range, past days disabled</p>
        <div className="rounded-2xl bg-fill-3 p-3">
          <Calendar mode="range" value={range} onValueChange={setRange} min={today} />
        </div>
      </div>
    </div>
  );
}
