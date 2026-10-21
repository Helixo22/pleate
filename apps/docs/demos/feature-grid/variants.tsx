import { BellRing, CalendarRange, Map, MessageCircle, ShieldCheck, Wallet } from "lucide-react";
import { BotFace } from "pleate/ai/bot-face";
import { FeatureGrid } from "pleate/marketing/feature-grid";

const FEATURES = [
  { icon: <Map />, title: "Shared itineraries", description: "Everyone edits the same plan, live, from any device.", href: "#variants" },
  { icon: <Wallet />, title: "Split costs", description: "Track who paid what and settle up in one tap.", href: "#variants" },
  { icon: <BellRing />, title: "Smart alerts", description: "Gate changes, delays and price drops before you ask." },
  { icon: <CalendarRange />, title: "Calendar sync", description: "Flights and bookings land in your calendar automatically." },
  { icon: <MessageCircle />, title: "Group chat", description: "Decide together without leaving the trip." },
  { icon: <ShieldCheck />, title: "Private by default", description: "Your trips are yours. No ads, no selling data." },
];

export default function Demo() {
  return (
    <div className="grid w-full gap-12 rounded-3xl bg-bg p-4 md:p-6">
      <FeatureGrid features={FEATURES} />
      <FeatureGrid
        variant="bento"
        columns={3}
        features={[
          {
            ...FEATURES[0],
            span: 2,
            rowSpan: 2,
            href: undefined,
            title: "Plan with an assistant",
            description: "Ask for a weekend, get a full plan with sources and a map.",
            media: (
              <div className="grid h-56 place-items-center bg-accent-soft">
                <BotFace size={110} state="thinking" />
              </div>
            ),
          },
          FEATURES[1],
          FEATURES[2],
        ]}
      />
      <FeatureGrid variant="plain" columns={3} features={FEATURES.slice(3)} />
    </div>
  );
}
