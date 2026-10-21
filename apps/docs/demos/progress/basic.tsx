"use client";

import { Progress, ProgressCircle } from "pleate/progress";
import { useEffect, useState } from "react";

export default function Demo() {
  const [value, setValue] = useState(18);
  useEffect(() => {
    const id = setInterval(() => setValue((v) => (v >= 100 ? 0 : v + 9)), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="grid w-full max-w-md gap-6">
      <Progress value={value} label="Uploading photos" valueLabel />
      <Progress value={64} size="lg" tone="success" label="Budget used" valueLabel="€640 / €1,000" />
      <Progress value={null} size="sm" aria-label="Syncing" />
      <div className="flex items-center gap-5">
        <ProgressCircle value={value} aria-label="Upload">{value}%</ProgressCircle>
        <ProgressCircle value={72} size={64} thickness={6} tone="success" aria-label="Packing">72%</ProgressCircle>
        <ProgressCircle value={null} size={32} thickness={3} aria-label="Loading" />
      </div>
    </div>
  );
}
