// Home page preview: one app window built only from pleate components, so palette and theme switches show at a
// glance. The total rolls with Odometer as options change.
"use client";

import { Avatar, AvatarGroup, Button, Checkbox, Input, SegmentedControl, Switch, Tag } from "pleate";
import { Odometer, StatusMark } from "pleate/effects/motion-graphics";
import { useState } from "react";

const EUR: Intl.NumberFormatOptions = { style: "currency", currency: "EUR", maximumFractionDigits: 0 };
const FARE = { economy: 412, premium: 688 } as const;

export function Showcase() {
  const [filter, setFilter] = useState("all");
  const [fare, setFare] = useState<keyof typeof FARE>("economy");
  const [insurance, setInsurance] = useState(true);
  const [transfer, setTransfer] = useState(false);
  const total = 426 + FARE[fare] + (insurance ? 38 : 0) + (transfer ? 64 : 0);

  return (
    <div className="pl-field overflow-hidden rounded-xl bg-surface [--pl-field-border:var(--pl-separator)]">
      <div className="flex h-10 items-center gap-3 border-b border-separator bg-surface-2 px-4">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-fill" />
          <span className="size-2.5 rounded-full bg-fill" />
          <span className="size-2.5 rounded-full bg-fill" />
        </span>
        <span className="font-mono text-caption1 text-fg-subtle">plate.app/trips/lisbon</span>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 p-5 md:border-e md:border-separator">
          <div className="flex items-center gap-3">
            <Avatar name="Sofia Rossi" status="online" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-headline">Weekend in Lisbon</p>
              <p className="font-mono text-caption1 text-fg-subtle">14 to 17 Nov</p>
            </div>
            <AvatarGroup size="sm" max={2}>
              <Avatar name="Omar Haddad" />
              <Avatar name="Chiara Bianchi" />
              <Avatar name="Jonas Berg" />
            </AvatarGroup>
          </div>
          <Input aria-label="Search activities" placeholder="Search activities" />
          <div className="flex flex-wrap gap-1.5">
            {["all", "food", "culture", "night"].map((f) => (
              <Tag key={f} size="sm" selected={filter === f} onClick={() => setFilter(f)} className="capitalize">
                {f}
              </Tag>
            ))}
          </div>
          <ul className="flex flex-col divide-y divide-separator text-subhead">
            {[
              ["Fri 14", "Tram 28 and Alfama walk", "10:00"],
              ["Sat 15", "Time Out Market lunch", "13:30"],
              ["Sun 16", "Sintra day trip", "08:45"],
            ].map(([day, what, time]) => (
              <li key={day} className="flex items-center gap-3 py-2.5">
                <span className="w-12 shrink-0 font-mono text-caption1 text-fg-subtle">{day}</span>
                <span className="min-w-0 flex-1 truncate">{what}</span>
                <span className="font-mono text-caption1 text-fg-muted">{time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4 border-t border-separator bg-surface-2 p-5 md:border-t-0">
          <SegmentedControl
            aria-label="Fare"
            size="sm"
            fullWidth
            value={fare}
            onValueChange={setFare}
            options={[
              { value: "economy", label: "Economy" },
              { value: "premium", label: "Premium" },
            ]}
          />
          <div className="flex flex-col gap-3">
            <Checkbox label="Travel insurance" description="Cancellations up to €1,500" checked={insurance} onCheckedChange={(v) => setInsurance(v === true)} />
            <Switch label="Airport transfer" labelPlacement="start" checked={transfer} onCheckedChange={setTransfer} />
          </div>
          <div className="mt-auto flex items-end justify-between gap-3 border-t border-separator pt-4">
            <div>
              <p className="text-caption1 text-fg-subtle">Total for 4</p>
              <Odometer value={total} format={EUR} locale="en-IE" className="text-title1 font-medium" />
            </div>
            <span className="flex items-center gap-1.5 pb-1 text-caption1 text-fg-muted">
              <StatusMark status="success" size={14} label="Seats held" /> Seats held 20 min
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="surface" tone="neutral" className="flex-1">Share</Button>
            <Button className="flex-1">Book trip</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
