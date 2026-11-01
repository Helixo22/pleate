import { PatternWaves } from "pleate/effects/pattern-waves";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-2xl border border-separator bg-bg p-6">
      <PatternWaves className="absolute inset-0" />
      <p className="relative text-center text-large-title font-semibold text-balance text-fg">Signal in the pattern</p>
    </div>
  );
}
