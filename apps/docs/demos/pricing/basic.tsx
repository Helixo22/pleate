import { Button } from "pleate/button";
import { Pricing } from "pleate/marketing/pricing";

export default function Demo() {
  return (
    <div className="w-full rounded-3xl bg-bg p-4 md:p-8">
      <Pricing
        plans={[
          {
            id: "free",
            name: "Explorer",
            description: "For your first trips.",
            price: { monthly: 0, yearly: 0 },
            features: ["Up to 4 travellers", "Shared itinerary", "Offline maps", { label: "AI assistant", included: false }, { label: "Cost splitting", included: false }],
            cta: <Button variant="gray" size="lg">Get started</Button>,
          },
          {
            id: "plus",
            name: "Voyager",
            description: "For friends who travel often.",
            price: { monthly: 6, yearly: 4.5 },
            highlighted: true,
            features: ["Up to 12 travellers", "AI assistant", { label: "Cost splitting", hint: "Any currency, settled in one tap" }, "Price-drop alerts", "Priority support"],
            cta: <Button size="lg">Try 14 days free</Button>,
          },
          {
            id: "team",
            name: "Agency",
            description: "For travel teams and agencies.",
            price: null,
            customPrice: "Let's talk",
            features: ["Unlimited travellers", "Client workspaces", "Custom branding", "SSO & audit log"],
            cta: <Button variant="tinted" size="lg">Contact sales</Button>,
          },
        ]}
      />
    </div>
  );
}
