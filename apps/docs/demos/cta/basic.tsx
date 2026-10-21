"use client";

import { Apple, ArrowRight } from "lucide-react";
import { BotFace } from "pleate/ai/bot-face";
import { Button } from "pleate/button";
import { CTA, Newsletter } from "pleate/marketing/cta";

export default function Demo() {
  return (
    <div className="grid w-full gap-6">
      <CTA
        title="Your next trip starts here."
        description="Free for small groups. Set up in a minute."
        actions={
          <>
            <Button size="lg" variant="surface" endIcon={<ArrowRight />}>Start planning</Button>
            <Button size="lg" variant="plain" tone="neutral" className="text-on-accent hover:bg-[color-mix(in_oklab,var(--pl-on-accent)_12%,transparent)]" startIcon={<Apple />}>
              Get the app
            </Button>
          </>
        }
      />
      <CTA
        tone="dark"
        align="start"
        title="Meet your travel assistant."
        description="It plans, compares and books — and it listens."
        actions={<Button size="lg">Try it now</Button>}
        media={
          <div className="grid place-items-center">
            <BotFace size={150} state="happy" />
          </div>
        }
      />
      <Newsletter
        title="Weekend ideas, every Friday."
        description="One email, three short trips, real prices. Unsubscribe any time."
        onSubscribe={() => new Promise((r) => setTimeout(r, 1200))}
        footnote="We never share your address."
      />
    </div>
  );
}
