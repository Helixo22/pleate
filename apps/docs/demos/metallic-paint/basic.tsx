import { MetallicPaint } from "pleate/effects/metallic-paint";

const svg = (path: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill-rule="evenodd" d="${path}"/></svg>`)}`;
const STAR = svg("M50 4 61 38h36L68 59l11 35-29-21-29 21 11-35L3 38h36z");
const RING = svg("M50 4a46 46 0 1 1 0 92 46 46 0 0 1 0-92zm0 22a24 24 0 1 0 0 48 24 24 0 0 0 0-48z");

export default function Demo() {
  return (
    <>
      <MetallicPaint src={STAR} alt="Chrome star" className="size-48" />
      <MetallicPaint src={RING} alt="Tinted ring" tint="var(--pl-accent)" speed={0.6} className="size-48" />
    </>
  );
}
