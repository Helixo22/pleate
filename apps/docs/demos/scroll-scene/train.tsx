"use client";

import { motion, useTransform } from "motion/react";
import { createTimeline, ScrollBeat, ScrollScene, useSceneProgress } from "pleate/effects/scroll-scene";

// Lisbon to Porto by train, one scroll long: three cues pin the train at each station.
const STOPS = [
  { name: "Lisboa Oriente", at: 0, km: 0 },
  { name: "Coimbra-B", at: 0.5, km: 218 },
  { name: "Porto Campanhã", at: 1, km: 337 },
];

const trip = createTimeline({ along: 0, km: 0 }, [
  { at: 0.04 },
  { at: 0.46, values: { along: 0.5, km: 218 } },
  { at: 0.96, values: { along: 1, km: 337 } },
]);

function Route() {
  const progress = useSceneProgress();
  const top = useTransform(progress, (p) => `${trip.sample(p).along * 100}%`);
  const fill = useTransform(progress, (p) => trip.sample(p).along);
  const km = useTransform(progress, (p) => `${Math.round(trip.sample(p).km)} km`);

  return (
    <div className="flex h-full items-end justify-center px-6 pt-16 pb-24 md:items-center md:justify-end md:p-12">
      <div className="flex w-full max-w-xs flex-col gap-4 rounded-2xl bg-surface-2 p-5 md:max-w-sm md:p-6">
        <div className="flex items-baseline justify-between font-mono text-caption1 tabular-nums">
          <span className="text-fg-muted">Alfa Pendular 131</span>
          <motion.span className="text-fg">{km}</motion.span>
        </div>
        <div className="relative h-56 md:h-80">
          {/* The line, and the stretch already travelled over it */}
          <span className="absolute inset-y-0 left-[7px] w-0.5 rounded-full bg-separator" />
          <motion.span className="absolute inset-y-0 left-[7px] w-0.5 origin-top rounded-full bg-accent" style={{ scaleY: fill }} />
          {STOPS.map((stop) => (
            <div key={stop.name} className="absolute left-0 flex -translate-y-1/2 items-center gap-3" style={{ top: `${stop.at * 100}%` }}>
              <span className="size-4 rounded-full border-2 border-separator bg-surface-2" />
              <span className="text-subhead text-fg">{stop.name}</span>
              <span className="font-mono text-caption1 text-fg-subtle tabular-nums">{stop.km} km</span>
            </div>
          ))}
          <motion.span className="absolute left-0 size-4 -translate-y-1/2 rounded-full bg-accent" style={{ top }} />
        </div>
      </div>
    </div>
  );
}

const BEATS = [
  { from: 0, to: 0.34, title: "The scroll moves the train", body: "Each point of the scroll is one point of the line, so the train covers the same distance however fast you scroll." },
  { from: 0.34, to: 0.67, title: "Three cues", body: "Lisbon, Coimbra and Porto pin where the train is. Everything in between is blended from them." },
  { from: 0.67, to: 1, title: "Back is backwards", body: "Scroll up and the train runs back the way it came. Nothing here runs on a timer." },
];

export default function Demo() {
  return (
    <ScrollScene length={3} label="Lisbon to Porto by train" className="w-full" stage={<Route />}>
      {BEATS.map((beat, i) => (
        <ScrollBeat key={beat.title} from={beat.from} to={beat.to} className="items-start pt-16 md:items-center md:pt-12">
          <div className="flex max-w-sm flex-col gap-2">
            <span className="font-mono text-footnote text-accent-ink tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="text-title2 text-fg">{beat.title}</h3>
            <p className="text-body text-fg-muted">{beat.body}</p>
          </div>
        </ScrollBeat>
      ))}
    </ScrollScene>
  );
}
