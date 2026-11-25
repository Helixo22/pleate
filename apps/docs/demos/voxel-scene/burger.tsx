"use client";

import { createTimeline, ScrollBeat, ScrollScene } from "pleate/effects/scroll-scene";
import { VoxelScene, type VoxelContext } from "pleate/effects/voxel-scene";
import { voxelBurger } from "pleate/effects/voxel-gallery";

// apart: how far the layers are. turn and height: the model and the camera.
const story = createTimeline({ apart: 1, turn: -0.5, height: 1.1 }, [
  { at: 0, values: { apart: 1, turn: -0.5, height: 1.1 } },
  { at: 0.4, values: { apart: 0.62, turn: 0.5, height: 1.5 } },
  { at: 0.72, values: { apart: 0, turn: 1.5, height: 1.7 } },
  { at: 1, values: { apart: 0, turn: 2.5, height: 2.1 } },
]);

function setup(ctx: VoxelContext) {
  const burger = ctx.add(voxelBurger, 1.7);
  ctx.shadow(1.1).position.y = -0.92;
  burger.group.position.y = -0.9;
  const crumbs = ctx.burst({ count: 40, colors: ["#f07f22", "#ffe27a", "#4fa84a", "#e5402f"], cube: 0.09, spread: 2 });
  crumbs.mesh.position.y = 0.3;
  const { camera, disc } = ctx;

  return {
    frame({ progress }: { progress: number }) {
      const s = story.sample(progress);
      burger.explode(s.apart);
      burger.group.rotation.y = s.turn;
      // The layers meet at 0.72: that is when the crumbs fly.
      crumbs.set((progress - 0.68) / 0.24);
      // Tall screens put the picture above the text, wide ones beside it.
      const tall = camera.aspect < 1;
      disc.center = tall ? [0.5, 0.34] : [0.66, 0.5];
      disc.radius = tall ? 0.42 : 0.32;
      const far = tall ? 14 : 9.6;
      camera.position.set(0, s.height + 1, far);
      camera.lookAt(0, 0.35 + s.apart * 0.5, 0);
    },
  };
}

const BEATS = [
  { from: 0, to: 0.34, title: "Six layers, apart", body: "Each part of a model knows where to go when it comes apart." },
  { from: 0.34, to: 0.68, title: "They come together", body: "The scroll moves them. Go back and they separate again." },
  { from: 0.68, to: 1, title: "Crumbs included", body: "A burst of cubes flies the moment the bun lands, always in the same way." },
];

export default function Demo() {
  return (
    <ScrollScene length={4} label="A burger coming together" className="w-full" stage={<VoxelScene setup={setup} disc label="A voxel burger whose layers come together as you scroll" />}>
      {BEATS.map((beat) => (
        <ScrollBeat key={beat.title} from={beat.from} to={beat.to} className="items-end pb-28 md:items-center md:pb-12">
          <div className="max-w-60">
            <h3 className="text-title2 text-fg">{beat.title}</h3>
            <p className="mt-1 text-body text-fg-muted">{beat.body}</p>
          </div>
        </ScrollBeat>
      ))}
    </ScrollScene>
  );
}
