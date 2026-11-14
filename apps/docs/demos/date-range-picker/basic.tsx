"use client";

import type { DateRange } from "pleate/calendar";
import { DateRangePicker } from "pleate/date-range-picker";
import { useEffect, useState } from "react";

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fromToday = (n: number) => addDays(new Date(), n);
const saturday = () => fromToday((6 - new Date().getDay() + 7) % 7);

export default function Demo() {
  // The page is prerendered: read the clock only after mount so the markup hydrates.
  const [today, setToday] = useState<Date>();
  const [stay, setStay] = useState<DateRange>({ from: null, to: null });
  useEffect(() => setToday(new Date()), []);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <DateRangePicker
        aria-label="Trip dates"
        placeholder="Add trip dates"
        value={stay}
        onValueChange={setStay}
        min={today}
        presets={[
          { label: "This weekend", value: () => ({ from: saturday(), to: addDays(saturday(), 1) }) },
          { label: "Next 7 days", value: () => ({ from: fromToday(0), to: fromToday(6) }) },
          { label: "Next month", value: () => ({ from: fromToday(30), to: fromToday(37) }) },
        ]}
      />
      <DateRangePicker aria-label="Hotel stay, weekdays only" variant="outline" size="lg" placeholder="Check-in, check-out" min={today} isDisabled={(d) => d.getDay() === 0} locale="it-IT" />
      <DateRangePicker aria-label="Return window" size="sm" placeholder="Return window" defaultValue={{ from: fromToday(10), to: fromToday(14) }} />
    </div>
  );
}
