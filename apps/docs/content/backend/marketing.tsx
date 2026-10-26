import { C, Callout, Code, Endpoints, H2, H3, P, Settings } from "@/components/backend/prose";
import { LiveDemo } from "@/components/backend/live-demo";
import MarketingDemo from "@/demos/backend/marketing";

export default function Marketing() {
  return (
    <>
      <P>
        <C>pleate_backend.marketing</C> backs the forms of a landing page: <C>Newsletter</C> with double opt in,{" "}
        <C>ContactForm</C> with a honeypot, and a waitlist with referral codes. It is mounted at{" "}
        <C>/api/marketing</C>. The public endpoints accept anonymous visitors, still enforce CSRF and are throttled with
        the <C>contact</C> scope (5 per hour per IP).
      </P>

      <LiveDemo
        file="marketing"
        title="Newsletter and contact form"
        description="useNewsletter and useContactForm wire both forms to the API, server errors included."
      >
        <MarketingDemo />
      </LiveDemo>

      <H2>Newsletter</H2>
      <P>
        <C>subscribe</C> answers the same way whatever the state of the email, so it cannot be used to find out who is
        subscribed. With <C>NEWSLETTER_DOUBLE_OPT_IN</C> the <C>newsletter_confirm</C> email links to{" "}
        <C>{`FRONTEND_PATHS["NEWSLETTER_CONFIRM"]`}</C>; a signed in user subscribing their own verified email skips it.
      </P>
      <Code lang="python" title="Sending a newsletter">{`
from pleate_backend.marketing.models import NewsletterSubscriber
from pleate_backend.marketing.services import unsubscribe_url

for subscriber in NewsletterSubscriber.objects.filter(status="subscribed"):
    send_email("weekly_recipes", subscriber.email, {"unsubscribe_url": unsubscribe_url(subscriber)})
`}</Code>
      <P>The confirmation and unsubscribe pages call the client with the token from the link:</P>
      <Code lang="tsx">{`
const token = useSearchParams().get("token")!;
await client.marketing.confirmSubscription(token);   // or client.marketing.unsubscribe(token)
`}</Code>

      <H2>Contact form</H2>
      <P>
        Messages are stored, then <C>CONTACT_RECIPIENTS</C> (or every active staff user when empty) get the{" "}
        <C>contact_message</C> email with <C>Reply-To</C> set to the sender. <C>website</C> is a honeypot field hidden by{" "}
        <C>ContactForm</C>: when a bot fills it, the message is stored as spam, nothing is sent, and the answer is the same
        so the bot learns nothing.
      </P>

      <H2>Waitlist</H2>
      <P>
        Joining is idempotent: an email already on the list gets its current status. Each person gets a referral code;
        every referral moves them up <C>WAITLIST_REFERRAL_BONUS</C> places:
      </P>
      <Code lang="text">{`position = max(1, rank - bonus * referrals)     # rank: 1 + people still waiting who joined earlier
position = 0                                     # once invited`}</Code>
      <Code lang="tsx">{`
const waitlist = useWaitlist();
const status = await waitlist.mutateAsync({ email, ref: searchParams.get("ref") ?? undefined });
// {position: 128, referral_code: "k3j9x2", referrals: 0, invited: false}
share(\`https://plate.app/?ref=\${status.referral_code}\`);
`}</Code>
      <P>
        Staff invite people from the list; the <C>waitlist_invite</C> email links to <C>WAITLIST_INVITE</C>.
      </P>

      <H2>Endpoints</H2>
      <H3>Public</H3>
      <Endpoints
        rows={[
          ["POST", "/marketing/newsletter/subscribe", <><C>{"{email, source?}"}</C> → 202 <C>{"{confirmation_required}"}</C></>],
          ["POST", "/marketing/newsletter/confirm", <><C>{"{token}"}</C> → <C>{"{email, status}"}</C>. Scope <C>auth</C>.</>],
          ["POST", "/marketing/newsletter/unsubscribe", <><C>{"{token}"}</C> → <C>{"{email, status}"}</C>. Scope <C>auth</C>.</>],
          ["POST", "/marketing/contact", <><C>{"{name, email, subject?, message, website?}"}</C>, message 10 to 5000 characters → 201 <C>{"{received: true}"}</C></>],
          ["POST", "/marketing/waitlist", <><C>{"{email, ref?}"}</C> → <C>{"{position, referral_code, referrals, invited}"}</C></>],
          ["GET", "/marketing/waitlist/<referral_code>", <><C>{"{position, referrals}"}</C></>],
        ]}
      />
      <H3>Staff</H3>
      <Endpoints
        rows={[
          ["GET", "/marketing/subscribers", <>Page list, <C>search</C> (email), <C>status</C>, <C>source</C>, ordering <C>created_at</C>, <C>email</C>.</>],
          ["GET", "/marketing/subscribers/export", "text/csv of subscribed emails."],
          ["GET", "/marketing/contact-messages", <>Page list, <C>search</C> (name, email, subject), <C>status</C>.</>],
          ["PATCH", "/marketing/contact-messages/<id>", <><C>{"{status: new | read | archived | spam}"}</C></>],
          ["GET", "/marketing/waitlist", <>Page list, <C>search</C> (email, referral code), ordering <C>created_at</C>, <C>email</C>, <C>invited_at</C>.</>],
          ["POST", "/marketing/waitlist/<id>/invite", <>Sets <C>invited_at</C> and sends <C>waitlist_invite</C>.</>],
        ]}
      />

      <H2>Settings</H2>
      <P><C>{`PLEATE["MARKETING"]`}</C>:</P>
      <Settings
        rows={[
          ["CONTACT_RECIPIENTS", "[]", "Emails that receive contact messages. Empty: every active staff user."],
          ["NEWSLETTER_DOUBLE_OPT_IN", "True", "Ask new subscribers to confirm."],
          ["WAITLIST_REFERRAL_BONUS", "5", "Places gained per referral."],
        ]}
      />
      <P>
        Frontend paths: <C>NEWSLETTER_CONFIRM</C>, <C>NEWSLETTER_UNSUBSCRIBE</C> (with <C>{"{token}"}</C>) and{" "}
        <C>WAITLIST_INVITE</C> (with <C>{"{code}"}</C> and <C>{"{email}"}</C>).
      </P>
      <Callout>
        The account export gets a <C>marketing</C> section: subscriptions, contact messages and waitlist entries that
        match the user&apos;s email.
      </Callout>
    </>
  );
}
