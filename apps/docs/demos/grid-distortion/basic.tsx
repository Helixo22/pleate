import { GridDistortion } from "pleate/effects/grid-distortion";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-3xl bg-bg">
      <GridDistortion className="absolute inset-0" />
      <h2 className="pointer-events-none relative px-6 text-center text-display-sm text-balance text-fg">Drag the grid apart</h2>
    </div>
  );
}
