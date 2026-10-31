"use client";

import { CreditCard, Landmark, ShoppingBag } from "lucide-react";
import { Button } from "pleate/button";
import { FlowLine, Odometer } from "pleate/effects/motion-graphics";
import { useEffect, useState, type ReactNode } from "react";

function Node({ icon, name, meta }: { icon: ReactNode; name: string; meta: string }) {
  return (
    <div className="pl-field flex w-32 shrink-0 flex-col gap-2 rounded-lg bg-surface p-3 [--pl-field-border:var(--pl-separator)]">
      <span className="text-fg-subtle [&_svg]:size-4">{icon}</span>
      <span className="text-subhead font-medium">{name}</span>
      <span className="font-mono text-caption1 text-fg-subtle">{meta}</span>
    </div>
  );
}

const Link = ({ paused }: { paused: boolean }) => (
  <FlowLine d="M2 6H118" viewBox="0 0 120 12" paused={paused} className="h-3 w-full min-w-10" />
);

export default function Demo() {
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1284);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setRate((r) => r + Math.round(Math.sin(Date.now() / 900) * 40)), 1600);
    return () => clearInterval(id);
  }, [paused]);
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center overflow-x-auto pb-1">
        <Node icon={<ShoppingBag />} name="Checkout" meta="eu-west-1" />
        <Link paused={paused} />
        <Node icon={<CreditCard />} name="Payments" meta="stripe" />
        <Link paused={paused} />
        <Node icon={<Landmark />} name="Ledger" meta="postgres" />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-caption1 text-fg-subtle">Bookings per hour</p>
          <Odometer value={rate} className="text-title1 font-medium" />
        </div>
        <Button variant="surface" tone="neutral" size="sm" onClick={() => setPaused((p) => !p)}>
          {paused ? "Resume" : "Pause"}
        </Button>
      </div>
    </div>
  );
}
