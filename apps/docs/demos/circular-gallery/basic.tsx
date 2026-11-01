import { CircularGallery } from "pleate/effects/circular-gallery";

const PHOTOS = [
  { src: "https://picsum.photos/id/1018/500/640", full: "https://picsum.photos/id/1018/1400/900", alt: "Mountains under a blue sky", title: "Dolomites" },
  { src: "https://picsum.photos/id/1015/500/640", full: "https://picsum.photos/id/1015/1400/900", alt: "River winding through a green valley", title: "Valley" },
  { src: "https://picsum.photos/id/1039/500/640", full: "https://picsum.photos/id/1039/1400/900", alt: "Waterfall in a forest", title: "Falls" },
  { src: "https://picsum.photos/id/1016/500/640", full: "https://picsum.photos/id/1016/1400/900", alt: "Red rock canyon", title: "Canyon" },
  { src: "https://picsum.photos/id/1040/500/640", full: "https://picsum.photos/id/1040/1400/900", alt: "Castle on a hill", title: "Fort" },
  { src: "https://picsum.photos/id/1080/500/640", full: "https://picsum.photos/id/1080/1400/900", alt: "Strawberries on a table", title: "Market" },
  { src: "https://picsum.photos/id/1060/500/640", full: "https://picsum.photos/id/1060/1400/900", alt: "Barista pouring coffee", title: "Coffee" },
];

export default function Demo() {
  return <CircularGallery images={PHOTOS} label="Travel photos" cardWidth={180} cardHeight={230} />;
}
