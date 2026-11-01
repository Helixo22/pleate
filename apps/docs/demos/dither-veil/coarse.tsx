import { DitherVeil } from "pleate/effects/dither-veil";

export default function Demo() {
  return <DitherVeil pixelSize={8} scale={1.5} color="var(--pl-fg)" clearRadius={0} speed={1.6} className="h-48 w-full rounded-xl bg-bg" />;
}
