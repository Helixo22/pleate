// Run with: node --test packages/pleate/src/effects/three-scene/models.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { AnimationClip, BoxGeometry, Mesh, MeshBasicMaterial, NumberKeyframeTrack, PerspectiveCamera, Vector3 } from "three";
import { frameObject, loadModel, scrubAnimation } from "./models.ts";

const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} is not ${b}`);

test("scrubAnimation seeks forwards and backwards, and short clips hold their last frame", () => {
  const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  const long = new AnimationClip("move", 2, [new NumberKeyframeTrack(".position[x]", [0, 2], [0, 10])]);
  const short = new AnimationClip("lift", 1, [new NumberKeyframeTrack(".position[y]", [0, 1], [0, 4])]);
  const scrub = scrubAnimation(mesh, [long, short]);
  assert.equal(scrub.duration, 2);
  scrub.seek(1);
  near(mesh.position.x, 10);
  near(mesh.position.y, 4);
  scrub.seek(0.3);
  near(mesh.position.x, 3);
  near(mesh.position.y, 2.4);
  scrub.seek(0.75);
  near(mesh.position.x, 7.5);
  near(mesh.position.y, 4);
  scrub.seek(0);
  near(mesh.position.x, 0);
  near(mesh.position.y, 0);
});

test("scrubAnimation plays only the named clips", () => {
  const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  const a = new AnimationClip("a", 1, [new NumberKeyframeTrack(".position[x]", [0, 1], [0, 1])]);
  const b = new AnimationClip("b", 1, [new NumberKeyframeTrack(".position[y]", [0, 1], [0, 1])]);
  scrubAnimation(mesh, [a, b], ["b"]).seek(1);
  near(mesh.position.x, 0);
  near(mesh.position.y, 1);
});

test("frameObject backs the camera off until the object fits", () => {
  const camera = new PerspectiveCamera(40, 0.5, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  const mesh = new Mesh(new BoxGeometry(2, 2, 2), new MeshBasicMaterial());
  mesh.position.set(5, 0, 0);
  mesh.updateMatrixWorld();
  const center = frameObject(camera, mesh, 1);
  near(center.x, 5);
  const radius = Math.sqrt(3);
  const horizontal = Math.atan(Math.tan((40 * Math.PI) / 360) * 0.5);
  near(camera.position.distanceTo(center), radius / Math.sin(horizontal), 1e-4);
  // still looking along -z, straight at the center
  const dir = camera.getWorldDirection(new Vector3());
  near(dir.z, -1, 1e-6);
});

test("loadModel reads a glTF from a URL", async () => {
  // three's FileLoader reports progress with the browser's ProgressEvent, which Node does not have.
  (globalThis as Record<string, unknown>).ProgressEvent ??= class extends Event {
    constructor(type: string, init: Record<string, unknown> = {}) {
      super(type);
      Object.assign(this, init);
    }
  };
  // One triangle, its buffer inlined as a data URI.
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const buffer = Buffer.from(positions.buffer).toString("base64");
  const gltf = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "tri" }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: 36, uri: `data:application/octet-stream;base64,${buffer}` }],
    bufferViews: [{ buffer: 0, byteLength: 36 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
  };
  const url = `data:model/gltf+json;base64,${Buffer.from(JSON.stringify(gltf)).toString("base64")}`;
  const model = await loadModel(url, { shadows: true });
  const tri = model.scene.getObjectByName("tri") as Mesh;
  assert.ok(tri);
  assert.equal(tri.geometry.getAttribute("position").count, 3);
  assert.equal(tri.castShadow, true);
});
