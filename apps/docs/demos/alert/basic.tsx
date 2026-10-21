"use client";

import { Alert } from "pleate/alert";
import { Button } from "pleate/button";
import { useState } from "react";

export default function Demo() {
  const [visible, setVisible] = useState(true);
  return (
    <div className="grid w-full gap-3">
      <Alert tone="info" title="Passport check">Some destinations require 6 months of validity.</Alert>
      <Alert tone="success" title="Booking confirmed">We sent the details to your email.</Alert>
      <Alert
        tone="warning"
        title="Flight delayed"
        actions={
          <>
            <Button size="sm">Rebook</Button>
            <Button size="sm" variant="plain">Details</Button>
          </>
        }
      >
        TP 1234 now departs at 18:40 (+2h).
      </Alert>
      {visible && (
        <Alert tone="danger" variant="surface" title="Payment failed" onDismiss={() => setVisible(false)}>
          Your card was declined. Try another payment method.
        </Alert>
      )}
      <Alert tone="accent" variant="outline">Tip: long-press a place to add it to your trip.</Alert>
    </div>
  );
}
