import { HalftoneReveal } from "pleate/effects/halftone-reveal";

export default function Demo() {
  return (
    <HalftoneReveal trigger="view" color="var(--pl-fg)" gap={10} className="h-56 w-full rounded-xl">
      <div className="grid h-full place-items-center bg-accent text-title1 text-on-accent">Revealed on scroll</div>
    </HalftoneReveal>
  );
}
