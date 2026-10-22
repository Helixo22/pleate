import { ArrowRight, Play } from "lucide-react";
import { BotFace } from "pleate/ai/bot-face";
import { Button } from "pleate/button";
import { RotatingText } from "pleate/effects/animated-text";
import { Hero } from "pleate/marketing/hero";

export default function Demo() {
  return (
    <div className="grid w-full gap-6">
      <div className="overflow-hidden rounded-3xl shadow-[inset_0_0_0_1px_var(--pl-separator)]">
        <Hero
          size="md"
          background="wash"
          eyebrow={<a href="#variants">New · Group trips <ArrowRight className="inline size-3.5" /></a>}
          title={
            <>
              Your next trip to <RotatingText words={["Lisbon", "Kyoto", "Naples", "Oaxaca"]} pillClassName="text-accent-ink" />
            </>
          }
          description="Plan together, split costs and keep every booking in one place, on any device."
          actions={
            <>
              <Button size="lg">Start planning</Button>
              <Button size="lg" variant="tinted" startIcon={<Play />}>Watch the film</Button>
            </>
          }
          footnote="Free for up to 4 travellers · No card needed"
        />
      </div>
      <div className="overflow-hidden rounded-3xl">
        <Hero
          size="md"
          layout="split"
          background="dark"
          title="An assistant that actually listens."
          description="Ask for a plan and get one, with sources, prices and a map. It even reacts to your voice."
          actions={<Button size="lg">Try the assistant</Button>}
          media={
            <div className="grid aspect-[4/3] place-items-center rounded-3xl bg-fill-3">
              <BotFace size={160} state="listening" track />
            </div>
          }
        />
      </div>
    </div>
  );
}
