"use client";

import { SmoothScroll } from "pleate/effects/scroll";
import { Switch } from "pleate/switch";
import { useState } from "react";

export default function Demo() {
  const [on, setOn] = useState(false);
  return (
    <div className="flex max-w-md flex-col gap-4">
      <Switch label="Smooth wheel scrolling" description="Applies to this page while it is on" checked={on} onCheckedChange={setOn} />
      <p className="text-subhead text-fg-muted">
        Turn it on and scroll with a mouse wheel. Keyboard, touch screens, zoom and scrollable panels
        keep their native behaviour. It stays off with reduced motion.
      </p>
      {on && <SmoothScroll />}
    </div>
  );
}
