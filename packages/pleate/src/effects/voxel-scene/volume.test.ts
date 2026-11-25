import assert from "node:assert/strict";
import { test } from "node:test";
import { PixelBuffer } from "../pixel-art/buffer.ts";
import { meshVolume } from "./mesher.ts";
import { decodeVolume, encodeVolume, parseVox, solids, Volume, volumeFromPixels } from "./volume.ts";

test("a box becomes six rectangles", () => {
  const v = new Volume(6, 4, 5).fill(solids.box(0, 0, 0, 6, 4, 5), "#fff");
  const mesh = meshVolume(v);
  assert.equal(mesh.indices.length, 6 * 6);
  assert.equal(mesh.positions.length, 6 * 4 * 3);
  assert.ok(mesh.shade.every((s) => s === 255));
});

test("every triangle faces the way its normal says", () => {
  const v = new Volume(7, 7, 7).fill(solids.ellipsoid(3, 3, 3, 3.4, 3.4, 3.4), "#fff").carve(solids.box(3, 3, 3, 2, 4, 2));
  const { positions: p, normals: n, indices } = meshVolume(v);
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [indices[i] * 3, indices[i + 1] * 3, indices[i + 2] * 3];
    const e1 = [0, 1, 2].map((k) => p[b + k] - p[a + k]);
    const e2 = [0, 1, 2].map((k) => p[c + k] - p[a + k]);
    const cross = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    assert.ok(cross[0] * n[a] + cross[1] * n[a + 1] + cross[2] * n[a + 2] > 0);
  }
});

test("the faces cover exactly the visible surface", () => {
  const v = new Volume(9, 9, 9).fill(solids.ellipsoid(4, 4, 4, 4, 4, 4), "#fff").speckle("#f00", 0.3);
  let visible = 0;
  for (let z = 0; z < 9; z++)
    for (let y = 0; y < 9; y++)
      for (let x = 0; x < 9; x++) {
        if (!v.get(x, y, z)) continue;
        for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) if (!v.get(x + dx, y + dy, z + dz)) visible++;
      }
  const { positions: p, indices } = meshVolume(v);
  let area = 0;
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [indices[i] * 3, indices[i + 1] * 3, indices[i + 2] * 3];
    const e1 = [0, 1, 2].map((k) => p[b + k] - p[a + k]);
    const e2 = [0, 1, 2].map((k) => p[c + k] - p[a + k]);
    area += Math.hypot(e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]) / 2;
  }
  assert.equal(Math.round(area), visible);
});

test("inner corners are darker", () => {
  const v = new Volume(4, 4, 4).fill(solids.box(0, 0, 0, 4, 1, 4), "#fff").fill(solids.box(0, 1, 0, 1, 3, 4), "#fff");
  assert.ok(meshVolume(v).shade.some((s) => s < 255));
});

test("a model survives the compact string", () => {
  const v = new Volume(5, 6, 7).fill(solids.cylinder(2, 3, 0, 6, 2.4, 1), "var(--pl-accent)").speckle("#123456", 0.4);
  const back = decodeVolume(encodeVolume(v));
  assert.deepEqual([...back.data], [...v.data]);
  assert.deepEqual(back.palette, v.palette);
  assert.throws(() => decodeVolume("hello"));
  assert.throws(() => decodeVolume("2x2x2|#fff|1*5"));
  assert.throws(() => decodeVolume("2x2x2|#fff|9*8"));
});

test("a drawing stands upright with its depth", () => {
  const v = volumeFromPixels(new PixelBuffer(3).rect(0, 0, 1, 1, "#f00"), 2);
  assert.equal(v.count, 2);
  assert.equal(v.get(0, 2, 0), 1);
});

test("reads a MagicaVoxel file", () => {
  const bytes: number[] = [];
  const text = (s: string) => bytes.push(...[...s].map((c) => c.charCodeAt(0)));
  const int = (n: number) => bytes.push(n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255);
  const chunk = (id: string, body: () => void, length: number) => (text(id), int(length), int(0), body());
  text("VOX "), int(150), text("MAIN"), int(0), int(0);
  chunk("SIZE", () => (int(2), int(3), int(4)), 12);
  chunk("XYZI", () => (int(1), bytes.push(1, 0, 3, 2)), 8);
  chunk("RGBA", () => Array.from({ length: 256 }, (_, i) => bytes.push(i, 0, 0, 255)), 1024);
  const v = parseVox(new Uint8Array(bytes).buffer);
  assert.deepEqual([v.width, v.height, v.depth, v.count], [2, 4, 3, 1]);
  assert.equal(v.palette[v.get(1, 3, 2) - 1], "#010000");
  assert.throws(() => parseVox(new ArrayBuffer(40)));
});
