import { StrokeText } from "pleate/effects/stroke-text";

export default function Demo() {
  return (
    <div className="grid gap-8 text-center">
      <StrokeText as="h3" text="Drawn by hand" className="text-display-sm font-bold" />
      <StrokeText text="Outline only" fill="none" stroke="var(--pl-fg)" duration={2.6} className="text-title1 font-semibold" />
    </div>
  );
}
