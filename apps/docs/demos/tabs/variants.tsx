import { Tabs, TabsContent, TabsList, TabsTrigger } from "pleate/tabs";

const TABS = [
  { value: "overview", label: "Overview", text: "Three nights in Alfama with a rooftop over the river." },
  { value: "itinerary", label: "Itinerary", text: "Day 1: Belém. Day 2: Sintra. Day 3: Alfama and fado." },
  { value: "budget", label: "Budget", text: "€480 per person, flights excluded." },
  { value: "notes", label: "Notes", text: "Bring comfortable shoes: Lisbon is all hills." },
];

export default function Demo() {
  return (
    <div className="grid w-full gap-10">
      {(["underline", "pill", "soft"] as const).map((variant) => (
        <Tabs key={variant} defaultValue="overview" variant={variant}>
          <TabsList aria-label={`${variant} tabs`}>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value} className="text-body text-fg-muted">
              {t.text}
            </TabsContent>
          ))}
        </Tabs>
      ))}
    </div>
  );
}
