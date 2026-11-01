import { TiltedCard } from "pleate/effects/tilted-card";

export default function Demo() {
  return (
    <TiltedCard
      src="https://picsum.photos/seed/pl-tilt/600/600"
      alt="A cabin by a lake"
      caption="Lakeside, 2026"
      overlay={<p className="m-4 inline-block rounded-full bg-black/40 px-3 py-1 text-footnote text-white backdrop-blur-md">Lakeside</p>}
    />
  );
}
