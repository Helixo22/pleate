import { ChromaGrid } from "pleate/effects/chroma-grid";

const PEOPLE = [
  { image: "https://picsum.photos/id/1025/500/600", alt: "Pug wrapped in a blanket", title: "Biscuit", subtitle: "Head of naps", handle: "@biscuit", color: "#ff9f0a" },
  { image: "https://picsum.photos/id/1074/500/600", alt: "Lioness resting", title: "Nala", subtitle: "Security", handle: "@nala", color: "#ff375f" },
  { image: "https://picsum.photos/id/1084/500/600", alt: "Walrus on the ice", title: "Wally", subtitle: "Cold storage", handle: "@wally", color: "#0a84ff" },
  { image: "https://picsum.photos/id/1024/500/600", alt: "Vulture close up", title: "Vera", subtitle: "Code review", handle: "@vera", color: "#30d158" },
  { image: "https://picsum.photos/id/1069/500/600", alt: "Jellyfish in dark water", title: "Jelly", subtitle: "Design systems", handle: "@jelly", color: "#bf5af2" },
  { image: "https://picsum.photos/id/1060/500/600", alt: "Barista pouring coffee", title: "Bea", subtitle: "Fuel", handle: "@bea", color: "#64d2ff" },
];

export default function Demo() {
  return <ChromaGrid items={PEOPLE} minCardWidth={200} />;
}
