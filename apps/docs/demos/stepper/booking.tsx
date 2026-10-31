"use client";

import { Button } from "pleate/button";
import { Stepper } from "pleate/stepper";
import { useState } from "react";

const STEPS = [
  { id: "dates", label: "Dates" },
  { id: "guests", label: "Guests" },
  { id: "payment", label: "Payment" },
  { id: "confirm", label: "Confirm" },
];

export default function Demo() {
  const [step, setStep] = useState(1);
  return (
    <div className="grid w-full max-w-xl gap-6">
      <Stepper aria-label="Booking progress" steps={STEPS} current={step} onStepClick={(i) => setStep(i)} />
      <div className="flex justify-end gap-2">
        <Button variant="outline" tone="neutral" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        <Button size="sm" disabled={step === STEPS.length} onClick={() => setStep((s) => s + 1)}>
          {step >= STEPS.length - 1 ? "Book" : "Next"}
        </Button>
      </div>
    </div>
  );
}
