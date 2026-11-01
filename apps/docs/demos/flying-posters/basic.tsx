import { FlyingPosters } from "pleate/effects/flying-posters";

const IMAGES = [
  { src: "https://picsum.photos/id/1015/440/600", alt: "River winding through a green valley" },
  { src: "https://picsum.photos/id/1016/440/600", alt: "Red rock canyon" },
  { src: "https://picsum.photos/id/1018/440/600", alt: "Mountains under a blue sky" },
  { src: "https://picsum.photos/id/1039/440/600", alt: "Waterfall in a forest" },
  { src: "https://picsum.photos/id/1040/440/600", alt: "Castle on a hill" },
  { src: "https://picsum.photos/id/1060/440/600", alt: "Barista pouring coffee" },
  { src: "https://picsum.photos/id/1069/440/600", alt: "Jellyfish in dark water" },
  { src: "https://picsum.photos/id/1074/440/600", alt: "Lioness resting" },
];

export default function Demo() {
  return <FlyingPosters images={IMAGES} label="Posters" posterWidth={200} posterHeight={270} height={480} />;
}
