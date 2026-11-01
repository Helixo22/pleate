import { DepthText } from "pleate/effects/depth-text";

export default function Demo() {
  return <DepthText text="Stacked" layers={20} step={1} depthColor="var(--pl-fg-muted)" color="var(--pl-accent)" className="text-display-sm font-bold" />;
}
