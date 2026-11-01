import { FadeContent } from "pleate/effects/fade-content";

export default function Demo() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <FadeContent>
        <div className="rounded-xl bg-surface p-6">
          <p className="text-headline">Plain fade</p>
          <p className="text-subhead text-fg-muted">Opacity only.</p>
        </div>
      </FadeContent>
      <FadeContent blur duration={1.2} delay={0.15}>
        <div className="rounded-xl bg-surface p-6">
          <p className="text-headline">Out of a blur</p>
          <p className="text-subhead text-fg-muted">Sharpens while it fades in.</p>
        </div>
      </FadeContent>
    </div>
  );
}
