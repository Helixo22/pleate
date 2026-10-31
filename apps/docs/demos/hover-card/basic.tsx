"use client";

import { Avatar } from "pleate/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "pleate/hover-card";

export default function Demo() {
  return (
    <p className="max-w-sm text-subhead text-fg-muted">
      Planned by{" "}
      <HoverCard>
        <HoverCardTrigger asChild>
          <a href="#marta" className="pl-focus-ring rounded-xs font-medium text-fg underline decoration-border-strong underline-offset-4 hover:decoration-fg">
            Marta Silva
          </a>
        </HoverCardTrigger>
        <HoverCardContent align="start" arrow>
          <div className="flex gap-3">
            <Avatar name="Marta Silva" />
            <div className="grid min-w-0 gap-1">
              <p className="text-subhead font-medium text-fg">Marta Silva</p>
              <p className="text-footnote text-fg-muted">Lives in Lisbon. Plans the food stops and keeps the shared budget.</p>
              <p className="mt-1 font-mono text-caption1 text-fg-subtle">12 trips · since 2023</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>{" "}
      with three travellers, 14 to 18 May.
    </p>
  );
}
