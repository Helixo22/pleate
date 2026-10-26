"use client";

import { Pricing } from "pleate/marketing/pricing";
import { usePricing } from "pleate-client/react";
import { useEffect, useState } from "react";

export default function PricingDemo() {
  // Plans from PLEATE["BILLING"]["PLANS"]; choosing a paid plan posts /api/billing/checkout
  // and sends the browser to the Stripe Checkout URL it returns.
  const pricing = usePricing();

  // The mock answers with "#checkout-<plan>" instead of a Stripe URL: show where we would have gone.
  const [checkout, setCheckout] = useState("");
  useEffect(() => {
    const read = () => setCheckout(location.hash.startsWith("#checkout-") ? location.hash.slice(10) : "");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  return (
    <div className="grid w-full gap-4">
      {checkout && (
        <p role="status" className="rounded-2xl bg-success-soft px-4 py-3 text-subhead">
          Redirected to Stripe Checkout for the <strong>{checkout}</strong> plan. In production this is checkout.stripe.com.
        </p>
      )}
      <div className="w-full rounded-3xl bg-bg p-4 md:p-8">
        <Pricing {...pricing.pricingProps} />
      </div>
    </div>
  );
}
