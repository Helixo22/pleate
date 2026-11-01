import { ElasticMesh } from "pleate/effects/elastic-mesh";

export default function Demo() {
  return (
    <ElasticMesh className="grid h-80 w-full place-items-center rounded-xl bg-surface">
      <div className="pointer-events-none text-center">
        <p className="text-title1">Push the mesh</p>
        <p className="text-subhead text-fg-muted">Click for a ripple.</p>
      </div>
    </ElasticMesh>
  );
}
