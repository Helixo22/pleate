import { DepthCarousel } from "pleate/effects/depth-carousel";

const STORIES = [
  { src: "https://picsum.photos/id/1018/560/720", alt: "Mountains under a blue sky", title: "Above the clouds" },
  { src: "https://picsum.photos/id/1039/560/720", alt: "Waterfall in a forest", title: "Into the woods" },
  { src: "https://picsum.photos/id/1016/560/720", alt: "Red rock canyon", title: "Desert light" },
  { src: "https://picsum.photos/id/1040/560/720", alt: "Castle on a hill", title: "Old stones" },
  { src: "https://picsum.photos/id/1084/560/720", alt: "Walrus on the ice", title: "Far north" },
];

export default function Demo() {
  return (
    <DepthCarousel label="Stories" autoplay={5000} cardWidth={240} cardHeight={320}>
      {STORIES.map((story) => (
        <figure key={story.title} className="relative m-0 size-full">
          <img src={story.src} alt={story.alt} className="size-full object-cover" draggable={false} />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12 text-headline text-white">{story.title}</figcaption>
        </figure>
      ))}
    </DepthCarousel>
  );
}
