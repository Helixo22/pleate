// Models made in Blender, Cinema 4D or any tool that exports glTF, for a ThreeScene.
// - loadModel: loads a .glb/.gltf. The loaders are imported only when it is first called, so a scene without models
//   never ships them. Meshopt geometry works out of the box (its decoder is bundled). Draco geometry and KTX2 textures
//   need their decoder files served from your own site: pass the folder in `draco` / `ktx2` (copy them from
//   node_modules/three/examples/jsm/libs/draco and .../basis). Nothing is fetched from a third-party CDN.
// - scrubAnimation: puts a model's animation clips on the scroll. seek(0..1) shows the frame at that point.
// - frameObject: points a camera at an object of any size, so a model's export scale does not matter.
// Compress models with gltf-transform (`npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt
// --texture-compress webp`) before shipping them.

import { AnimationMixer, Box3, LoopOnce, Sphere, Vector3, type AnimationClip, type Object3D, type PerspectiveCamera, type WebGLRenderer } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

export type { GLTF };

export type LoadModelOptions = {
  /** Folder with the Draco decoder files (draco_decoder.js, draco_decoder.wasm, draco_wasm_wrapper.js). */
  draco?: string;
  /** Folder with the Basis transcoder files (basis_transcoder.js, basis_transcoder.wasm). Needs `renderer`. */
  ktx2?: string;
  /** The scene's renderer: KTX2 needs it to pick a texture format the GPU supports. */
  renderer?: WebGLRenderer;
  /** Turn on shadows for every mesh in the model. */
  shadows?: boolean;
  onProgress?: (loaded: number, total: number) => void;
};

export async function loadModel(url: string, options: LoadModelOptions = {}): Promise<GLTF> {
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import("three/addons/loaders/GLTFLoader.js"),
    import("three/addons/libs/meshopt_decoder.module.js"),
  ]);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const cleanup: (() => void)[] = [];
  if (options.draco) {
    const { DRACOLoader } = await import("three/addons/loaders/DRACOLoader.js");
    const draco = new DRACOLoader().setDecoderPath(options.draco.endsWith("/") ? options.draco : `${options.draco}/`);
    loader.setDRACOLoader(draco);
    cleanup.push(() => draco.dispose());
  }
  if (options.ktx2) {
    if (!options.renderer) throw new Error("pleate loadModel: ktx2 needs the renderer (ctx.renderer)");
    const { KTX2Loader } = await import("three/addons/loaders/KTX2Loader.js");
    const ktx2 = new KTX2Loader().setTranscoderPath(options.ktx2.endsWith("/") ? options.ktx2 : `${options.ktx2}/`).detectSupport(options.renderer);
    loader.setKTX2Loader(ktx2);
    cleanup.push(() => ktx2.dispose());
  }
  try {
    const gltf = await loader.loadAsync(url, (e) => options.onProgress?.(e.loaded, e.total));
    if (options.shadows) {
      gltf.scene.traverse((node) => {
        if ((node as { isMesh?: boolean }).isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
    }
    return gltf;
  } finally {
    for (const done of cleanup) done();
  }
}

export type Scrubber = {
  mixer: AnimationMixer;
  /** Length of the longest clip, in seconds. */
  duration: number;
  /** Shows the frame at `t` (0..1 of the longest clip). */
  seek: (t: number) => void;
};

/** Plays `clips` (all of them, or the ones named in `names`) as one timeline driven by seek(). */
export function scrubAnimation(root: Object3D, clips: AnimationClip[], names?: string[]): Scrubber {
  const mixer = new AnimationMixer(root);
  const chosen = names ? clips.filter((c) => names.includes(c.name)) : clips;
  const duration = chosen.reduce((d, c) => Math.max(d, c.duration), 0);
  // Every action stays paused and is placed by hand, so none of them ever "finishes" (a finished action stops
  // applying its pose) and a shorter clip simply holds its last frame.
  const actions = chosen.map((clip) => {
    const action = mixer.clipAction(clip);
    action.setLoop(LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    action.paused = true;
    return action;
  });
  const seek = (t: number) => {
    const time = Math.max(0, Math.min(1, t)) * duration;
    for (const action of actions) action.time = Math.min(time, action.getClip().duration);
    mixer.update(0);
  };
  seek(0);
  return { mixer, duration, seek };
}

const box = new Box3();
const sphere = new Sphere();
const dir = new Vector3();

/**
 * Moves `camera` back along its current view direction until `object` fits, with `margin` extra room (1.2 = 20%).
 * Returns the object's center, to use as the camera's target.
 */
export function frameObject(camera: PerspectiveCamera, object: Object3D, margin = 1.2) {
  box.setFromObject(object).getBoundingSphere(sphere);
  // Fit the tighter of the two angles: the vertical field of view, or the horizontal one on a narrow screen.
  const vertical = (camera.fov * Math.PI) / 360;
  const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
  const fit = (sphere.radius * margin) / Math.sin(Math.min(vertical, horizontal));
  camera.getWorldDirection(dir);
  camera.position.copy(sphere.center).addScaledVector(dir, -fit);
  camera.near = Math.max(0.01, fit - sphere.radius * 4);
  camera.far = fit + sphere.radius * 4;
  camera.updateProjectionMatrix();
  camera.lookAt(sphere.center);
  return sphere.center.clone();
}
