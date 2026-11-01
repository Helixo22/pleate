"use client";

import { Button } from "pleate/button";
import { Card } from "pleate/card";
import { Countdown } from "pleate/countdown";
import { useState } from "react";

export default function Demo() {
  const [to, setTo] = useState(() => Date.now() + 10_000);
  const [expired, setExpired] = useState(false);
  return (
    <div className="w-full max-w-md rounded-xl bg-bg p-4">
      <Card radius="lg" className="items-start">
        <Countdown label="Fare locked for" to={to} announce onComplete={() => setExpired(true)} />
        <p className="text-subhead text-fg-muted">{expired ? "The fare hold ended. Prices may have changed." : "Book before the hold ends to keep €148."}</p>
        <Button
          size="sm"
          variant={expired ? "filled" : "gray"}
          onClick={() => {
            setExpired(false);
            setTo(Date.now() + 10_000);
          }}
        >
          Hold again
        </Button>
      </Card>
    </div>
  );
}
