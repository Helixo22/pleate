import { CircularCarousel } from "pleate/effects/circular-carousel";

const PHOTOS = [
  { src: "https://picsum.photos/id/1018/400/540", alt: "Mountains under a blue sky", title: "Dolomites" },
  { src: "https://picsum.photos/id/1015/400/540", alt: "River winding through a green valley", title: "Valley" },
  { src: "https://picsum.photos/id/1039/400/540", alt: "Waterfall in a forest", title: "Falls" },
  { src: "https://picsum.photos/id/1016/400/540", alt: "Red rock canyon", title: "Canyon" },
  { src: "https://picsum.photos/id/1040/400/540", alt: "Castle on a hill", title: "Fort" },
  { src: "https://picsum.photos/id/1069/400/540", alt: "Jellyfish in dark water", title: "Deep sea" },
  { src: "https://picsum.photos/id/1074/400/540", alt: "Lioness resting", title: "Savanna" },
  { src: "https://picsum.photos/id/1084/400/540", alt: "Walrus on the ice", title: "Arctic" },
];

export default function Demo() {
  return <CircularCarousel images={PHOTOS} label="Places" cardWidth={200} cardHeight={260} />;
}
