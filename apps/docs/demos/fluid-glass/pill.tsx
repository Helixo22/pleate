import { FluidGlass } from "pleate/effects/fluid-glass";

export default function Demo() {
  return (
    <FluidGlass shape="pill" size={110} strength={50} className="w-full rounded-xl">
      <div className="grid h-80 grid-cols-4 gap-2 bg-bg p-4">
        {["#0a84ff", "#30d158", "#ff9f0a", "#ff375f", "#bf5af2", "#64d2ff", "#ffd60a", "#ac8e68"].map((color) => (
          <div key={color} className="grid place-items-center rounded-lg text-headline text-white" style={{ background: color }}>Aa</div>
        ))}
      </div>
    </FluidGlass>
  );
}
