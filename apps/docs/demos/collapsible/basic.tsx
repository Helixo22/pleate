"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "pleate/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "pleate/collapsible";
import { useState } from "react";

const STOPS = [
  { time: "09:10", name: "Santa Apolonia, depart" },
  { time: "10:45", name: "Entroncamento, 4 min" },
  { time: "11:30", name: "Coimbra B, 6 min" },
  { time: "12:55", name: "Porto Campanha, arrive" },
];

function Stops({ stops }: { stops: typeof STOPS }) {
  return (
    <ul className="divide-y divide-separator">
      {stops.map((s) => (
        <li key={s.time} className="flex gap-4 py-2 text-subhead">
          <span className="w-12 text-fg-muted tabular-nums">{s.time}</span>
          <span>{s.name}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mx-auto w-full max-w-sm rounded-lg bg-surface px-4 py-3 shadow-[var(--pl-edge)]">
      <p className="pb-1 text-headline">Lisbon to Porto</p>
      <Stops stops={STOPS.slice(0, 1)} />
      <CollapsibleContent className="border-t border-separator">
        <Stops stops={STOPS.slice(1)} />
      </CollapsibleContent>
      <CollapsibleTrigger asChild>
        <Button variant="plain" size="sm" className="-ms-3 mt-1" endIcon={<ChevronDown className={open ? "rotate-180 transition-transform" : "transition-transform"} />}>
          {open ? "Hide stops" : "Show 3 more stops"}
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
  );
}
