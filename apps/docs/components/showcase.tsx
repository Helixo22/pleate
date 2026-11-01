// Home page previews. Showcase: one app window built only from pleate components, so palette and theme switches show at a
// glance. The total rolls with Odometer as options change.
"use client";

import { Avatar, AvatarGroup, Button, Checkbox, Input, SegmentedControl, Switch, Tag } from "pleate";
import { DecryptedText } from "pleate/effects/animated-text";
import { DotGlobe } from "pleate/effects/depth";
import { Spotlight } from "pleate/effects/hover";
import { Odometer, StatusMark, Waveform } from "pleate/effects/motion-graphics";
import Link from "next/link";
import { useState, type ReactNode } from "react";

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

      <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
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

// Home page strip: a few effects running live, each card links to its page. Light ones only (one small canvas).
const EFFECTS: { name: string; href: string; note: string; preview: ReactNode }[] = [
  {
    name: "Decrypted Text",
    href: "/components/animated-text",
    note: "Animated text",
    preview: <DecryptedText text="pleate.ui" trigger="hover" className="font-brand text-title1" />,
  },
  {
    name: "Dot Globe",
    href: "/components/3d-effects",
    note: "3D effects",
    preview: <DotGlobe size={120} dots={600} label="Spinning dot globe" />,
  },
  {
    name: "Waveform",
    href: "/components/motion-graphics",
    note: "Motion graphics",
    preview: <Waveform bars={20} height={40} label="Voice level" />,
  },
];

export function FeaturedEffects() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {EFFECTS.map(({ name, href, note, preview }) => (
        <li key={name}>
          <Link href={href} className="pl-focus-ring group flex h-full flex-col overflow-hidden rounded-2xl bg-surface shadow-[inset_0_0_0_1px_var(--pl-separator)] transition-colors hover:bg-fill-3">
            <span className="grid h-40 place-items-center overflow-hidden border-b border-separator">{preview}</span>
            <span className="flex items-baseline justify-between gap-3 px-4 py-3">
              <span className="text-subhead font-medium text-fg">{name}</span>
              <span className="text-caption1 text-fg-subtle">{note}</span>
            </span>
          </Link>
        </li>
      ))}
      <li>
        <Spotlight className="h-full rounded-2xl bg-surface">
          <Link href="/components/hover-effects" className="pl-focus-ring flex h-full flex-col overflow-hidden rounded-2xl shadow-[inset_0_0_0_1px_var(--pl-separator)]">
            <span className="grid h-40 place-items-center border-b border-separator px-6 text-center text-subhead text-fg-muted">Move the pointer here</span>
            <span className="flex items-baseline justify-between gap-3 px-4 py-3">
              <span className="text-subhead font-medium text-fg">Spotlight</span>
              <span className="text-caption1 text-fg-subtle">Hover effects</span>
            </span>
          </Link>
        </Spotlight>
      </li>
    </ul>
  );
}
