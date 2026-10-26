import { C, Callout, Code, Endpoints, Errors, H2, P, Settings, Step, Steps } from "@/components/backend/prose";
import { LiveDemo } from "@/components/backend/live-demo";
import PricingDemo from "@/demos/backend/pricing";

export default function Billing() {
  return (
    <>
      <P>
        <C>pleate_backend.billing</C> sells subscriptions with Stripe Checkout, lets customers manage them in the Stripe
        billing portal and keeps a local copy of each subscription in sync through webhooks. Plans are a list in your
        settings, and each plan maps one to one onto a <C>Pricing</C> card. Mounted at <C>/api/billing</C>.
      </P>

      <LiveDemo
        file="pricing"
        title="Pricing with checkout"
        description="usePricing loads the plans, tracks the monthly or yearly switch and starts Checkout for the chosen plan."
        signIn
        hint={<>Choose a paid plan to start a checkout</>}
      >
        <PricingDemo />
      </LiveDemo>

      <H2>Setup</H2>
      <Steps>
        <Step title="Install and configure Stripe">
          <Code lang="sh">{`pip install "pleate-backend[stripe]"`}</Code>
          <P>Create the products and prices in Stripe, then describe the plans:</P>
          <Code lang="python" title="settings.py">{`
PLEATE["BILLING"] = {
    "STRIPE_SECRET_KEY": env("STRIPE_SECRET_KEY"),
    "STRIPE_WEBHOOK_SECRET": env("STRIPE_WEBHOOK_SECRET"),     # whsec_...
    "CURRENCY": "usd",
    "TRIAL_DAYS": 14,
    "PLANS": [
        {"id": "free", "name": "Free", "description": "For trying things out.",
         "features": ["1 project", "Community support"]},             # no prices: free
        {"id": "pro", "name": "Pro", "description": "For growing teams.",
         "features": ["Unlimited projects", "Priority support",
                      {"label": "Webhooks", "hint": "Signed, with retries"}],
         "highlighted": True, "badge": "Popular", "cta": "Start free trial",
         "prices": {"month": {"price_id": "price_1Pro...", "amount": 1200},
                    "year": {"price_id": "price_1ProY...", "amount": 12000}}},
        {"id": "enterprise", "name": "Enterprise", "custom_price": "Let's talk",
         "features": ["SSO", "Audit log export", {"label": "Uptime SLA", "included": True}]},
    ],
}
`}</Code>
          <P>
            <C>amount</C> is in minor units (cents). A plan without prices is free; <C>{'"custom": True'}</C> or a{" "}
            <C>custom_price</C> label makes a sales led plan.
          </P>
        </Step>
        <Step title="Point the Stripe webhook at the API">
          <P>
            In the Stripe dashboard add an endpoint at <C>https://plate.app/api/billing/webhook</C> with the events below,
            and copy its signing secret into <C>STRIPE_WEBHOOK_SECRET</C>. Locally, forward with the Stripe CLI:{" "}
            <C>stripe listen</C>.
          </P>
          <P>
            Handled: <C>checkout.session.completed</C>, <C>customer.subscription.created</C>,{" "}
            <C>customer.subscription.updated</C>, <C>customer.subscription.deleted</C>, <C>invoice.payment_failed</C>{" "}
            (sends the <C>billing.payment_failed</C> notification) and <C>invoice.paid</C>. Each event id is applied once.
          </P>
        </Step>
        <Step title="Set the frontend paths">
          <P>
            Checkout returns to <C>BILLING_SUCCESS</C> (with <C>?session_id=</C>) or <C>BILLING_CANCEL</C>; the portal
            returns to <C>BILLING_PORTAL_RETURN</C>. Defaults: <C>/billing/success</C>, <C>/pricing</C>,{" "}
            <C>/settings/billing</C>.
          </P>
        </Step>
      </Steps>

      <H2>Endpoints</H2>
      <Endpoints
        rows={[
          ["GET", "/billing/plans", <>Anyone. <C>{"{currency, trial_days, current_plan, plans}"}</C></>],
          ["GET", "/billing/subscription", <><C>{"{subscription}"}</C>: the active one, else the most recent, else null.</>],
          ["POST", "/billing/checkout", <><C>{"{plan, interval: month | year}"}</C> → <C>{"{url}"}</C> of Stripe Checkout.</>],
          ["POST", "/billing/portal", <>→ <C>{"{url}"}</C> of the billing portal.</>],
          ["POST", "/billing/webhook", <>Stripe only. Raw event with <C>Stripe-Signature</C> → <C>{"{received, duplicate}"}</C>.</>],
        ]}
      />
      <P>
        Each plan in <C>/billing/plans</C> has <C>id</C>, <C>name</C>, <C>description</C>, <C>features</C>,{" "}
        <C>highlighted</C>, <C>badge</C>, <C>cta</C>, <C>price</C> (<C>{"{monthly, yearly}"}</C> per month in major units,
        yearly shown as its monthly equivalent, or null), <C>custom_price</C>, <C>amounts</C> (raw minor unit charges),{" "}
        <C>intervals</C> and <C>current</C>. <C>current_plan</C> is the plan of the active subscription, else the free
        plan, for signed in users.
      </P>

      <H2>On the frontend</H2>
      <Code lang="tsx">{`
const { isSignedIn } = useMe();
const pricing = usePricing({ isSignedIn, signInHref: "/login?next=/pricing" });
<Pricing {...pricing.pricingProps} />

const { subscription, openPortal } = useSubscription();
{subscription && <Button onClick={openPortal}>Manage billing</Button>}
`}</Code>
      <P>
        <C>usePricing</C> renders a call to action per plan (disabled on the current plan, busy while Checkout starts),
        or takes <C>renderCta</C> to draw your own. Signed out visitors who pick a paid plan go to <C>signInHref</C>.
      </P>

      <H2>Protecting features</H2>
      <Code lang="python">{`
from pleate_backend.billing.permissions import HasActiveSubscription
from pleate_backend.billing.services import active_subscription

class ExportView(APIView):
    permission_classes = [IsAuthenticated, HasActiveSubscription]                 # any plan

class WebhookSettingsView(APIView):
    permission_classes = [IsAuthenticated, HasActiveSubscription(plans=["pro"])]

active_subscription(request.user)   # Subscription | None
`}</Code>
      <P>
        Access is granted for the statuses <C>active</C>, <C>trialing</C> and <C>past_due</C>. <C>/auth/me</C> carries{" "}
        <C>extra.subscription</C> (<C>{"{plan_id, status, current_period_end, cancel_at_period_end}"}</C> or null) for the
        UI. React to changes with the <C>billing.signals.subscription_changed</C> signal (<C>user</C>,{" "}
        <C>subscription</C>, <C>previous_status</C>).
      </P>

      <H2>Settings</H2>
      <P><C>{`PLEATE["BILLING"]`}</C>:</P>
      <Settings
        rows={[
          ["STRIPE_SECRET_KEY", "None", "sk_live_... or sk_test_..."],
          ["STRIPE_WEBHOOK_SECRET", "None", "whsec_... of the webhook endpoint."],
          ["CURRENCY", '"usd"', "Shown by Pricing."],
          ["TRIAL_DAYS", "0", "Free days on new subscriptions."],
          ["PLANS", "[]", "The plans, see above."],
        ]}
      />

      <H2>Error codes</H2>
      <Errors
        rows={[
          ["invalid_plan", "400", "Unknown plan, free plan or missing interval price."],
          ["billing_not_configured", "503", "No Stripe key."],
          ["already_subscribed", "409", "Use the portal to change plan."],
          ["billing_error", "502", "Stripe refused or failed."],
          ["no_customer", "400", "Portal requested before any checkout."],
          ["invalid_signature", "400", "Webhook signature check failed."],
          ["subscription_required", "403", <>Raised by <C>HasActiveSubscription</C>.</>],
        ]}
      />
      <Callout>
        Deleting an account cancels its Stripe subscriptions immediately, and the account export gets a{" "}
        <C>billing</C> section.
      </Callout>
    </>
  );
}
