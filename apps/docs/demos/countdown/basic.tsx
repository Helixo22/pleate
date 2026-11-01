"use client";

import { Card } from "pleate/card";
import { Countdown } from "pleate/countdown";
import { List, ListItem, ListSection } from "pleate/list";
import { useState } from "react";

export default function Demo() {
  // Fixed once per mount so the targets do not move on re-render.
  const [now] = useState(() => Date.now());
  return (
    <div className="grid w-full max-w-md gap-6 rounded-xl bg-bg p-4">
      <Card radius="lg">
        <p className="text-subhead text-fg-muted">Lisbon, 12 June</p>
        <Countdown format="d h m" size="lg" to={now + 12 * 86_400_000 + 7 * 3_600_000} />
      </Card>
      <List>
        <ListSection header="Holds">
          <ListItem title="Seats 14A and 14B" subtitle="TP 1351 to Lisbon" trailing={<Countdown to={now + 15 * 60_000} size="sm" />} />
          <ListItem title="Online check-in" subtitle="Opens 48 hours before departure" trailing={<Countdown format="hh:mm:ss" size="sm" to={now + 5 * 3_600_000 + 42 * 60_000} />} />
        </ListSection>
      </List>
    </div>
  );
}
