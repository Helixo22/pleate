import { Lightfall } from "pleate/effects/lightfall";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-3xl bg-bg">
      <Lightfall className="absolute inset-0" />
      <h2 className="pointer-events-none relative px-6 text-center text-display-sm text-balance text-fg">Light, falling softly</h2>
    </div>
  );
}
