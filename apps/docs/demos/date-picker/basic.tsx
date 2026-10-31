"use client";

import { Calendar, type DateRange } from "pleate/calendar";
import { DatePicker } from "pleate/date-picker";
import { useEffect, useState } from "react";

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fromToday = (n: number) => addDays(new Date(), n);
const saturday = () => fromToday((6 - new Date().getDay() + 7) % 7);

export default function Demo() {
  // The page is prerendered: read the clock only after mount so the markup hydrates.
  const [today, setToday] = useState<Date>();
  const [date, setDate] = useState<Date | null>(null);
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [day, setDay] = useState<Date | null>(null);
  useEffect(() => {
    const now = new Date();
    setToday(now);
    setDay(now);
  }, []);
  return (
    <div className="grid w-full gap-8 md:grid-cols-2">
      <div className="grid content-start gap-4">
        <DatePicker aria-label="Departure" value={date} onValueChange={setDate} min={today} placeholder="Departure" />
        <DatePicker
          mode="range"
          aria-label="Stay"
          value={range}
          onValueChange={setRange}
          min={today}
          placeholder="Check-in to check-out"
          presets={[
            { label: "This weekend", value: () => ({ from: saturday(), to: addDays(saturday(), 1) }) },
            { label: "Next 7 days", value: () => ({ from: fromToday(0), to: fromToday(6) }) },
            { label: "Next month", value: () => ({ from: fromToday(30), to: fromToday(37) }) },
          ]}
        />
        <DatePicker aria-label="Weekdays only" variant="outline" isDisabled={(d) => d.getDay() === 0 || d.getDay() === 6} placeholder="Weekdays only" />
      </div>
      <div className="rounded-2xl bg-fill-3 p-3">
        <Calendar value={day} onValueChange={setDay} />
      </div>
    </div>
  );
}
