"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "pleate/button";
import { toast } from "pleate/toast";
import { useState } from "react";

import type { Plan } from "../api.ts";
import { errorProps, mapFields } from "./forms.ts";
import { keys, usePleateClient } from "./provider.tsx";

type Billing = "monthly" | "yearly";

/**
 * Plans from the backend and Stripe Checkout, for <Pricing>.
 *
 *     const pricing = usePricing({ signInHref: "/login?next=/pricing" });
 *     <Pricing {...pricing.pricingProps} />
 */
export function usePricing(
  options: {
    /** Where to send signed out visitors who pick a paid plan. */
    signInHref?: string;
    isSignedIn?: boolean;
    /** Replace the default call to action button. */
    renderCta?: (plan: Plan, state: { loading: boolean; current: boolean; choose: () => void }) => React.ReactNode;
    labels?: { current?: string; free?: string };
  } = {},
) {
  const client = usePleateClient();
  const [billing, setBilling] = useState<Billing>("monthly");
  const plans = useQuery({ queryKey: keys.plans, queryFn: client.billing.plans, staleTime: 5 * 60_000 });
  const checkout = useMutation({
    mutationFn: ({ plan, interval }: { plan: string; interval: "month" | "year" }) =>
      client.billing.checkout(plan, interval),
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
    onError: (error) => toast(errorProps(error).error ?? "Checkout failed.", { tone: "error" }),
  });
  const portal = useMutation({
    mutationFn: client.billing.portal,
    onSuccess: ({ url }) => window.location.assign(url),
  });

  const choose = (plan: Plan) => {
    const paid = plan.price && (plan.price.monthly > 0 || plan.price.yearly > 0);
    if (!paid) return;
    if (options.isSignedIn === false && options.signInHref) {
      window.location.assign(options.signInHref);
      return;
    }
    checkout.mutate({ plan: plan.id, interval: billing === "yearly" ? "year" : "month" });
  };

  const data = plans.data;
  return {
    ...plans,
    billing,
    setBilling,
    checkout,
    portal,
    pricingProps: {
      plans: (data?.plans ?? []).map((plan) => {
        const loading = checkout.isPending && checkout.variables?.plan === plan.id;
        const current = plan.current;
        return {
          id: plan.id,
          name: plan.name,
          description: plan.description ?? undefined,
          price: plan.price,
          customPrice: plan.custom_price ?? undefined,
          features: plan.features,
          highlighted: plan.highlighted,
          badge: plan.badge ?? undefined,
          cta: options.renderCta ? (
            options.renderCta(plan, { loading, current, choose: () => choose(plan) })
          ) : (
            <Button
              variant={plan.highlighted ? "filled" : "tinted"}
              loading={loading}
              disabled={current || checkout.isPending}
              onClick={() => choose(plan)}
            >
              {current ? (options.labels?.current ?? "Current plan") : (plan.cta ?? "Choose")}
            </Button>
          ),
        };
      }),
      currency: data?.currency,
      billing,
      onBillingChange: setBilling,
    },
  };
}

export function useSubscription() {
  const client = usePleateClient();
  const query = useQuery({ queryKey: keys.subscription, queryFn: client.billing.subscription });
  const portal = useMutation({
    mutationFn: client.billing.portal,
    onSuccess: ({ url }) => window.location.assign(url),
  });
  return { ...query, subscription: query.data?.subscription ?? null, openPortal: () => portal.mutate(), portal };
}

/** `onSubscribe` for <Newsletter>. Errors become a toast (Newsletter itself stays quiet). */
export function useNewsletter(options: { source?: string } = {}) {
  const client = usePleateClient();
  const mutation = useMutation({
    mutationFn: (email: string) => client.marketing.subscribe(email, options.source),
  });
  return {
    ...mutation,
    confirmationRequired: mutation.data?.confirmation_required ?? false,
    newsletterProps: {
      onSubscribe: async (email: string) => {
        try {
          await mutation.mutateAsync(email);
        } catch (error) {
          toast(errorProps(error).error ?? "Could not subscribe.", { tone: "error" });
          throw error;
        }
      },
    },
  };
}

/** Everything <ContactForm> needs. */
export function useContactForm() {
  const client = usePleateClient();
  const mutation = useMutation({ mutationFn: client.marketing.contact });
  return {
    ...mutation,
    contactFormProps: {
      onSubmit: async (values: { name: string; email: string; subject?: string; message: string; website: string }) => {
        await mutation.mutateAsync({ ...values, subject: values.subject ?? "" }).catch(() => {});
      },
      loading: mutation.isPending,
      sent: mutation.isSuccess,
      onSentChange: (sent: boolean) => {
        if (!sent) mutation.reset();
      },
      ...mapFields(errorProps(mutation.error), {}),
    },
  };
}

/** Waitlist with referral codes. */
export function useWaitlist() {
  const client = usePleateClient();
  return useMutation({ mutationFn: ({ email, ref }: { email: string; ref?: string }) => client.marketing.joinWaitlist(email, ref) });
}
