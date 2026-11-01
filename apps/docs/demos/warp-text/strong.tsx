import { WarpText } from "pleate/effects/warp-text";

export default function Demo() {
  return <WarpText text="Wobbly and proud" amplitude={0.15} wavelength={6} speed={1} skew={18} className="text-title1 font-semibold text-accent-ink" />;
}
