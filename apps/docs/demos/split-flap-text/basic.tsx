"use client";

import { useState } from "react";
import { Button } from "pleate/button";
import { SplitFlapText } from "pleate/effects/split-flap-text";

const CITIES = ["LISBON 08:45", "KYOTO  11:20", "NAPLES 14:05"];

export default function Demo() {
  const [i, setI] = useState(0);
  return (
    <div className="grid justify-items-center gap-6">
      <SplitFlapText text={CITIES[i]} className="text-title1" />
      <Button variant="gray" onClick={() => setI((i + 1) % CITIES.length)}>
        Next departure
      </Button>
    </div>
  );
}
