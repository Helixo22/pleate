import { act, renderHook, waitFor } from "@testing-library/react";
import { isValidElement, type ReactElement } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Plan } from "../api.ts";
import { createTestBackend } from "../test/backend.ts";
import { wrapper } from "../test/wrapper.tsx";
import { useContactForm, useNewsletter, usePricing, useSubscription, useWaitlist } from "./commerce.tsx";

const { db, server } = createTestBackend();
let assign: ReturnType<typeof vi.fn>;
const realLocation = window.location;

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => {
  db.reset();
  assign = vi.fn();
  Object.defineProperty(window, "location", { configurable: true, value: { ...realLocation, assign, href: realLocation.href } });
});
afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: realLocation });
});
afterAll(() => server.close());

describe("usePricing", () => {
  it("maps plans to <Pricing> props with a call to action per plan", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => usePricing(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.pricingProps.plans).toHaveLength(3));
    const { plans, currency, billing, onBillingChange } = result.current.pricingProps;
    expect(currency).toBe("USD");
    expect(billing).toBe("monthly");
    expect(typeof onBillingChange).toBe("function");
    const [free, pro, team] = plans;
    expect(Object.keys(pro).sort()).toEqual(
      ["badge", "cta", "customPrice", "description", "features", "highlighted", "id", "name", "price"].sort(),
    );
    expect(free).toMatchObject({ id: "free", price: { monthly: 0, yearly: 0 }, badge: undefined, customPrice: undefined });
    expect(pro).toMatchObject({ id: "pro", highlighted: true, badge: "Most popular", price: { monthly: 12, yearly: 10 } });
    expect(team.price).toEqual({ monthly: 49, yearly: 39 });
    for (const plan of plans) expect(isValidElement(plan.cta)).toBe(true);
    const freeCta = free.cta as ReactElement<{ children: string; disabled: boolean; variant: string }>;
    const proCta = pro.cta as ReactElement<{ children: string; disabled: boolean; variant: string }>;
    expect(freeCta.props).toMatchObject({ children: "Current plan", disabled: true });
    expect(proCta.props).toMatchObject({ children: "Start free trial", disabled: false, variant: "filled" });
    expect((team.cta as ReactElement<{ variant: string }>).props.variant).toBe("tinted");
    act(() => onBillingChange("yearly"));
    expect(result.current.pricingProps.billing).toBe("yearly");
  });

  it("starts checkout with the chosen interval and goes to the returned URL", async () => {
    const { Wrapper } = wrapper();
    const chooses: Record<string, () => void> = {};
    const { result } = renderHook(
      () =>
        usePricing({
          renderCta: (plan: Plan, state) => {
            chooses[plan.id] = state.choose;
            return <button type="button">{state.current ? "Current" : plan.name}</button>;
          },
        }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.pricingProps.plans).toHaveLength(3));
    act(() => result.current.setBilling("yearly"));
    act(() => chooses.free());
    expect(result.current.checkout.isIdle).toBe(true);
    act(() => chooses.pro());
    await waitFor(() => expect(assign).toHaveBeenCalledWith("#checkout-pro"));
    expect(result.current.checkout.variables).toEqual({ plan: "pro", interval: "year" });
  });

  it("sends signed out visitors to sign in", async () => {
    const { Wrapper } = wrapper();
    const chooses: Record<string, () => void> = {};
    const { result } = renderHook(
      () =>
        usePricing({
          isSignedIn: false,
          signInHref: "/login?next=/pricing",
          renderCta: (plan, state) => {
            chooses[plan.id] = state.choose;
            return null;
          },
        }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.pricingProps.plans).toHaveLength(3));
    act(() => chooses.team());
    expect(assign).toHaveBeenCalledWith("/login?next=/pricing");
    expect(result.current.checkout.isIdle).toBe(true);
  });

  it("opens the billing portal from useSubscription", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useSubscription(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.subscription).toBeNull();
    act(() => result.current.openPortal());
    await waitFor(() => expect(assign).toHaveBeenCalledWith("#billing-portal"));
  });
});

describe("marketing hooks", () => {
  it("useNewsletter subscribes and rethrows errors for <Newsletter>", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useNewsletter({ source: "footer" }), { wrapper: Wrapper });
    await act(() => result.current.newsletterProps.onSubscribe("reader@plate.dev"));
    await waitFor(() => expect(result.current.confirmationRequired).toBe(true));
    expect(db.subscribers).toMatchObject([{ email: "reader@plate.dev", source: "footer", status: "pending" }]);
    await act(async () => {
      await expect(result.current.newsletterProps.onSubscribe("not an email")).rejects.toMatchObject({ code: "validation_error" });
    });
  });

  it("useContactForm switches to sent and back, with field errors", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useContactForm(), { wrapper: Wrapper });
    const values = { name: "Ines", email: "ines@plate.dev", message: "Hi", website: "" };
    await act(() => result.current.contactFormProps.onSubmit(values));
    await waitFor(() => expect(result.current.contactFormProps.fieldErrors).toEqual({ message: "Write at least 10 characters." }));
    expect(result.current.contactFormProps.error).toBeUndefined();
    expect(result.current.contactFormProps.sent).toBe(false);
    await act(() => result.current.contactFormProps.onSubmit({ ...values, message: "Do you ship plates to Spain?" }));
    await waitFor(() => expect(result.current.contactFormProps.sent).toBe(true));
    expect(db.contactMessages).toMatchObject([{ email: "ines@plate.dev", subject: "", status: "new" }]);
    act(() => result.current.contactFormProps.onSentChange(false));
    await waitFor(() => expect(result.current.contactFormProps.sent).toBe(false));
  });

  it("useWaitlist returns the position and referral code", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useWaitlist(), { wrapper: Wrapper });
    let status: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
    await act(async () => {
      status = await result.current.mutateAsync({ email: "early.bird@plate.dev" });
    });
    expect(status).toMatchObject({ position: 3, referrals: 0, invited: false });
    expect(status?.referral_code).toMatch(/^[A-Z0-9]{8}$/);
  });
});
