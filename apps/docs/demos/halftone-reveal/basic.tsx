import { HalftoneReveal } from "pleate/effects/halftone-reveal";

export default function Demo() {
  return (
    <HalftoneReveal className="h-72 w-full rounded-xl">
      <div className="grid h-full place-items-center bg-fg text-bg">
        <div className="text-center">
          <p className="text-display-sm">Hidden</p>
          <p className="text-subhead opacity-70">Wipe the dots away with the pointer.</p>
        </div>
      </div>
    </HalftoneReveal>
  );
}
