import type { ReactNode } from "react";
import { FlipCard } from "pleate/effects/depth";

function Face({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className={dark ? "flex h-full flex-col justify-between rounded-xl bg-fg p-5 text-bg" : "pl-field flex h-full flex-col justify-between rounded-xl bg-surface p-5 [--pl-field-border:var(--pl-separator)]"}>
      {children}
    </div>
  );
}

export default function Demo() {
  return (
    <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
      <FlipCard
        label="Boarding pass, show details"
        className="h-48"
        front={
          <Face>
            <div className="flex justify-between font-mono text-caption1 text-fg-subtle">
              <span>TP 1946</span>
              <span>12 Nov</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="font-mono text-title1">LIS</span>
              <span className="pb-1.5 text-caption1 text-fg-subtle">55 min</span>
              <span className="font-mono text-title1">OPO</span>
            </div>
            <span className="text-caption1 text-fg-subtle">Tap for seat and gate</span>
          </Face>
        }
        back={
          <Face dark>
            <dl className="grid grid-cols-3 gap-y-3 font-mono">
              {[["Gate", "14"], ["Seat", "7C"], ["Group", "2"], ["Boards", "08:35"], ["Departs", "09:05"], ["Bag", "23 kg"]].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-caption2 opacity-60">{k}</dt>
                  <dd className="text-subhead">{v}</dd>
                </div>
              ))}
            </dl>
            <span className="text-caption1 opacity-60">Sofia Rossi</span>
          </Face>
        }
      />
      <FlipCard
        trigger="hover"
        axis="x"
        className="h-48"
        front={
          <Face>
            <span className="text-caption1 text-fg-subtle">Hover or focus</span>
            <span className="text-title2">Alfama rooftop flat</span>
            <span className="font-mono text-caption1 text-fg-muted">€142 / night</span>
          </Face>
        }
        back={
          <Face dark>
            <span className="text-caption1 opacity-60">House rules</span>
            <span className="text-subhead">Check-in from 15:00, quiet after 22:00, no parties.</span>
            <span className="font-mono text-caption1 opacity-60">Free cancellation to 5 Nov</span>
          </Face>
        }
      />
    </div>
  );
}
