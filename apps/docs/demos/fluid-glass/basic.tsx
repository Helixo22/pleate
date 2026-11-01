import { FluidGlass } from "pleate/effects/fluid-glass";

export default function Demo() {
  return (
    <FluidGlass className="w-full rounded-xl">
      <div className="grid h-96 place-items-center bg-[url(https://picsum.photos/id/1080/1200/800)] bg-cover bg-center p-8">
        <p className="text-center text-display font-semibold text-white [text-shadow:0_2px_20px_rgb(0_0_0/0.4)]">Look closer</p>
      </div>
    </FluidGlass>
  );
}
