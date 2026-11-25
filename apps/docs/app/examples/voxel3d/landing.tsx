// A landing page for a fictional guesthouse in a lighthouse (Punta Lume). The lighthouse is a voxel model that assembles
// as the page scrolls: sea and rock, tower, deck, lamp. No image or model files, everything is drawn from code.
"use client";

import { useTransform, motion } from "motion/react";
import Link from "next/link";
import { Button } from "pleate/button";
import { Container } from "pleate/container";
import { PixelArt, PixelFrame, PixelSteps } from "pleate/effects/pixel-art";
import { pixelDrawing } from "pleate/effects/pixel-gallery";
import { range, ScrollBeat, ScrollScene, useSceneProgress } from "pleate/effects/scroll-scene";
import { voxelBoat, voxelLighthouse } from "pleate/effects/voxel-gallery";
import { VoxelScene, type VoxelContext } from "pleate/effects/voxel-scene";
import { Footer, FooterBottom } from "pleate/footer";
import { Navbar, NavbarLink } from "pleate/navbar";
import { Section } from "pleate/section";

// For words only: in Pixelify Sans a 5 reads like an S and a 7 like a 9, so numbers stay in the text font.
const PIXEL_FONT = "font-(family-name:--font-pixel) font-normal";

/** The finished lighthouse, for the top of the page. */
function hero(ctx: VoxelContext) {
  const tower = ctx.add(voxelLighthouse, 3);
  const boat = ctx.add(voxelBoat, 0.8);
  boat.parts.sea.visible = false; // the lighthouse brings its own
  tower.group.position.y = -1.5;
  return {
    frame({ time }: { time: number }) {
      tower.group.rotation.y = 0.5 + Math.sin(time * 0.25) * 0.25;
      const a = time * 0.22 + 0.9;
      boat.group.position.set(Math.cos(a) * 1.3, -1.46 + Math.sin(time * 1.6) * 0.02, Math.sin(a) * 1.3);
      boat.group.rotation.y = -a + Math.PI / 2;
      ctx.camera.position.set(0, 1.7, 9.6);
      ctx.camera.lookAt(0, -0.05, 0);
    },
  };
}

/** The same lighthouse, one part at a time. */
function assembly(ctx: VoxelContext) {
  const { camera, disc } = ctx;
  const tower = ctx.add(voxelLighthouse, 3);
  tower.group.position.y = -1.5;
  const splash = ctx.burst({ count: 36, colors: ["#7cc4ff", "#ffffff"], cube: 0.1, spread: 1.7, gravity: 2 });
  splash.mesh.position.y = -1.2;
  const sparks = ctx.burst({ count: 24, colors: ["#ffe27a", "#f7b733"], cube: 0.07, spread: 1.3, gravity: 0.2, seed: 4 });
  sparks.mesh.position.y = 1.15;
  const lands: Record<string, [number, number]> = { rock: [0.08, 0.2], tower: [0.28, 0.45], deck: [0.5, 0.58], lamp: [0.74, 0.8], cap: [0.82, 0.9] };
  const rest = Object.fromEntries(Object.keys(lands).map((id) => [id, tower.parts[id].position.y]));
  return {
    frame({ progress }: { progress: number }) {
      for (const [id, [from, to]] of Object.entries(lands)) {
        const t = range(progress, from, to);
        tower.parts[id].visible = t > 0;
        // Falls fast and stops on the part below.
        tower.parts[id].position.y = rest[id] + (1 - t * t) * 34;
      }
      splash.set((progress - 0.19) / 0.14);
      sparks.set((progress - 0.8) / 0.16);
      tower.group.rotation.y = -0.4 + progress * 2.4;
      // Tall screens put the picture above the text, wide ones beside it.
      const tall = camera.aspect < 1;
      disc.center = tall ? [0.5, 0.36] : [0.68, 0.5];
      disc.radius = tall ? 0.42 : 0.4;
      camera.position.set(0, 1.6 + progress * 0.8, tall ? 15 : 9.8);
      camera.lookAt(0, 0.05, 0);
    },
  };
}

const STEPS = [
  { title: "The rock", body: "Punta Lume stands on a granite shelf, eleven minutes by boat from the harbor." },
  { title: "The tower", body: "Built in 1904, 112 steps. Three rooms, one above the other, each with the whole sea around it." },
  { title: "The deck", body: "Breakfast is served out here when the wind stays under four knots." },
  { title: "The lamp", body: "It still turns. At dusk one guest climbs up and lights it." },
];

const ROOMS = [
  { art: "lamp", name: "Keeper", floor: "First floor", text: "The old desk, a stove and the logbook to read in bed.", price: "140 €" },
  { art: "fish", name: "Tide", floor: "Second floor", text: "A round bed and six windows at the height of the gulls.", price: "165 €" },
  { art: "moon", name: "Beam", floor: "Third floor", text: "Right under the lamp. The light passes every nine seconds.", price: "190 €" },
];

function StepCount() {
  const progress = useSceneProgress();
  const text = useTransform(progress, (t) => `${Math.min(STEPS.length, Math.floor(t * STEPS.length) + 1)} / ${STEPS.length}`);
  return <motion.span aria-hidden className="font-mono text-footnote text-fg-muted tabular-nums">{text}</motion.span>;
}

