import { BlurText, GradientText, RotatingText, ShinyText } from "pleate/effects/animated-text";

export default function Demo() {
  return (
    <div className="grid w-full gap-10 text-center">
      <BlurText as="h3" text="Plan less. Travel more." className="text-display-sm" />
      <h3 className="text-display-sm">
        Trips to{" "}
        <RotatingText words={["Lisbon", "Kyoto", "Naples", "Oaxaca", "Reykjavík"]} pillClassName="rounded-2xl bg-accent-soft px-3 text-accent-ink" />
      </h3>
      <h3 className="text-display-sm">
        <GradientText>Every color is yours.</GradientText>
      </h3>
      <p className="text-title3">
        <ShinyText>Your itinerary is being prepared…</ShinyText>
      </p>
    </div>
  );
}
