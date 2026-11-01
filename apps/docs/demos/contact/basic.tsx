"use client";

import { Clock, Mail, MapPin } from "lucide-react";
import { ContactForm } from "pleate/marketing/contact";

const INFO = [
  { icon: <Mail />, label: "Email", value: "hello@plate.app" },
  { icon: <Clock />, label: "Hours", value: "Mon to Fri, 9:00 to 18:00 CET" },
  { icon: <MapPin />, label: "Office", value: "Via Tortona 31, Milan" },
];

export default function Demo() {
  return (
    <section className="grid w-full gap-8 rounded-3xl bg-bg p-6 md:grid-cols-[1fr_1.4fr] md:p-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-title1">Talk to the Plate team</h2>
          <p className="text-body text-fg-muted">Questions about plans, partnerships or a recipe that went wrong. We answer within a working day.</p>
        </div>
        {/* An inset grouped list: rows share one surface, hairlines start after the icon. */}
        <ul className="overflow-hidden rounded-2xl bg-surface shadow-[var(--pl-edge)]">
          {INFO.map((item) => (
            <li key={item.label} className="flex items-center gap-3 ps-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-[0.5rem] bg-accent text-on-accent [&_svg]:size-4" aria-hidden="true">
                {item.icon}
              </span>
              <span className="flex min-w-0 flex-1 flex-col border-separator py-3 pe-4 [li+li_&]:border-t">
                <span className="text-footnote text-fg-muted">{item.label}</span>
                <span className="truncate text-body">{item.value}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-surface p-5 shadow-[var(--pl-edge)] md:p-6">
        <ContactForm
          onSubmit={async (values) => {
            if (values.website) return; // a bot filled the honeypot: pretend it worked
            await new Promise((r) => setTimeout(r, 1200)); // your API call
          }}
          footnote="We only use your email to reply to you."
        />
      </div>
    </section>
  );
}
