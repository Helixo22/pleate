"use client";

import { Button } from "pleate/button";
import { PixelArt, PixelFrame, PixelSteps } from "pleate/effects/pixel-art";
import { pixelDrawing } from "pleate/effects/pixel-gallery";
import { useState } from "react";

const STEPS = ["Seeds", "Harvest", "Roast", "Cup"];

export default function Demo() {
  const [step, setStep] = useState(1);
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-wrap items-center justify-center gap-5">
        <PixelFrame>
          <Button size="lg">Order coffee</Button>
        </PixelFrame>
        <PixelFrame>
          <Button size="lg" variant="filled" tone="neutral" className="bg-surface text-fg">
            Opening hours
          </Button>
        </PixelFrame>
        <PixelFrame shadow={6} step={4}>
          <span className="block bg-surface p-4">
            <PixelArt art={pixelDrawing("donut")} label="A donut" className="size-20" />
          </span>
        </PixelFrame>
      </div>
      <div className="flex flex-col items-center gap-2">
        <PixelSteps steps={STEPS} current={step} onSelect={setStep} label="From seed to cup" />
        <p className="text-subhead text-fg-muted" aria-live="polite">{STEPS[step]}</p>
      </div>
    </div>
  );
}
