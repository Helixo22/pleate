"use client";

import { Plus } from "lucide-react";
import { IconButton } from "pleate/icon-button";
import { Input } from "pleate/input";
import { NavigationBar, NavigationBarBack } from "pleate/navigation-bar";
import { useRef } from "react";

export default function Demo() {
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div ref={scroller} className="h-[32rem] w-full max-w-sm overflow-y-auto rounded-[2.5rem] bg-bg shadow-[inset_0_0_0_1px_var(--pl-separator)]">
      <NavigationBar
        largeTitle
        title="Trips"
        scrollContainer={scroller}
        leading={<NavigationBarBack label="Home" />}
        trailing={<IconButton aria-label="New trip" size="sm" variant="plain" icon={<Plus />} />}
        accessory={<Input size="sm" type="search" aria-label="Search trips" placeholder="Search" />}
      />
      <ul className="mx-4 mb-6 overflow-hidden rounded-xl bg-surface">
        {Array.from({ length: 16 }, (_, i) => (
          <li key={i} className="flex h-12 items-center border-b border-separator px-4 text-body last:border-0">
            Trip {i + 1}
          </li>
        ))}
      </ul>
    </div>
  );
}
