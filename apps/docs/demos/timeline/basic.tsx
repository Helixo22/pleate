import { BedDouble, Plane, Utensils } from "lucide-react";
import { Button } from "pleate/button";
import { Card } from "pleate/card";
import { Timeline, TimelineItem } from "pleate/timeline";

export default function Demo() {
  return (
    <div className="grid w-full gap-4 rounded-xl bg-bg p-4 md:grid-cols-2">
      <Card radius="lg">
        <p className="text-footnote text-fg-muted">Booking HT-2041</p>
        <Timeline>
          <TimelineItem status="done" time="2 May" title="Booking confirmed" description="Confirmation sent to sofia@rossi.it" />
          <TimelineItem status="done" time="3 May" title="Payment received" description="€384 charged to Visa ending 4242" />
          <TimelineItem status="current" time="Today" title="Check-in opens" description="Open until 2 hours before departure">
            <Button size="sm">Check in</Button>
          </TimelineItem>
          <TimelineItem status="upcoming" time="12 June" title="Departure" />
        </Timeline>
      </Card>
      <Card radius="lg">
        <p className="text-footnote text-fg-muted">Saturday in Lisbon</p>
        <Timeline>
          <TimelineItem status="done" tone="success" icon={<Plane />} time="09:40" title="Land in Lisbon" />
          <TimelineItem status="done" tone="success" icon={<BedDouble />} time="11:30" title="Check in at Alfama flat" />
          <TimelineItem status="current" icon={<Utensils />} time="13:00" title="Lunch at Time Out Market" description="Table for 4 under Rossi" />
          <TimelineItem status="upcoming" time="16:00" title="Tram 28 to Graça" />
        </Timeline>
      </Card>
    </div>
  );
}
