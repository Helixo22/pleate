"use client";

import { PageTransition } from "pleate/effects/page-transition";
import { SegmentedControl } from "pleate/segmented-control";
import { useState } from "react";

const PAGES = ["Lisbon", "Kyoto", "Naples"];

export default function Demo() {
  const [variant, setVariant] = useState<"fade" | "fade-up" | "slide">("slide");
  const [page, setPage] = useState(0);
  return (
    <div className="grid w-full max-w-md gap-4">
      <SegmentedControl
        aria-label="Transition"
        value={variant}
        onValueChange={setVariant}
        fullWidth
        options={[
          { value: "fade", label: "Fade" },
          { value: "fade-up", label: "Fade up" },
          { value: "slide", label: "Slide" },
        ]}
      />
      <div className="h-56 overflow-hidden rounded-2xl bg-fill-3">
        {/* In an app this sits in app/template.tsx; here a key change stands in for a navigation. */}
        <PageTransition key={`${variant}-${page}`} variant={variant} className="grid h-full place-items-center">
          <div className="text-center">
            <p className="text-display-sm">{PAGES[page]}</p>
            <button
              type="button"
              onClick={() => setPage((p) => (p + 1) % PAGES.length)}
              className="pl-focus-ring mt-3 cursor-pointer rounded-full bg-accent px-4 py-2 text-subhead font-semibold text-on-accent"
            >
              Next page →
            </button>
          </div>
        </PageTransition>
      </div>
    </div>
  );
}
