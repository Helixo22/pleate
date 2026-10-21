// Pricing: plans side by side with a monthly / yearly switch (prices roll to the new amount, the yearly saving is
// shown). The highlighted plan gets an accent ring and a badge. Feature lists mark what's included and what isn't.
// Prices are formatted with Intl for the given currency and locale.
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { CheckIcon, MinusIcon } from "../../lib/icons.tsx";
import { spring } from "../../motion/tokens.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { SegmentedControl } from "../../components/segmented-control/segmented-control.tsx";

export type Billing = "monthly" | "yearly";

export type PricingPlan = {
  id: string;
  name: ReactNode;
  description?: ReactNode;
  /** Price per month for each billing period (yearly = monthly equivalent). null = custom ("Contact us"). */
  price: { monthly: number; yearly: number } | null;
  customPrice?: ReactNode;
  features: (string | { label: ReactNode; included?: boolean; hint?: ReactNode })[];
  cta: ReactNode;
  highlighted?: boolean;
  badge?: ReactNode;
};

export type PricingProps = {
  plans: PricingPlan[];
  currency?: string;
  locale?: string;
  billing?: Billing;
  defaultBilling?: Billing;
  onBillingChange?: (billing: Billing) => void;
  /** Hide the switch when you only sell one period. */
  showToggle?: boolean;
  labels?: { monthly?: string; yearly?: string; perMonth?: string; billedYearly?: string; save?: (pct: number) => string; popular?: string };
  className?: string;
};

function Price({ value, currency, locale }: { value: number; currency: string; locale?: string }) {
  const reduced = useReducedMotion();
  const text = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: value % 1 ? 2 : 0 }).format(value);
  return (
    <span className="relative inline-flex overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          initial={reduced ? { opacity: 0 } : { y: "70%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { y: "-70%", opacity: 0 }}
          transition={spring.soft}
          className="pl-tabular inline-block"
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Pricing({
  plans,
  currency = "EUR",
  locale,
  billing: billingProp,
  defaultBilling = "yearly",
  onBillingChange,
  showToggle = true,
  labels,
  className,
}: PricingProps) {
  const [billingState, setBillingState] = useState<Billing>(defaultBilling);
  const billing = billingProp ?? billingState;
  const l = {
    monthly: "Monthly",
    yearly: "Yearly",
    perMonth: "/ month",
    billedYearly: "billed yearly",
    save: (pct: number) => `Save ${pct}%`,
    popular: "Most popular",
    ...labels,
  };
  const saving = Math.max(
    0,
    ...plans.map((p) => (p.price && p.price.monthly > 0 ? Math.round((1 - p.price.yearly / p.price.monthly) * 100) : 0)),
  );
  const setBilling = (b: Billing) => {
    setBillingState(b);
    onBillingChange?.(b);
  };
  return (
    <div className={cn("flex flex-col items-center gap-10", className)}>
      {showToggle && (
        <div className="flex items-center gap-3">
          <SegmentedControl
            aria-label="Billing period"
            value={billing}
            onValueChange={setBilling}
            options={[
              { value: "monthly", label: l.monthly },
              { value: "yearly", label: l.yearly },
            ]}
          />
          {saving > 0 && <span className="rounded-full bg-success-soft px-2.5 py-1 text-footnote font-semibold text-success-ink">{l.save(saving)}</span>}
        </div>
      )}
      <div className={cn("grid w-full items-stretch gap-4", plans.length === 2 ? "md:grid-cols-2" : plans.length >= 3 ? "md:grid-cols-2 lg:grid-cols-3" : "", plans.length === 4 && "xl:grid-cols-4")}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col gap-6 rounded-3xl bg-surface p-6 md:p-7",
              plan.highlighted ? "shadow-[0_0_0_2px_var(--pl-accent),var(--pl-shadow-lg)]" : "shadow-sm",
            )}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-title3">{plan.name}</h3>
                {(plan.badge || plan.highlighted) && (
                  <span className="rounded-full bg-accent px-2.5 py-1 text-caption1 font-semibold text-on-accent">{plan.badge ?? l.popular}</span>
                )}
              </div>
              {plan.description && <p className="text-subhead text-fg-muted">{plan.description}</p>}
            </div>
            <div className="flex flex-col gap-1">
              {plan.price ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-display-sm">
                      <Price value={plan.price[billing]} currency={currency} locale={locale} />
                    </span>
                    <span className="text-subhead text-fg-muted">{l.perMonth}</span>
                  </div>
                  <span className={cn("text-footnote text-fg-muted transition-opacity", billing === "yearly" && plan.price.yearly > 0 ? "opacity-100" : "opacity-0")}>
                    {l.billedYearly}
                  </span>
                </>
              ) : (
                <span className="text-display-sm">{plan.customPrice ?? "Custom"}</span>
              )}
            </div>
            <div className="[&>*]:w-full">{plan.cta}</div>
            <ul className="flex flex-col gap-3 border-t border-separator pt-6">
              {plan.features.map((f, i) => {
                const item = typeof f === "string" ? { label: f, included: true } : { included: true, ...f };
                return (
                  <li key={i} className={cn("flex items-start gap-2.5 text-subhead", !item.included && "text-fg-subtle")}>
                    <span
                      className={cn(
                        "mt-px grid size-5 shrink-0 place-items-center rounded-full [&_svg]:size-3",
                        item.included ? "bg-accent-soft text-accent-ink" : "bg-fill-2 text-fg-subtle",
                      )}
                    >
                      {item.included ? <CheckIcon strokeWidth={3} /> : <MinusIcon strokeWidth={3} />}
                    </span>
                    <span className="flex flex-col">
                      <span>
                        {item.label}
                        {!item.included && <span className="sr-only"> (not included)</span>}
                      </span>
                      {"hint" in item && item.hint && <span className="text-footnote text-fg-muted">{item.hint}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