export function Landing() {
  return (
    <div data-palette="orange" className="min-h-dvh bg-bg text-fg">
      <Navbar
        brand={
          <Link href="/examples/voxel3d" className={`pl-focus-ring ${PIXEL_FONT} text-title3 text-accent-ink`}>
            Punta Lume
          </Link>
        }
      >
        <NavbarLink href="#how">The building</NavbarLink>
        <NavbarLink href="#rooms">Rooms</NavbarLink>
        <NavbarLink href="#boat">The boat</NavbarLink>
      </Navbar>

      <header className="relative overflow-clip">
        <Container size="xl" className="grid items-center gap-6 py-10 md:min-h-[calc(100dvh-4rem)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:py-0">
          <div className="flex flex-col items-start gap-6">
            <h1 className={`${PIXEL_FONT} text-[clamp(2.75rem,6vw,5rem)] leading-[1] text-balance`}>Sleep inside a working lighthouse</h1>
            <p className="max-w-md text-title3 font-normal text-fg-muted">Three rooms, 112 steps and a lamp that a guest lights every evening. Open from April to October.</p>
            <div className="flex flex-wrap gap-5">
              <PixelFrame>
                <Button size="xl" asChild>
                  <a href="#rooms">See the rooms</a>
                </Button>
              </PixelFrame>
              <PixelFrame>
                <Button size="xl" variant="surface" tone="neutral" asChild>
                  <a href="#how">Watch it being built</a>
                </Button>
              </PixelFrame>
            </div>
          </div>
          <div className="h-[26rem] md:h-[min(46rem,86dvh)]">
            <VoxelScene setup={hero} loop="always" disc={{ radius: 0.44 }} label="A red and white lighthouse on a rock, with a sailboat going around it" fallback={<PixelArt art={pixelDrawing("sun")} />} />
          </div>
        </Container>
      </header>

      <div id="how" className="bg-surface">
        <ScrollScene length={5} label="How the lighthouse was built" stage={<VoxelScene setup={assembly} disc label="The lighthouse assembling part by part as you scroll" />}>
          {STEPS.map((step, i) => (
            <ScrollBeat key={step.title} from={i / STEPS.length} to={(i + 1) / STEPS.length} className="items-end pb-28 md:items-center md:px-[max(3rem,calc(50vw-38rem))] md:pb-12">
              <div className="max-w-sm">
                <h2 className={`${PIXEL_FONT} text-[clamp(2rem,4vw,3.25rem)] leading-none`}>{step.title}</h2>
                <p className="mt-4 text-title3 font-normal text-fg-muted">{step.body}</p>
              </div>
            </ScrollBeat>
          ))}
          <div className="absolute inset-x-6 bottom-12 flex items-center gap-4 md:inset-x-[max(3rem,calc(50vw-38rem))]">
            <PixelSteps steps={STEPS.map((s) => s.title)} label="Parts of the building" />
            <StepCount />
          </div>
        </ScrollScene>
      </div>

      <Section id="rooms" title={<span className={PIXEL_FONT}>Three rooms, one staircase</span>} description="Prices are per night for two, breakfast and the boat included">
        <ul className="grid gap-x-8 gap-y-10 md:grid-cols-3">
          {ROOMS.map((room) => (
            <li key={room.name} className="flex flex-col gap-4 border-t-2 border-dashed border-separator pt-6">
              <PixelArt art={pixelDrawing(room.art)} className="size-20" />
              <div className="flex items-baseline justify-between gap-4">
                <h3 className={`${PIXEL_FONT} text-title1`}>{room.name}</h3>
                <p className="text-title3 text-accent-ink tabular-nums">{room.price}</p>
              </div>
              <p className="text-body text-fg-muted">{room.text}</p>
              <p className="text-subhead text-fg-muted">{room.floor}</p>
            </li>
          ))}
        </ul>
      </Section>

      <section id="boat" className="bg-accent text-on-accent">
        <Container size="xl" className="flex flex-col gap-8 py-16 md:flex-row md:items-center md:justify-between md:py-24">
          <div className="max-w-xl">
            <h2 className={`${PIXEL_FONT} text-[clamp(2rem,4vw,3.25rem)] leading-none`}>The boat leaves at half past five</h2>
            <p className="mt-4 text-title3 font-normal">Every day from the old pier, next to the fish market. If the sea is rough we call you before noon and move your night.</p>
          </div>
          <PixelFrame color="var(--pl-on-accent)">
            <Button size="xl" variant="filled" tone="neutral" asChild>
              <a href="mailto:hello@puntalume.example">Write to the keeper</a>
            </Button>
          </PixelFrame>
        </Container>
      </section>

      <Footer brand={<span className={`${PIXEL_FONT} text-title3`}>Punta Lume</span>}>
        <FooterBottom>
          <span>A fictional guesthouse, built with pleate</span>
          <span>Every picture on this page is code</span>
        </FooterBottom>
      </Footer>
    </div>
  );
}
