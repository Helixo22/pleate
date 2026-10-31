"use client";

import { Button } from "pleate/button";
import { Countdown } from "pleate/countdown";
import { useState } from "react";

export default function Demo() {
  const [to, setTo] = useState(() => Date.now() + 10_000);
  const [expired, setExpired] = useState(false);
  return (
    <div className="grid justify-items-start gap-3">
      <Countdown label="Fare locked for" to={to} announce onComplete={() => setExpired(true)} />
      <p className="text-footnote text-fg-muted">{expired ? "The fare hold ended. Prices may have changed." : "Book before the hold ends to keep €148."}</p>
      <Button
        size="sm"
        variant="surface"
        tone="neutral"
        onClick={() => {
          setExpired(false);
          setTo(Date.now() + 10_000);
        }}
      >
        Hold again
      </Button>
    </div>
  );
}
