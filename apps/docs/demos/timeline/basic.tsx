import { BedDouble, Plane, Utensils } from "lucide-react";
import { Badge } from "pleate/badge";
import { Timeline, TimelineItem } from "pleate/timeline";

export default function Demo() {
  return (
    <div className="grid w-full gap-10 md:grid-cols-2">
      <Timeline>
        <TimelineItem status="done" time="Booked · 2 May" title="Booking confirmed" description="Confirmation HT-2041 sent to your email." />
        <TimelineItem status="done" time="Paid · 3 May" title="Payment received" description="€384 charged to Visa •• 4242." />
        <TimelineItem status="current" time="Today" title="Check-in opens" description="Online check-in is open until 2 h before departure.">
          <Badge tone="accent">Action needed</Badge>
        </TimelineItem>
        <TimelineItem status="upcoming" time="12 June" title="Departure" />
      </Timeline>
      <Timeline>
        <TimelineItem status="done" tone="success" icon={<Plane />} time="09:40" title="Land in Lisbon" />
        <TimelineItem status="done" tone="success" icon={<BedDouble />} time="11:30" title="Check in at Alfama flat" />
        <TimelineItem status="current" icon={<Utensils />} time="13:00" title="Lunch at Time Out Market" description="Table for 4 under “Rossi”." />
        <TimelineItem status="upcoming" time="16:00" title="Tram 28 to Graça" />
      </Timeline>
    </div>
  );
}
