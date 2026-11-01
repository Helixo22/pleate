"use client";

import { useState } from "react";
import { CurvedInput } from "pleate/effects/curved-input";

export default function Demo() {
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <CurvedInput label="Message" placeholder="Ask anything" onSubmit={(text) => setSent((s) => [text, ...s].slice(0, 3))} />
      <ul className="grid gap-1 text-center text-subhead text-fg-muted">
        {sent.length ? sent.map((text, i) => <li key={i}>{text}</li>) : <li>Type and press Enter.</li>}
      </ul>
    </div>
  );
}
