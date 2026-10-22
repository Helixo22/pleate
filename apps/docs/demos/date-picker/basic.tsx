"use client";

import { Calendar, type DateRange } from "pleate/calendar";
import { DatePicker } from "pleate/date-picker";
import { useState } from "react";

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export default function Demo() {
  const today = new Date();
  const [date, setDate] = useState<Date | null>(null);
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [day, setDay] = useState<Date | null>(today);
  const saturday = addDays(today, (6 - today.getDay() + 7) % 7);
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
            { label: "This weekend", value: () => ({ from: saturday, to: addDays(saturday, 1) }) },
            { label: "Next 7 days", value: () => ({ from: today, to: addDays(today, 6) }) },
            { label: "Next month", value: () => ({ from: addDays(today, 30), to: addDays(today, 37) }) },
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
