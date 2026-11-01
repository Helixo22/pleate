import { DomeGallery } from "pleate/effects/dome-gallery";

const IMAGES = [
  { src: "https://picsum.photos/id/1015/500/400", alt: "River winding through a green valley" },
  { src: "https://picsum.photos/id/1016/500/400", alt: "Red rock canyon" },
  { src: "https://picsum.photos/id/1018/500/400", alt: "Mountains under a blue sky" },
  { src: "https://picsum.photos/id/1039/500/400", alt: "Waterfall in a forest" },
  { src: "https://picsum.photos/id/1040/500/400", alt: "Castle on a hill" },
  { src: "https://picsum.photos/id/1060/500/400", alt: "Barista pouring coffee" },
  { src: "https://picsum.photos/id/1069/500/400", alt: "Jellyfish in dark water" },
  { src: "https://picsum.photos/id/1074/500/400", alt: "Lioness resting" },
  { src: "https://picsum.photos/id/1080/500/400", alt: "Strawberries on a table" },
  { src: "https://picsum.photos/id/1084/500/400", alt: "Walrus on the ice" },
  { src: "https://picsum.photos/id/1025/500/400", alt: "Pug wrapped in a blanket" },
  { src: "https://picsum.photos/id/1024/500/400", alt: "Vulture close up" },
];

export default function Demo() {
  return <DomeGallery images={IMAGES} label="Photo dome" height={460} />;
}
