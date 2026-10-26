"use client";

import { ContactForm } from "pleate/marketing/contact";
import { Newsletter } from "pleate/marketing/cta";
import { useContactForm, useNewsletter } from "pleate-client/react";

export default function MarketingDemo() {
  // POST /api/marketing/newsletter/subscribe (double opt in) and POST /api/marketing/contact.
  const newsletter = useNewsletter({ source: "docs" });
  const contact = useContactForm();

  return (
    <div className="grid w-full gap-6">
      <Newsletter
        {...newsletter.newsletterProps}
        title="The Plate weekly"
        description="Five seasonal recipes every Friday. No spam, unsubscribe in one click."
        successMessage={
          newsletter.confirmationRequired ? "Almost there: check your inbox to confirm." : "You are subscribed."
        }
      />
      <section className="mx-auto grid w-full max-w-2xl gap-6 rounded-[2rem] bg-bg p-6 md:p-10">
        <div className="flex flex-col gap-2">
          <h3 className="text-title2">Talk to the Plate team</h3>
          <p className="text-body text-fg-muted">We answer within a day.</p>
        </div>
        <ContactForm {...contact.contactFormProps} showSubject footnote="We only use your email to reply to you." />
      </section>
    </div>
  );
}
