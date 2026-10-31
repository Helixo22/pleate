"use client";

import { Kbd } from "pleate/kbd";

export default function Demo() {
  return (
    <div className="grid gap-5 text-subhead text-fg-muted">
      <div className="flex flex-wrap items-center gap-3">
        <Kbd keys="mod+k" />
        <Kbd keys="shift+?" />
        <Kbd keys={["mod", "shift", "p"]} />
        <Kbd keys="esc" size="md" />
        <Kbd keys="enter" size="md" />
      </div>
      <p>
        Press <Kbd keys="mod+k" /> to search trips, or <Kbd keys="n" /> to start a new one.
      </p>
    </div>
  );
}
