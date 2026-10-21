"use client";

import { Bike, Bus, Car, Footprints, TrainFront } from "lucide-react";
import { BottomSheet } from "pleate/bottom-sheet";
import { Button } from "pleate/button";
import { useState } from "react";

const ROUTES = [
  { icon: <TrainFront />, name: "Train", time: "38 min", price: "€4.20" },
  { icon: <Bus />, name: "Bus", time: "52 min", price: "€2.10" },
  { icon: <Car />, name: "Taxi", time: "24 min", price: "€28" },
  { icon: <Bike />, name: "Bike", time: "1 h 05", price: "€3" },
  { icon: <Footprints />, name: "Walk", time: "2 h 40", price: "Free" },
];

export default function Demo() {
  const [open, setOpen] = useState(false);
  const [simple, setSimple] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Directions (snap points)</Button>
      <Button variant="tinted" onClick={() => setSimple(true)}>Simple sheet</Button>

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="To Sintra"
        description="Drag the handle: half, or almost full screen."
        snapPoints={[0.45, 0.9]}
        showClose
        footer={<Button fullWidth size="lg" onClick={() => setOpen(false)}>Start</Button>}
      >
        <ul className="grid gap-2">
          {[...ROUTES, ...ROUTES].map((route, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl bg-fill-3 p-3">
              <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent-ink [&_svg]:size-5">{route.icon}</span>
              <span className="flex-1 text-body">{route.name}</span>
              <span className="text-subhead text-fg-muted">{route.time}</span>
              <span className="w-14 text-end text-subhead font-semibold">{route.price}</span>
            </li>
          ))}
        </ul>
      </BottomSheet>

      <BottomSheet open={simple} onOpenChange={setSimple} title="Share trip" snapPoints={[0.4]}>
        <p className="text-body text-fg-muted">A single snap point. Flick down or tap outside to close.</p>
      </BottomSheet>
    </>
  );
}
