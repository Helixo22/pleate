import { FlexCarousel } from "pleate/effects/flex-carousel";

const IMAGES = [
  { src: "https://picsum.photos/id/1015/440/560", alt: "River winding through a green valley" },
  { src: "https://picsum.photos/id/1016/440/560", alt: "Red rock canyon" },
  { src: "https://picsum.photos/id/1018/440/560", alt: "Mountains under a blue sky" },
  { src: "https://picsum.photos/id/1039/440/560", alt: "Waterfall in a forest" },
  { src: "https://picsum.photos/id/1040/440/560", alt: "Castle on a hill" },
  { src: "https://picsum.photos/id/1060/440/560", alt: "Barista pouring coffee" },
  { src: "https://picsum.photos/id/1069/440/560", alt: "Jellyfish in dark water" },
  { src: "https://picsum.photos/id/1074/440/560", alt: "Lioness resting" },
];

export default function Demo() {
  return <FlexCarousel images={IMAGES} label="Highlights" itemWidth={180} itemHeight={230} />;
}
