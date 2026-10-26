"""
Subscriptions with Stripe Checkout, the Stripe billing portal and webhooks.
Backs the pleate ``Pricing`` component. Mounted at ``/api/billing/``.

Endpoints:

    GET  plans          anyone      {currency, trial_days, current_plan, plans: [Plan]}
        Each Plan maps 1:1 onto ``PricingPlan``: {id, name, description,
        features, highlighted, badge, cta, price: {monthly, yearly} | null,
        custom_price, amounts: {month, year}, intervals, current}. ``price``
        is per month in major units (yearly = monthly equivalent), ``amounts``
        are the raw minor unit charges. ``current_plan`` is the plan of the
        active subscription, else the free plan, for signed in users.
    GET  subscription   signed in   {subscription: Subscription | null}
        The active subscription, else the most recent one.
    POST checkout       signed in   {plan, interval: month|year} -> {url}
        Stripe Checkout in subscription mode. Errors: invalid_plan (400),
        billing_not_configured (503), already_subscribed (409), billing_error (502).
    POST portal         signed in   -> {url}. Errors: no_customer (400).
    POST webhook        Stripe      raw event, ``Stripe-Signature`` header -> {received, duplicate}
        Errors: invalid_signature (400). Each event id is applied once.
        Handles checkout.session.completed, customer.subscription.created,
        customer.subscription.updated, customer.subscription.deleted,
        invoice.payment_failed (notification ``billing.payment_failed`` when
        the notifications app is installed) and invoice.paid.

Settings (``PLEATE["BILLING"]``):

    STRIPE_SECRET_KEY       None
    STRIPE_WEBHOOK_SECRET   None    "whsec_..."
    CURRENCY                "usd"
    TRIAL_DAYS              0
    PLANS                   []
        [{"id": "pro", "name": "Pro", "description": "...",
          "features": ["...", {"label": "...", "included": False, "hint": "..."}],
          "highlighted": True, "badge": None, "cta": "Start free trial",
          "prices": {"month": {"price_id": "price_...", "amount": 900},
                     "year": {"price_id": "price_...", "amount": 9000}}}]
        ``amount`` in minor units. A plan without prices is free; set
        ``"custom": True`` or ``"custom_price": "Contact us"`` for sales led plans.

Frontend paths: BILLING_SUCCESS (gets ``?session_id=``), BILLING_CANCEL and the
optional BILLING_PORTAL_RETURN (the frontend root otherwise).

Helpers:

    billing.services.active_subscription(user)          Subscription | None
    billing.permissions.HasActiveSubscription            any plan
    billing.permissions.HasActiveSubscription(plans=["pro"])
    billing.signals.subscription_changed                 user, subscription, previous_status

``/auth/me`` gets ``extra.subscription``: {plan_id, status, current_period_end,
cancel_at_period_end} or null. Deleting an account cancels its Stripe
subscriptions immediately. The account export gets a ``billing`` section.
Access is granted for the statuses active, trialing and past_due.
"""
