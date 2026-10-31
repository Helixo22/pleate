"use client";

import { StickyScroll } from "pleate/effects/scroll";
import type { ReactNode } from "react";

const Panel = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="pl-field flex flex-col gap-4 rounded-xl bg-surface-2 p-5 [--pl-field-border:var(--pl-separator)]">
    <span className="font-mono text-caption1 text-fg-subtle">{label}</span>
    {children}
  </div>
);

const Row = ({ name, meta }: { name: string; meta: string }) => (
  <div className="flex items-center justify-between gap-4 border-t border-separator pt-3 text-subhead first:border-t-0 first:pt-0">
    <span className="text-fg">{name}</span>
    <span className="font-mono text-footnote text-fg-muted tabular-nums">{meta}</span>
  </div>
);

const DAYS = [12, 13, 14, 15, 16, 17, 18];

const steps = [
  {
    id: "dates",
    title: "Pick your dates",
    body: "Choose the nights you are away. Fares and stays update for that window.",
    visual: (
      <Panel label="June 2027">
        <div className="grid grid-cols-7 gap-1 text-center font-mono text-footnote tabular-nums">
          {DAYS.map((d) => (
            <span key={d} className={d >= 14 && d <= 17 ? "rounded-md bg-accent py-2 text-on-accent" : "rounded-md bg-surface py-2 text-fg-muted"}>
              {d}
            </span>
          ))}
        </div>
        <p className="text-footnote text-fg-muted">14 to 17 June, 3 nights</p>
      </Panel>
    ),
  },
  {
    id: "route",
    title: "Set the route",
    body: "Add stops in order. Travel time between them is worked out for you.",
    visual: (
      <Panel label="Route">
        <Row name="Lisbon" meta="start" />
        <Row name="Porto" meta="2 h 50 min" />
        <Row name="Douro valley" meta="1 h 35 min" />
      </Panel>
    ),
  },
  {
    id: "stays",
    title: "Book the stays",
    body: "One place per stop, with the nights already matched to the route.",
    visual: (
      <Panel label="Stays">
        <Row name="Casa do Rio, Porto" meta="2 nights · €286" />
        <Row name="Quinta Nova, Pinhão" meta="1 night · €174" />
      </Panel>
    ),
  },
  {
    id: "share",
    title: "Share the plan",
    body: "Send one link. Everyone sees the same dates, route and bookings.",
    visual: (
      <Panel label="Trip total">
        <span className="text-display-sm text-fg tabular-nums">€1,840</span>
        <Row name="Travellers" meta="2" />
        <Row name="Shared with" meta="marta@ferreira.pt" />
      </Panel>
    ),
  },
];

export default function Demo() {
  // offset: the docs header is 56px tall.
  return <StickyScroll steps={steps} offset={56} className="w-full" />;
}
