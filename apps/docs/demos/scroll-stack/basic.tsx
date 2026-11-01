import { ScrollStack, ScrollStackCard } from "pleate/effects/scroll-stack";

const cards = [
  { title: "Plan", text: "Write down what done looks like.", tone: "bg-surface" },
  { title: "Build", text: "Ship the smallest thing that works.", tone: "bg-accent text-on-accent" },
  { title: "Measure", text: "Watch real people use it.", tone: "bg-surface" },
  { title: "Learn", text: "Keep what worked, drop the rest.", tone: "bg-fg text-bg" },
];

export default function Demo() {
  return (
    <ScrollStack className="w-full max-w-xl bg-fill-3" aria-label="Process">
      {cards.map((c, i) => (
        <ScrollStackCard key={c.title} className={c.tone}>
          <p className="text-footnote opacity-70">Step {i + 1}</p>
          <p className="mt-2 text-title1">{c.title}</p>
          <p className="mt-1 text-body opacity-80">{c.text}</p>
        </ScrollStackCard>
      ))}
    </ScrollStack>
  );
}
