import { MagicBento, MagicBentoCard } from "pleate/effects/magic-bento";

const cards = [
  { label: "Insights", title: "Analytics", text: "Track what users do, live.", span: "lg:col-span-2 lg:row-span-2" },
  { label: "Overview", title: "Dashboard", text: "One place for every number." },
  { label: "Teamwork", title: "Collaboration", text: "Work on the same file at once." },
  { label: "Efficiency", title: "Automation", text: "Hand the busywork to rules.", span: "lg:col-span-2" },
  { label: "Connect", title: "Integrations", text: "Plug in the tools you use." },
  { label: "Protection", title: "Security", text: "SSO, audit logs and roles." },
];

export default function Demo() {
  return (
    <MagicBento tilt={4} className="w-full">
      {cards.map((c) => (
        <MagicBentoCard key={c.title} className={c.span}>
          <p className="text-footnote text-fg-muted">{c.label}</p>
          <p className="mt-auto text-title3">{c.title}</p>
          <p className="text-subhead text-fg-muted">{c.text}</p>
        </MagicBentoCard>
      ))}
    </MagicBento>
  );
}
