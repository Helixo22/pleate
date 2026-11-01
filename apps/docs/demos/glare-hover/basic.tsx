import { GlareHover } from "pleate/effects/glare-hover";

export default function Demo() {
  return (
    <div className="grid w-full gap-6 sm:grid-cols-2">
      <GlareHover className="grid h-48 place-items-center rounded-xl bg-fg text-bg">
        <p className="text-title2">Hover me</p>
      </GlareHover>
      <GlareHover color="var(--pl-accent)" opacity={0.6} angle={-20} width={0.4} duration={1000} className="grid h-48 place-items-center rounded-xl bg-surface">
        <p className="text-title2">Accent, wider band</p>
      </GlareHover>
    </div>
  );
}
