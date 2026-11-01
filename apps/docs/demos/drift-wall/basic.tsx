import { DriftWall } from "pleate/effects/drift-wall";

const IMAGES = [
  { src: "https://picsum.photos/id/1015/400/260", alt: "River winding through a green valley" },
  { src: "https://picsum.photos/id/1016/400/260", alt: "Red rock canyon" },
  { src: "https://picsum.photos/id/1018/400/260", alt: "Mountains under a blue sky" },
  { src: "https://picsum.photos/id/1039/400/260", alt: "Waterfall in a forest" },
  { src: "https://picsum.photos/id/1040/400/260", alt: "Castle on a hill" },
  { src: "https://picsum.photos/id/1060/400/260", alt: "Barista pouring coffee" },
  { src: "https://picsum.photos/id/1069/400/260", alt: "Jellyfish in dark water" },
  { src: "https://picsum.photos/id/1074/400/260", alt: "Lioness resting" },
  { src: "https://picsum.photos/id/1080/400/260", alt: "Strawberries on a table" },
  { src: "https://picsum.photos/id/1084/400/260", alt: "Walrus on the ice" },
];

export default function Demo() {
  return <DriftWall images={IMAGES} className="rounded-xl" />;
}
