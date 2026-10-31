"use client";

import { Banner } from "pleate/banner";
import { Button } from "pleate/button";
import { useState } from "react";

const Info = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.25" />
    <path d="M12 8h.01M11 12h1v5h1" />
  </svg>
);

export default function Demo() {
  const [key, setKey] = useState(0);
  return (
    <div className="grid w-full gap-3">
      <div className="pl-field overflow-hidden rounded-md p-px">
        <Banner
          key={key}
          tone="accent"
          icon={Info}
          aria-label="Product update"
          dismissible
          action={
            <Button size="xs" variant="surface" tone="neutral">
              See routes
            </Button>
          }
        >
          Direct trains from Lisbon to Porto are now bookable in the app.
        </Banner>
        <div className="px-4 py-6 text-footnote text-fg-muted">Your trips</div>
      </div>
      <Button size="sm" variant="plain" tone="neutral" className="justify-self-start" onClick={() => setKey((k) => k + 1)}>
        Show again
      </Button>
    </div>
  );
}
