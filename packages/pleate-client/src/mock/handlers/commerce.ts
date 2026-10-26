import type { Plans } from "../../api.ts";
import { activeSubscription, type MockDb, type MockPlanConfig, type MockUser, VALID_TOKEN } from "../db.ts";
import type { Router } from "../router.ts";
import { fail, json, notFound, pub, Validator } from "../util.ts";

const major = (cents: number) => {
  const value = Math.round(cents) / 100;
  return Number.isInteger(value) ? value : Math.round(value * 100) / 100;
};

function isFree(plan: MockPlanConfig) {
  return !plan.custom_price && !plan.prices?.month && !plan.prices?.year;
}

/** billing.services.plans_payload */
export function plansPayload(db: MockDb, user: MockUser | null): Plans {
  const current = user
    ? (activeSubscription(db, user.id)?.plan_id ?? db.plans.find(isFree)?.id ?? null)
    : null;
  return {
    currency: "USD",
    trial_days: 14,
    current_plan: current,
    plans: db.plans.map((plan) => {
      const month = plan.prices?.month ?? null;
      const year = plan.prices?.year ?? null;
      let price: { monthly: number; yearly: number } | null;
      if (plan.custom_price) price = null;
      else if (month === null && year === null) price = { monthly: 0, yearly: 0 };
      else {
        const monthly = month !== null ? major(month) : null;
        const yearly = year !== null ? major(year / 12) : null;
        price = { monthly: monthly ?? yearly ?? 0, yearly: yearly ?? monthly ?? 0 };
      }
      return {
        id: plan.id,
        name: plan.name,
        description: plan.description ?? null,
        features: plan.features,
        highlighted: !!plan.highlighted,
        badge: plan.badge ?? null,
        cta: plan.cta ?? null,
        price,
        custom_price: plan.custom_price ?? null,
        amounts: { month, year },
        intervals: (["month", "year"] as const).filter((i) => plan.prices?.[i]),
        current: current !== null && plan.id === current,
      };
    }),
  };
}

function waitlistStatus(db: MockDb, entry: MockDb["waitlist"][number]) {
  const referrals = db.waitlist.filter((e) => e.referred_by === entry.id).length;
  if (entry.invited_at) return { position: 0, referral_code: entry.referral_code, referrals, invited: true };
  const rank = 1 + db.waitlist.filter((e) => !e.invited_at && e.created_at < entry.created_at).length;
  return { position: Math.max(1, rank - 5 * referrals), referral_code: entry.referral_code, referrals, invited: false };
}

export function commerceRoutes(r: Router) {
  // Billing
  r.get("/billing/plans", ({ db }) => json(plansPayload(db, db.currentUser())), "public");
  r.get("/billing/subscription", ({ db, user }) => {
    const sub =
      activeSubscription(db, user.id) ??
      db.subscriptions.filter((s) => s._owner === user.id).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
    return json({ subscription: sub ? pub(sub) : null });
  });
  r.post("/billing/checkout", async ({ db, user, body }) => {
    const data = await body();
    const v = new Validator(data);
    const planId = v.required("plan");
    const interval = v.required("interval");
    if (interval && !["month", "year"].includes(interval)) v.add("interval", "invalid_choice", `"${interval}" is not a valid choice.`);
    v.throwIfAny();
    const plan = db.plans.find((p) => p.id === planId);
    if (!plan || isFree(plan) || !plan.prices?.[interval as "month" | "year"]) {
      throw fail(400, "invalid_plan", "This plan cannot be bought.");
    }
    if (activeSubscription(db, user.id)) {
      throw fail(409, "already_subscribed", "You already have a subscription. Change it from the billing portal.");
    }
    return json({ url: `#checkout-${plan.id}` });
  });
  r.post("/billing/portal", () => json({ url: "#billing-portal" }));

  // Marketing
  r.post(
    "/marketing/newsletter/subscribe",
    async ({ db, body }) => {
      const data = await body();
      const v = new Validator(data);
      const email = v.email("email");
      v.throwIfAny();
      if (!db.subscribers.some((s) => s.email === email)) {
        db.subscribers.push({
          id: db.id(),
          email: email!,
          status: "pending",
          source: String(data.source ?? ""),
          created_at: new Date().toISOString(),
        });
      }
      return json({ confirmation_required: true }, 202);
    },
    "public",
  );
  for (const action of ["confirm", "unsubscribe"] as const) {
    r.post(
      `/marketing/newsletter/${action}`,
      async ({ db, body }) => {
        const v = new Validator(await body());
        const token = v.required("token");
        v.throwIfAny();
        if (token !== VALID_TOKEN) throw fail(400, "invalid_token", "This link is not valid anymore.");
        const email = db.subscribers[0]?.email ?? "ada@plate.dev";
        return json({ email, status: action === "confirm" ? "subscribed" : "unsubscribed" });
      },
      "public",
    );
  }
  r.post(
    "/marketing/contact",
    async ({ db, body }) => {
      const data = await body();
      const v = new Validator(data);
      const name = v.required("name");
      const email = v.email("email");
      const message = v.required("message");
      if (name && name.length > 150) v.add("name", "max_length", "Ensure this field has no more than 150 characters.");
      if (message !== undefined && message.length < 10) v.add("message", "min_length", "Write at least 10 characters.");
      if (message !== undefined && message.length > 5000) v.add("message", "max_length", "Keep it under 5000 characters.");
      v.throwIfAny();
      db.contactMessages.push({
        id: db.id(),
        name: name!,
        email: email!,
        subject: String(data.subject ?? ""),
        message: message!,
        status: data.website ? "spam" : "new",
        created_at: new Date().toISOString(),
      });
      return json({ received: true }, 201);
    },
    "public",
  );
  r.post(
    "/marketing/waitlist",
    async ({ db, body }) => {
      const data = await body();
      const v = new Validator(data);
      const email = v.email("email");
      v.throwIfAny();
      let entry = db.waitlist.find((e) => e.email === email);
      if (!entry) {
        const referrer = data.ref ? db.waitlist.find((e) => e.referral_code === String(data.ref)) : undefined;
        entry = {
          id: db.id(),
          email: email!,
          referral_code: db.random.chars(8, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"),
          referred_by: referrer?.id ?? null,
          created_at: new Date().toISOString(),
          invited_at: null,
        };
        db.waitlist.push(entry);
      }
      return json(waitlistStatus(db, entry));
    },
    "public",
  );
  r.get(
    "/marketing/waitlist/:code",
    ({ db, params }) => {
      const entry = db.waitlist.find((e) => e.referral_code === params.code);
      if (!entry) throw notFound();
      const { position, referrals } = waitlistStatus(db, entry);
      return json({ position, referrals });
    },
    "public",
  );
}
