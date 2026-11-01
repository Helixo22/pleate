"use client";

import { useState } from "react";
import { AnimatedList } from "pleate/effects/animated-list";

const FILES = ["Q3 report.pdf", "Invoice 2041.pdf", "Team offsite.key", "Logo final v4.svg", "Roadmap.numbers", "Interview notes.md", "Hero shot.heic", "Budget 2027.xlsx", "Contract draft.docx", "Release notes.md", "Moodboard.fig", "Pitch deck.key"];

export default function Demo() {
  const [picked, setPicked] = useState("");
  return (
    <div className="grid w-full max-w-sm gap-3">
      <AnimatedList items={FILES} label="Recent files" onSelect={(file) => setPicked(file)} />
      <p className="text-center text-footnote text-fg-muted">{picked ? `Opened ${picked}` : "Pick a file with the arrow keys and Enter, or click one."}</p>
    </div>
  );
}
