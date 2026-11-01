import { FluxLines } from "pleate/effects/flux-lines";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-xl bg-bg">
      <FluxLines className="absolute inset-0" />
      <h3 className="pointer-events-none relative px-6 text-center text-display-sm">Field lines</h3>
    </div>
  );
}
