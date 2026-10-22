import { CreditCard, Luggage, Plane } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "pleate/accordion";

const FAQ = [
  { id: "bags", icon: <Luggage />, q: "How much luggage can I bring?", a: "One cabin bag up to 8 kg and one personal item. Checked bags can be added until 2 hours before departure." },
  { id: "change", icon: <Plane />, q: "Can I change my flight?", a: "Yes, changes are free up to 24 hours before departure; after that a fare difference may apply." },
  { id: "pay", icon: <CreditCard />, q: "Which payment methods are accepted?", a: "Cards, Apple Pay, Google Pay and bank transfer for bookings over €1,000." },
];

export default function Demo() {
  return (
    <div className="grid w-full gap-10 rounded-3xl bg-bg p-4 md:p-6">
      {(["inset", "separated", "plain"] as const).map((variant) => (
        <div key={variant} className="grid gap-2">
          <p className="px-1 text-footnote font-semibold text-fg-muted capitalize">{variant}</p>
          <Accordion type="single" collapsible variant={variant} defaultValue={variant === "inset" ? "bags" : undefined}>
            {FAQ.map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger icon={variant === "plain" ? undefined : f.icon}>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
}
