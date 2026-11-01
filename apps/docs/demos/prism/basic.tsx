import { Prism } from "pleate/effects/prism";

export default function Demo() {
  return (
    <div className="relative grid h-[420px] w-full place-items-center overflow-hidden rounded-2xl border border-separator bg-bg p-6">
      <Prism className="absolute inset-0" />
      <p className="relative text-center text-large-title font-semibold text-balance text-fg">One light, every color</p>
    </div>
  );
}
