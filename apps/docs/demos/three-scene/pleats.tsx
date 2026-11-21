"use client";

import { motion, useTransform } from "motion/react";
import { createTimeline, ScrollBeat, ScrollScene, useSceneProgress } from "pleate/effects/scroll-scene";
import { ThreeScene, type ThreeContext } from "pleate/effects/three-scene";
import {
  BufferAttribute,
  DirectionalLight,
  DoubleSide,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShadowMaterial,
  Vector3,
} from "three";

const FOLDS = 12;
const WIDTH = 1.8;
const HEIGHT = 1.2;
const MAX_ANGLE = 1.2; // radians each face tips out of the flat sheet when fully folded

// The camera and the fold, pinned at four points of the scroll. Values a cue leaves out carry over.
const shots = createTimeline({ cam: [0, 0.2, 5.8], look: [-0.75, 0.05, 0], fold: 0, turn: 0 }, [
  { at: 0 },
  { at: 0.35, values: { cam: [1.6, 0.9, 4.6], fold: 0.55, turn: 0.35 } },
  { at: 0.7, values: { cam: [0.4, 2.6, 3.8], look: [-0.8, -0.15, 0], fold: 1 } },
  { at: 1, values: { cam: [-1.4, 0.6, 4.4], look: [-0.9, 0.05, 0], fold: 0.85, turn: -0.4 } },
]);

function setup({ scene, camera, palette, phone }: ThreeContext) {
  // One column of vertices per crease, so flat shading draws each face as one plane.
  const geometry = new PlaneGeometry(WIDTH, HEIGHT, FOLDS * 2, 1);
  const position = geometry.getAttribute("position") as BufferAttribute;
  const columns = FOLDS * 2 + 1;
  const face = WIDTH / (FOLDS * 2);

  const paper = new MeshStandardMaterial({ color: palette.accent, roughness: 0.7, side: DoubleSide, flatShading: true });
  const sheet = new Mesh(geometry, paper);
  sheet.castShadow = true;
  sheet.position.y = 0.1;
  scene.add(sheet);

  const ground = new Mesh(new PlaneGeometry(12, 12), new ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -HEIGHT / 2 - 0.05;
  ground.receiveShadow = true;
  scene.add(ground);

  scene.add(new HemisphereLight(0xffffff, 0x404040, 1.4));
  const sun = new DirectionalLight(0xffffff, 2.2);
  sun.position.set(2, 4, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(phone ? 512 : 1024, phone ? 512 : 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -2.5;
  sun.shadow.camera.right = sun.shadow.camera.top = 2.5;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const look = new Vector3();
  const back = phone ? 1.45 : 1;

  return {
    frame({ progress }: { progress: number }) {
      const s = shots.sample(progress);
      // The paper keeps its length: as each face tips by `angle`, it covers less width and stands out further.
      const angle = s.fold * MAX_ANGLE;
      const across = face * Math.cos(angle);
      const depth = face * Math.sin(angle);
      for (let i = 0; i < columns; i++) {
        const x = (i - FOLDS) * across;
        const z = (i % 2) * depth - depth / 2;
        position.setX(i, x).setZ(i, z); // top row
        position.setX(i + columns, x).setZ(i + columns, z); // bottom row
      }
      position.needsUpdate = true;
      geometry.computeBoundingSphere();
      sheet.rotation.y = s.turn;
      camera.position.set(s.cam[0] * back, s.cam[1], s.cam[2] * back);
      look.set(phone ? 0 : s.look[0], s.look[1] + (phone ? 0.7 : 0), s.look[2]);
      camera.lookAt(look);
    },
    theme() {
      paper.color.copy(palette.accent);
    },
  };
}

function Readout() {
  const progress = useSceneProgress();
  const fold = useTransform(progress, (p) => `fold ${shots.sample(p).fold.toFixed(2)}`);
  return (
    <motion.span aria-hidden="true" className="absolute top-16 right-4 font-mono text-caption1 text-fg-subtle tabular-nums md:top-6 md:right-6">
      {fold}
    </motion.span>
  );
}

const BEATS = [
  { from: 0, to: 0.33, title: "One sheet, twelve folds", body: "Scroll down and the sheet folds, scroll back up and it opens again." },
  { from: 0.33, to: 0.66, title: "The camera follows cues", body: "Four cues pin the camera, the turn and the fold. Between them everything blends." },
  { from: 0.66, to: 1, title: "Drawn only when it changes", body: "While the page is still, off screen or in a hidden tab, no frames are drawn." },
];

export default function Demo() {
  return (
    <ScrollScene
      length={3}
      label="Folding sheet"
      className="w-full"
      stage={
        <>
          <ThreeScene setup={setup} shadows label="A sheet of paper folding into pleats as you scroll" />
          <Readout />
        </>
      }
    >
      {BEATS.map((beat, i) => (
        <ScrollBeat key={beat.title} from={beat.from} to={beat.to} className="items-end pb-24 md:items-center md:pb-12">
          <div className="flex max-w-sm flex-col gap-2">
            <span className="font-mono text-footnote text-accent-ink tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="text-title2 text-fg">{beat.title}</h3>
            <p className="text-body text-fg-muted">{beat.body}</p>
          </div>
        </ScrollBeat>
      ))}
    </ScrollScene>
  );
}
