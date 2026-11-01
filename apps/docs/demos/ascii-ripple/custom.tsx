import { AsciiRipple } from "pleate/effects/ascii-ripple";

export default function Demo() {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl bg-fg">
      <AsciiRipple className="absolute inset-0" charset=" ·oO0" cellSize={18} color="var(--pl-bg)" baseColor="var(--pl-bg)" baseOpacity={0.12} damping={0.98} />
    </div>
  );
}
