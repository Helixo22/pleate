"use client";

import { Calendar, type DateRange } from "pleate/calendar";
import { DatePicker } from "pleate/date-picker";
import { useEffect, useState, type ReactNode } from "react";

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fromToday = (n: number) => addDays(new Date(), n);
const saturday = () => fromToday((6 - new Date().getDay() + 7) % 7);

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-subhead font-medium">{label}</span>
      {children}
    </div>
  );
}

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
      <div className="grid content-start gap-5">
        <Field label="Departure"><DatePicker aria-label="Departure" value={date} onValueChange={setDate} min={today} placeholder="Pick a date" /></Field>
        <Field label="Stay"><DatePicker
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
        /></Field>
        <Field label="Meeting day"><DatePicker aria-label="Meeting day" isDisabled={(d) => d.getDay() === 0 || d.getDay() === 6} placeholder="Weekdays only" /></Field>
      </div>
      <div className="rounded-2xl bg-fill-3 p-3">
        <Calendar value={day} onValueChange={setDay} />
      </div>
    </div>
  );
}
