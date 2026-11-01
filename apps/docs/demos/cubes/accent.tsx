import { Cubes } from "pleate/effects/cubes";

export default function Demo() {
  return (
    <div className="mx-auto w-full max-w-xs">
      <Cubes grid={5} maxAngle={70} radius={2} gap={0.2} faceColor="var(--pl-accent)" borderColor="transparent" />
    </div>
  );
}
