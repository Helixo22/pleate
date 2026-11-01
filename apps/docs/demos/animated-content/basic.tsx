import { AnimatedContent } from "pleate/effects/animated-content";

export default function Demo() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <AnimatedContent>
        <div className="rounded-xl bg-surface p-6 text-headline">From below</div>
      </AnimatedContent>
      <AnimatedContent direction="horizontal" reverse delay={0.1}>
        <div className="rounded-xl bg-surface p-6 text-headline">From the left</div>
      </AnimatedContent>
      <AnimatedContent motion={0.8} scale={0.85} distance={0} delay={0.2}>
        <div className="rounded-xl bg-accent p-6 text-headline text-on-accent">Zoom tween</div>
      </AnimatedContent>
    </div>
  );
}
