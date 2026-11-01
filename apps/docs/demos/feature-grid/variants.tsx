import { BellRing, CalendarRange, Map, MessageCircle, ShieldCheck, Wallet } from "lucide-react";
import { BotFace } from "pleate/ai/bot-face";
import { FeatureGrid } from "pleate/marketing/feature-grid";

// iOS system colors: each feature keeps its own tint, like an app icon in Settings.
const FEATURES = [
  { icon: <Map />, tint: "#007aff", title: "Shared itineraries", description: "Everyone edits the same plan, live, from any device.", href: "#variants" },
  { icon: <Wallet />, tint: "#34c759", title: "Split costs", description: "Track who paid what and settle up in one tap.", href: "#variants" },
  { icon: <BellRing />, tint: "#ff9500", title: "Gate and price alerts", description: "Hear about a gate change or a cheaper fare before you think to check." },
  { icon: <CalendarRange />, tint: "#ff3b30", title: "Calendar sync", description: "Flights and bookings land in your calendar on their own." },
  { icon: <MessageCircle />, tint: "#5856d6", title: "Trip chat", description: "Vote on the restaurant without leaving the plan." },
  { icon: <ShieldCheck />, tint: "#8e8e93", title: "Private by default", description: "No ads, and your trips are never sold to anyone." },
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
            description: "Ask for a long weekend in Porto. Get trains, two hotels to choose from and a walking map.",
            media: (
              <div className="grid h-56 place-items-center">
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
