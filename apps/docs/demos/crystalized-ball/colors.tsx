import { CrystalizedBall } from "pleate/effects/crystalized-ball";

export default function Demo() {
  return (
    <div className="grid w-full grid-cols-3 gap-4">
      <CrystalizedBall color="#ff375f" facets={4} />
      <CrystalizedBall color="#30d158" facets={7} speed={0.5} />
      <CrystalizedBall color="#ffd60a" facets={12} />
    </div>
  );
}
