"use client";

import { Bold, Italic, Map, Underline } from "lucide-react";
import { Toggle } from "pleate/toggle-group";

export default function Demo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle icon={<Map />} defaultPressed>
        Show map
      </Toggle>
      <div className="flex gap-1">
        <Toggle size="sm" icon={<Bold />} aria-label="Bold" />
        <Toggle size="sm" icon={<Italic />} aria-label="Italic" />
        <Toggle size="sm" icon={<Underline />} aria-label="Underline" />
      </div>
    </div>
  );
}
