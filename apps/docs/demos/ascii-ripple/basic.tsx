import { AsciiRipple } from "pleate/effects/ascii-ripple";

export default function Demo() {
  return (
    <div className="relative grid h-96 w-full place-items-center overflow-hidden rounded-xl bg-bg">
      <AsciiRipple className="absolute inset-0" />
      <p className="pointer-events-none relative font-brand text-title1">Move or tap</p>
    </div>
  );
}
