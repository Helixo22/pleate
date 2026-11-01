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
        <p className="px-1 pb-2 text-footnote text-fg-muted">Leave now, arrive by 11:40</p>
        <ul className="overflow-hidden rounded-xl bg-fill-3">
          {[...ROUTES, ...ROUTES].map((route, i) => (
            <li key={i} className="flex min-h-14 items-center gap-3 ps-3">
              <span className="grid size-8 place-items-center rounded-md bg-accent text-on-accent [&_svg]:size-4.5">{route.icon}</span>
              <span className="flex flex-1 items-center gap-3 self-stretch border-b border-fg/10 pe-4 in-[li:last-child]:border-0">
                <span className="flex-1 text-body">{route.name}</span>
                <span className="text-subhead text-fg-muted pl-tabular">{route.time}</span>
                <span className="w-14 text-end text-body pl-tabular">{route.price}</span>
              </span>
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
