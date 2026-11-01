import { BounceCards } from "pleate/effects/bounce-cards";

const IMAGES = [
  { src: "https://picsum.photos/id/1015/400/500", alt: "River winding through a green valley" },
  { src: "https://picsum.photos/id/1016/400/500", alt: "Red rock canyon" },
  { src: "https://picsum.photos/id/1018/400/500", alt: "Mountains under a blue sky" },
  { src: "https://picsum.photos/id/1039/400/500", alt: "Waterfall in a forest" },
  { src: "https://picsum.photos/id/1040/400/500", alt: "Castle on a hill" },
];

export default function Demo() {
  return <BounceCards images={IMAGES} label="Album" cardWidth={160} cardHeight={200} overlap={90} />;
}
