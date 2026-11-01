import { MetaBalls } from "pleate/effects/meta-balls";

export default function Demo() {
  return (
    <MetaBalls className="grid h-80 w-full place-items-center rounded-xl bg-fill-3">
      <p className="pointer-events-none text-title2 text-fg">Move the pointer in</p>
    </MetaBalls>
  );
}
