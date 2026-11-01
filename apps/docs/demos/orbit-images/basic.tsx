import { OrbitImages } from "pleate/effects/orbit-images";

const IMAGES = ["Lake", "Forest", "Desert", "Coast", "City", "Snow", "Field", "Canyon"].map((name, i) => ({
  src: `https://picsum.photos/seed/pleate-orbit-${i}/160/160`,
  alt: `${name} photo`,
}));

export default function Demo() {
  return (
    <OrbitImages images={IMAGES} radius={150} itemSize={68}>
      <div className="grid size-24 place-items-center rounded-full bg-accent font-brand text-headline text-on-accent">8 places</div>
    </OrbitImages>
  );
}
