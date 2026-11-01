import { BorderGlow } from "pleate/effects/border-glow";

export default function Demo() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <BorderGlow className="p-6">
        <p className="text-caption1 text-fg-subtle">Storage</p>
        <p className="mt-1 text-title1 pl-tabular">182 GB</p>
        <p className="mt-6 text-subhead text-fg-muted">of 256 GB used. Move the pointer towards an edge.</p>
      </BorderGlow>
      <BorderGlow color="var(--pl-success)" className="p-6">
        <p className="text-caption1 text-fg-subtle">Uptime</p>
        <p className="mt-1 text-title1 pl-tabular">99.98%</p>
        <p className="mt-6 text-subhead text-fg-muted">Any color works, here the success green.</p>
      </BorderGlow>
    </div>
  );
}
