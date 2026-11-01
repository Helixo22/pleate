import { ShapeGrid } from "pleate/effects/shape-grid";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-2xl border border-separator bg-bg p-6">
      <ShapeGrid className="absolute inset-0" shape="hexagon" />
      <p className="relative text-center text-large-title font-semibold text-balance text-fg">Move across the grid</p>
    </div>
  );
}
