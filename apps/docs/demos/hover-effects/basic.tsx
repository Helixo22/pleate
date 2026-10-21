import { ArrowRight, Mountain } from "lucide-react";
import { ClickSpark, Magnet, Spotlight, Tilt } from "pleate/effects/hover";
import { Button } from "pleate/button";

export default function Demo() {
  return (
    <div className="grid w-full gap-6 md:grid-cols-2">
      <Spotlight className="grid h-56 place-items-center rounded-3xl bg-surface p-6 text-center shadow-sm">
        <div>
          <p className="text-title2">Spotlight</p>
          <p className="text-subhead text-fg-muted">Move the pointer across the card.</p>
        </div>
      </Spotlight>
      <Tilt className="h-56 rounded-3xl">
        <div className="flex h-full flex-col justify-end rounded-3xl bg-[linear-gradient(135deg,var(--pl-accent-400),var(--pl-accent-800))] p-6 shadow-lg text-accent-50">
          <Mountain className="mb-auto size-8" />
          <p className="text-title2">Dolomites</p>
          <p className="text-subhead opacity-80">Tilt with glare</p>
        </div>
      </Tilt>
      <div className="grid h-40 place-items-center rounded-3xl bg-fill-3">
        <Magnet>
          <Button size="lg" endIcon={<ArrowRight />}>Magnetic button</Button>
        </Magnet>
      </div>
      <ClickSpark className="grid h-40 cursor-pointer place-items-center rounded-3xl bg-fill-3 text-headline select-none">
        Click anywhere here
      </ClickSpark>
    </div>
  );
}
