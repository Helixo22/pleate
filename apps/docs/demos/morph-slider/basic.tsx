import { MorphSlider } from "pleate/effects/morph-slider";

const slides = [
  { src: "https://picsum.photos/seed/pl-ms1/1200/750", alt: "A mountain lake at sunrise" },
  { src: "https://picsum.photos/seed/pl-ms2/1200/750", alt: "A quiet street in the rain" },
  { src: "https://picsum.photos/seed/pl-ms3/1200/750", alt: "Waves on a rocky shore" },
  { src: "https://picsum.photos/seed/pl-ms4/1200/750", alt: "A forest path in autumn" },
];

export default function Demo() {
  return <MorphSlider slides={slides} autoplay={5000} className="max-w-3xl" />;
}
