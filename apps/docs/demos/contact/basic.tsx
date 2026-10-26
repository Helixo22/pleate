"use client";

import { ContactForm } from "pleate/marketing/contact";

export default function Demo() {
  return (
    <section className="mx-auto grid w-full max-w-2xl gap-6 rounded-[2rem] bg-bg p-6 md:p-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-title1">Talk to the Plate team</h2>
        <p className="text-body text-fg-muted">Questions about plans, partnerships or a recipe that went wrong. We answer within a day.</p>
      </div>
      <ContactForm
        onSubmit={async (values) => {
          if (values.website) return; // a bot filled the honeypot: pretend it worked
          await new Promise((r) => setTimeout(r, 1200)); // your API call
        }}
        footnote="We only use your email to reply to you."
      />
    </section>
  );
}
