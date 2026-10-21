"use client";

import { Reasoning, ReasoningSteps, ShimmerText, type ReasoningStep } from "pleate/ai/reasoning";
import { Button } from "pleate/button";
import { useEffect, useState } from "react";

const LABELS = ["Reading your dates", "Checking flight prices", "Comparing 14 hotels", "Writing the summary"];

export default function Demo() {
  const [step, setStep] = useState(-1);
  useEffect(() => {
    if (step < 0 || step >= LABELS.length) return;
    const id = setTimeout(() => setStep((s) => s + 1), 1100);
    return () => clearTimeout(id);
  }, [step]);
  const steps: ReasoningStep[] = LABELS.map((label, i) => ({
    label,
    status: step < 0 ? "pending" : i < step ? "done" : i === step ? "active" : "pending",
    detail: i === 2 && step > 2 ? "3 match your budget" : undefined,
  }));
  return (
    <div className="grid w-full max-w-xl gap-6">
      <Button className="justify-self-start" onClick={() => setStep(0)} disabled={step >= 0 && step < LABELS.length}>
        {step >= LABELS.length ? "Run again" : "Start"}
      </Button>
      <Reasoning active={step >= 0 && step < LABELS.length}>
        <ReasoningSteps steps={steps} />
      </Reasoning>
      <p className="text-title3"><ShimmerText>Searching the web…</ShimmerText></p>
    </div>
  );
}
