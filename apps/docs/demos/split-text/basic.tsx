import { SplitText } from "pleate/effects/split-text";

export default function Demo() {
  return (
    <div className="grid w-full gap-8 text-center">
      <SplitText as="h3" text="Hello, Lisbon" className="text-display-sm" />
      <SplitText by="word" text="Words can tilt in from the side, too." from={{ x: -24, rotate: -8, opacity: 0 }} className="text-title2 text-fg-muted" />
    </div>
  );
}
