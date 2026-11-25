// Ready voxel models, made of parts that come apart (explode) or move on their own. Each one is code built from solids,
// so a model weighs about a kilobyte and is meshed only when a scene uses it.
import { pixelDrawing, pixelRamps as r } from "../pixel-gallery/drawings.ts";
import { solids, Volume, volumeFromPixels, voxelModel, type VoxelModel } from "../voxel-scene/volume.ts";

const { box, ellipsoid, cylinder, ring, and, or, not } = solids;

/** A round volume: `paint` fills it, centered on c. */
const round = (size: number, height: number, paint: (v: Volume, c: number) => void) => {
  const v = new Volume(size, height, size);
  paint(v, (size - 1) / 2);
  return v;
};

/** The same model at half the size, keeping one voxel in eight. */
const half = (v: Volume) => {
  const small = new Volume(v.width >> 1, v.height >> 1, v.depth >> 1, v.palette);
  for (let z = 0; z < small.depth; z++)
    for (let y = 0; y < small.height; y++) for (let x = 0; x < small.width; x++) small.data[x + small.width * (y + small.height * z)] = v.get(x * 2, y * 2, z * 2 + 1);
  return small;
};

/* ---------------------------------------------------------------------------------------------------------- food */

export const voxelBurger: VoxelModel = {
  id: "burger",
  name: "Burger",
  parts: [
    { id: "bottom", volume: () => round(26, 5, (v, c) => v.fill(cylinder(c, c, 0, 5, 11.6, 12.6), r.orange[0]).paint(box(0, 4, 0, 26, 1, 26), r.cream[1])) },
    { id: "lettuce", at: [0, 5, 0], away: [0, 7, 0], volume: () => round(30, 3, (v, c) => v.fill((x, y, z) => Math.hypot(x - c, z - c) < 13 + Math.sin(Math.atan2(z - c, x - c) * 11) * 1.4 && y === (Math.hypot(x - c, z - c) > 11 && Math.sin(Math.atan2(z - c, x - c) * 7) > 0 ? 0 : 1), r.green[1]).speckle(r.green[0], 0.35)) },
    { id: "patty", at: [0, 7, 0], away: [0, 14, 0], volume: () => round(28, 5, (v, c) => v.fill(and(cylinder(c, c, 0, 5, 13.2, 13.2), not(and(or(box(0, 0, 0, 28, 1, 28), box(0, 4, 0, 28, 1, 28)), (x, _y, z) => Math.hypot(x - c, z - c) > 12.2))), r.brown[1]).speckle(r.brown[2], 0.35).speckle(r.brown[0], 0.08, undefined, 2)) },
    { id: "cheese", at: [0, 12, 0], away: [0, 20, 0], volume: () => round(26, 5, (v, c) => v.fill(box(1, 4, 1, 24, 1, 24), r.yellow[1]).fill((x, y, z) => (x === 1 || x === 24 || z === 1 || z === 24) && x > 0 && x < 25 && z > 0 && z < 25 && y >= 1 + Math.abs(((x + z) % 12) - 6) * 0.6, r.yellow[1]).carve((x, y, z) => y < 4 && Math.hypot(x - c, z - c) < 12.6)) },
    { id: "tomato", at: [0, 17, 0], away: [0, 27, 0], volume: () => round(24, 2, (v, c) => v.fill(cylinder(c, c, 0, 2, 11.4), r.red[1]).paint((x, y, z) => y === 1 && Math.hypot(x - c, z - c) < 9.6 && (Math.abs(x - c) > 1 || Math.abs(z - c) > 1) && Math.sin(Math.atan2(z - c, x - c) * 6) > -0.2, r.red[0])) },
    { id: "top", at: [0, 19, 0], away: [0, 36, 0], volume: () => round(28, 12, (v, c) => v.fill(and(ellipsoid(c, 0, c, 13, 11.6, 13), box(0, 0, 0, 28, 12, 28)), r.orange[1]).paint((x, y, z) => y < 1 && Math.hypot(x - c, z - c) < 14, r.orange[0]).speckle(r.cream[0], 0.06, (_x, y) => y > 5)) },
  ],
};

export const voxelCoffee: VoxelModel = {
  id: "coffee",
  name: "Coffee cup",
  parts: [
    { id: "saucer", volume: () => round(32, 3, (v, c) => v.fill(cylinder(c, c, 0, 1, 9), r.white[1]).fill(cylinder(c, c, 1, 2, 14, 15.6), r.white[1]).carve(cylinder(c, c, 2, 1, 12.4)).paint((x, y, z) => y === 2 && Math.hypot(x - c, z - c) > 14.2, r.teal[1])) },
    {
      id: "cup", at: [3, 2, 0], away: [0, 10, 0],
      volume: () => {
        const v = new Volume(28, 15, 20);
        const c = 9.5;
        v.fill(and(ring(20, 8, c, 5, 2.6, 3), (x) => x > 17), r.white[0]);
        v.fill(cylinder(c, c, 0, 15, 5.5, 9.8), r.white[0]).carve(cylinder(c, c, 2, 14, 4, 8.6));
        v.paint((x, y, z) => y >= 8 && y <= 10 && Math.hypot(x - c, z - c) < 10.4, r.teal[1]);
        return v;
      },
    },
    { id: "coffee", at: [-1, 13, 0], away: [0, 20, 0], volume: () => round(18, 2, (v, c) => v.fill(cylinder(c, c, 0, 2, 8.4), r.brown[2]).paint((x, _y, z) => Math.abs(Math.hypot(x - c, z - c) - 4.6) < 1 || Math.hypot(x - c, z - c) < 1.6, r.brown[0])) },
    { id: "steam", at: [-1, 17, 0], away: [0, 24, 0], volume: () => new Volume(13, 11, 3).fill((x, y, z) => z === 1 && [2, 6, 10].some((base, i) => Math.round(base + Math.sin((y + i * 2) * 0.9)) === x && y > i && y < 9 + (i % 2) * 2), r.grey[0]) },
  ],
};

export const voxelRamen: VoxelModel = {
  id: "ramen",
  name: "Ramen",
  parts: [
    { id: "bowl", volume: () => round(34, 16, (v, c) => v.fill(cylinder(c, c, 0, 3, 8), r.red[2]).fill(cylinder(c, c, 3, 13, 9, 16.6), r.red[1]).carve(cylinder(c, c, 5, 12, 8, 15.2)).paint((x, y, z) => y === 13 && Math.hypot(x - c, z - c) > 13, r.cream[0]).paint((x, y, z) => y >= 8 && y <= 10 && Math.round(Math.atan2(z - c, x - c) * 8) % 4 === 0, r.cream[0])) },
    { id: "broth", at: [0, 11, 0], away: [0, 14, 0], volume: () => round(28, 2, (v, c) => v.fill(cylinder(c, c, 0, 2, 13.8), r.orange[1]).speckle(r.orange[0], 0.2).speckle(r.yellow[0], 0.04, undefined, 3)) },
    { id: "noodles", at: [0, 12, 2], away: [0, 24, 0], volume: () => round(22, 4, (v, c) => v.fill((x, y, z) => ((x - c) / 10) ** 2 + (y / 3.6) ** 2 + ((z - c) / 8) ** 2 < 1, r.yellow[0]).paint((x, y, z) => (x + y + Math.round(Math.sin(z * 0.7) * 2)) % 3 === 0, r.yellow[1])) },
    { id: "egg", at: [-6, 13, 3], away: [-10, 30, 0], volume: () => new Volume(9, 4, 11).fill(and(ellipsoid(4, 0, 5, 4.4, 4, 5.4), box(0, 0, 0, 9, 4, 11)), r.white[0]).paint((x, y, z) => y > 1 && Math.hypot(x - 4, z - 5) < 2.4, r.orange[1]) },
    { id: "nori", at: [6, 12, -7], away: [10, 28, -4], volume: () => new Volume(9, 12, 2).fill(box(0, 0, 0, 9, 12, 2), r.green[2]).speckle("#17403a", 0.4) },
    { id: "onion", at: [5, 14, 4], away: [4, 34, 6], volume: () => new Volume(11, 2, 9).fill((x, y, z) => y === 0 && [[2, 2], [7, 3], [4, 6], [9, 7]].some(([a, b]) => Math.abs(Math.hypot(x - a, z - b) - 1.2) < 0.6), r.green[0]) },
    { id: "sticks", at: [7, 15, 0], away: [16, 34, 0], volume: () => new Volume(24, 8, 8).fill((x, y, z) => Math.round(1 + x * 0.22) === y && (z === Math.round(2 + x * 0.06) || z === Math.round(6 - x * 0.02)), r.brown[0]) },
  ],
};

/* ------------------------------------------------------------------------------------------------------- places */

export const voxelHouse: VoxelModel = {
  id: "house",
  name: "House",
  parts: [
    { id: "garden", volume: () => new Volume(40, 3, 36).fill(box(1, 0, 1, 38, 2, 34), r.brown[1]).fill(box(0, 2, 0, 40, 1, 36), r.green[1]).speckle(r.green[0], 0.25, box(0, 2, 0, 40, 1, 36)).paint(box(17, 2, 26, 6, 1, 10), r.cream[2]) },
    {
      id: "walls", at: [0, 3, -1], away: [0, 8, 0],
      volume: () => {
        const v = new Volume(26, 16, 22);
        v.fill(box(0, 0, 0, 26, 16, 22), r.cream[1]).carve(box(2, 1, 2, 22, 15, 18)).paint(box(0, 0, 0, 26, 2, 22), r.grey[2]);
        v.paint(box(10, 1, 20, 6, 10, 2), r.red[1]).paint(box(14, 5, 21, 1, 2, 1), r.yellow[0]);
        for (const x of [3, 18]) v.paint(box(x - 1, 5, 21, 7, 7, 1), r.white[0]).paint(box(x, 6, 21, 5, 5, 1), r.blue[0]).paint(box(x + 2, 6, 21, 1, 5, 1), r.white[0]);
        v.paint(box(25, 5, 7, 1, 7, 8), r.white[0]).paint(box(25, 6, 8, 1, 5, 6), r.blue[0]);
        return v;
      },
    },
    { id: "roof", at: [0, 19, -1], away: [0, 24, 0], volume: () => new Volume(30, 14, 26).fill((x, y, z) => x >= y && x < 30 - y && z >= 0 && y < 14, r.red[1]).paint((x, y) => (x + y * 2) % 4 === 0, r.red[2]).paint((x, y, z) => (z === 0 || z === 25) && x > y + 1 && x < 28 - y, r.cream[0]) },
    { id: "chimney", at: [8, 24, -5], away: [10, 36, 0], volume: () => new Volume(5, 11, 5).fill(box(0, 0, 0, 5, 11, 5), r.brown[1]).speckle(r.brown[0], 0.3).fill(box(0, 9, 0, 5, 2, 5), r.grey[2]).carve(box(1, 9, 1, 3, 2, 3)) },
    { id: "tree", at: [-15, 3, 9], away: [-14, 6, 8], volume: () => round(13, 20, (v, c) => v.fill(cylinder(c, c, 0, 9, 1.6), r.brown[1]).fill(ellipsoid(c, 12.5, c, 6.2, 7, 6.2), r.green[1]).speckle(r.green[0], 0.3, box(0, 6, 0, 13, 14, 13)).speckle(r.red[1], 0.025, box(0, 6, 0, 13, 14, 13), 5)) },
  ],
};

export const voxelLighthouse: VoxelModel = {
  id: "lighthouse",
  name: "Lighthouse",
  parts: [
    { id: "sea", volume: () => round(40, 2, (v, c) => v.fill(cylinder(c, c, 0, 2, 19.6), r.blue[1]).speckle(r.blue[0], 0.18).speckle(r.white[0], 0.03, undefined, 4)) },
    { id: "rock", at: [0, 1, 0], away: [0, 4, 0], volume: () => round(28, 8, (v, c) => v.fill((x, y, z) => Math.hypot(x - c, z - c) < 13 - y * 0.7 + Math.sin(x * 1.7 + z * 0.9) * 1.1, r.grey[2]).speckle(r.grey[1], 0.3).speckle(r.green[1], 0.5, box(0, 7, 0, 28, 1, 28))) },
    { id: "tower", at: [0, 9, 0], away: [0, 14, 0], volume: () => round(16, 26, (v, c) => v.fill(cylinder(c, c, 0, 26, 7.4, 5), r.white[0]).paint((_x, y) => Math.floor(y / 5) % 2 === 1, r.red[1]).paint(box(6, 0, 12, 4, 6, 4), r.brown[2]).paint(box(7, 12, 11, 2, 3, 5), r.dark[1])) },
    { id: "deck", at: [0, 35, 0], away: [0, 24, 0], volume: () => round(16, 4, (v, c) => v.fill(cylinder(c, c, 0, 1, 7.2), r.dark[1]).fill((x, y, z) => Math.abs(Math.hypot(x - c, z - c) - 6.4) < 0.6 && (y === 3 || (x + z) % 3 === 0), r.dark[1])) },
    { id: "lamp", at: [0, 36, 0], away: [0, 32, 0], volume: () => round(10, 6, (v, c) => v.fill(cylinder(c, c, 0, 6, 3.6), r.yellow[0]).paint((x, _y, z) => x === 2 || x === 7 || z === 2 || z === 7, r.yellow[1])) },
    { id: "cap", at: [0, 42, 0], away: [0, 42, 0], volume: () => round(14, 7, (v, c) => v.fill(cylinder(c, c, 0, 5, 5.8, 1.2), r.red[1]).fill(cylinder(c, c, 5, 2, 0.9), r.dark[1])) },
  ],
};

/* ------------------------------------------------------------------------------------------------------- nature */

export const voxelPlant: VoxelModel = {
  id: "plant",
  name: "Potted plant",
  parts: [
    { id: "pot", volume: () => round(20, 13, (v, c) => v.fill(cylinder(c, c, 0, 11, 6, 8.4), r.orange[2]).fill(cylinder(c, c, 10, 3, 9.6), r.orange[1]).carve(cylinder(c, c, 11, 2, 7.8)).paint((x, y, z) => y === 5 && (x + z) % 2 === 0, r.orange[0])) },
    { id: "soil", at: [0, 11, 0], away: [0, 10, 0], volume: () => round(16, 1, (v, c) => v.fill(cylinder(c, c, 0, 1, 7.7), r.brown[2]).speckle(r.brown[1], 0.3)) },
    {
      id: "leaves", at: [0, 12, 0], away: [0, 18, 0],
      volume: () => {
        const v = new Volume(34, 24, 34);
        const c = 16.5;
        for (let i = 0; i < 9; i++) {
          const a = (i * Math.PI * 2) / 9 + (i % 2) * 0.3;
          const long = 10 + (i % 3) * 2.4;
          const lift = 1.1 + (i % 3) * 0.45;
          for (let s = 0; s <= long * 2; s++) {
            const t = s / (long * 2);
            const reach = t * long;
            const y = Math.round(lift * reach - t * t * t * lift * long * 0.62);
            const half = Math.sin(Math.min(1, t * 1.05) * Math.PI) * 2.6;
            for (let w = -half; w <= half; w += 0.5) v.set(Math.round(c + Math.cos(a) * reach - Math.sin(a) * w), Math.max(0, y), Math.round(c + Math.sin(a) * reach + Math.cos(a) * w), Math.abs(w) < 0.4 ? r.green[0] : i % 2 ? r.green[1] : r.green[2]);
          }
        }
        return v;
      },
    },
  ],
};

/* ------------------------------------------------------------------------------------------------------ objects */

export const voxelRocket: VoxelModel = {
  id: "rocket",
  name: "Rocket",
  parts: [
    { id: "flame", volume: () => round(10, 8, (v, c) => v.fill(cylinder(c, c, 0, 8, 0.8, 4), r.orange[1]).fill(cylinder(c, c, 3, 5, 0.8, 4.2), r.yellow[0])), away: [0, -10, 0] },
    {
      id: "fins", at: [0, 6, 0], away: [0, 0, 0],
      volume: () => {
        const v = new Volume(32, 16, 32);
        const c = 15.5;
        v.fill((x, y, z) => {
          const thin = Math.abs(z - c) < 1.2 ? Math.abs(x - c) : Math.abs(x - c) < 1.2 ? Math.abs(z - c) : -1;
          return thin > 5 && thin < 14.5 - Math.max(0, y - 4) * 0.8 && y > (thin - 8) * 0.4 - 1;
        }, r.red[1]);
        return v;
      },
    },
    { id: "body", at: [0, 8, 0], away: [0, 8, 0], volume: () => round(18, 24, (v, c) => v.fill((x, y, z) => Math.hypot(x - c, z - c) < 6 + Math.sin((y / 24) * Math.PI) * 2.2, r.white[1]).paint((_x, y) => y === 2 || y === 3 || y === 22, r.grey[1]).paint((x, y, z) => z > c && Math.hypot(x - c, y - 15) < 4, r.dark[1]).paint((x, y, z) => z > c && Math.hypot(x - c, y - 15) < 2.7, r.blue[0])) },
    { id: "nose", at: [0, 32, 0], away: [0, 22, 0], volume: () => round(14, 13, (v, c) => v.fill((x, y, z) => Math.hypot(x - c, z - c) < 6.2 * Math.sqrt(Math.max(0, 1 - y / 13)), r.red[1])) },
  ],
};

export const voxelCamera: VoxelModel = {
  id: "camera",
  name: "Camera",
  parts: [
    { id: "body", volume: () => new Volume(34, 20, 12).fill(box(0, 0, 0, 34, 20, 12), r.dark[1]).paint(box(0, 15, 0, 34, 5, 12), r.grey[0]).paint(box(0, 0, 0, 34, 1, 12), r.grey[1]).speckle(r.dark[2], 0.35, box(0, 1, 0, 34, 14, 12)).carve((x, y) => (x === 0 || x === 33) && (y === 0 || y === 19)) },
    { id: "lens", at: [0, 1, 9], away: [0, 0, 18], volume: () => {
      const v = new Volume(18, 18, 8);
      const disc = (radius: number, from: number, to: number) => (x: number, y: number, z: number) => Math.hypot(x - 8.5, y - 8.5) < radius && z >= from && z < to;
      v.fill(disc(8.6, 0, 4), r.grey[0]).fill(disc(7.4, 4, 8), r.dark[2]).carve(disc(5.6, 6, 8)).paint(disc(5.6, 5, 6), r.blue[2]);
      return v.paint((x, y, z) => z === 5 && Math.hypot(x - 8.5, y - 8.5) < 3.6, r.blue[1]).paint((x, y, z) => z === 5 && Math.hypot(x - 7, y - 10.5) < 1.4, r.blue[0]);
    } },
    { id: "finder", at: [0, 20, 0], away: [0, 10, 0], volume: () => new Volume(12, 6, 10).fill((x, y) => x >= y * 0.4 && x < 12 - y * 0.4, r.grey[0]).paint(box(3, 1, 9, 6, 3, 1), r.blue[2]) },
    { id: "shutter", at: [-11, 20, 0], away: [-6, 9, 0], volume: () => round(6, 3, (v, c) => v.fill(cylinder(c, c, 0, 3, 2.8), r.red[1])) },
    { id: "dial", at: [11, 20, 0], away: [6, 9, 0], volume: () => round(8, 3, (v, c) => v.fill(cylinder(c, c, 0, 3, 4), r.dark[1]).paint((x, _y, z) => (x + z) % 2 === 0, r.dark[0])) },
  ],
};

export const voxelComputer: VoxelModel = {
  id: "computer",
  name: "Computer",
  parts: [
    { id: "keyboard", at: [0, 0, 15], away: [0, -2, 14], volume: () => {
      const v = new Volume(32, 3, 12).fill((_x, y, z) => y <= (11 - z) * 0.2 + 0.4, r.cream[2]);
      for (let z = 1; z < 11; z += 2) for (let x = 1; x < 31; x += 2) for (let y = 2; y >= 0; y--) if (v.get(x, y, z)) { v.set(x, y, z, r.cream[0]); break; }
      return v;
    } },
    { id: "base", volume: () => new Volume(34, 7, 22).fill(box(0, 0, 0, 34, 7, 22), r.cream[1]).paint(box(20, 3, 21, 11, 2, 1), r.dark[1]).paint(box(3, 3, 21, 2, 1, 1), r.green[1]).paint((x, y, z) => z === 21 && y === 1 && x % 2 === 0 && x < 16, r.cream[2]) },
    { id: "monitor", at: [0, 8, 0], away: [0, 10, 0], volume: () => new Volume(30, 24, 18).fill((x, y, z) => z >= 10 || (x >= (10 - z) * 0.6 && x < 30 - (10 - z) * 0.6 && y >= (10 - z) * 0.4 && y < 24 - (10 - z) * 0.5), r.cream[1]).carve(box(4, 5, 15, 22, 15, 3)).fill(box(13, 0, 6, 4, 1, 4), r.cream[2]).paint(box(24, 2, 17, 2, 1, 1), r.red[1]) },
    { id: "screen", at: [0, 13, 7], away: [0, 10, 16], volume: () => new Volume(22, 15, 1).fill(box(0, 0, 0, 22, 15, 1), "#173a3a").paint((x, y) => (y === 12 && x > 1 && x < 10) || (y === 10 && x > 3 && x < 18) || (y === 8 && x > 3 && x < 13) || (y === 6 && x > 5 && x < 16) || (y === 4 && x > 1 && x < 6) || (y === 2 && x > 1 && x < 4), r.green[0]) },
  ],
};

export const voxelParcel: VoxelModel = {
  id: "parcel",
  name: "Parcel",
  parts: [
    { id: "box", volume: () => new Volume(28, 18, 28).fill(box(0, 0, 0, 28, 18, 28), r.brown[0]).carve(box(2, 2, 2, 24, 16, 24)).speckle("#b87a48", 0.18).paint(box(4, 4, 27, 9, 7, 1), r.white[0]).paint((x, y, z) => z === 27 && x > 4 && x < 12 && y > 4 && y < 8 && x % 2 === 0, r.dark[2]).paint(box(5, 9, 27, 6, 1, 1), r.grey[1]) },
    { id: "gift", at: [0, 2, 0], away: [0, 22, 0], volume: () => half(volumeFromPixels(pixelDrawing("gem"), 10, true)) },
    { id: "lid", at: [0, 18, 0], away: [0, 44, 0], volume: () => new Volume(30, 4, 30).fill(box(0, 0, 0, 30, 4, 30), r.brown[0]).carve(box(1, 0, 1, 28, 3, 28)).speckle("#b87a48", 0.18).paint(box(12, 0, 0, 6, 4, 30), "var(--pl-accent)") },
  ],
};

export const voxelBoat: VoxelModel = {
  id: "boat",
  name: "Sailboat",
  parts: [
    { id: "sea", volume: () => new Volume(44, 3, 26).fill((x, y, z) => ((x - 21.5) / 22) ** 2 + ((z - 12.5) / 13) ** 2 < 1 && y <= 1 + Math.round(Math.sin(x * 0.6 + z * 0.4) * 0.6 + 0.4), r.blue[1]).speckle(r.blue[0], 0.22).speckle(r.white[0], 0.05, undefined, 6) },
    { id: "hull", at: [0, 2, 0], away: [0, 8, 0], volume: () => {
      const hull = (inset: number) => (x: number, y: number, z: number) => Math.abs(z - 5.5) < (5.6 - inset) * Math.sqrt(Math.max(0, 1 - ((x - 13) / (14 + y * 0.7 - inset)) ** 2)) * (0.6 + y * 0.07);
      return new Volume(32, 8, 12).fill(hull(0), r.red[1]).carve(and(hull(1.6), (_x, y) => y > 4)).paint((_x, y) => y === 7, r.cream[0]).paint((_x, y) => y === 4, r.brown[0]);
    } },
    { id: "mast", at: [-1, 7, 0], away: [0, 16, 0], volume: () => new Volume(2, 34, 2).fill(box(0, 0, 0, 2, 34, 2), r.brown[1]) },
    { id: "main", at: [-9, 12, 0], away: [-12, 22, 0], volume: () => new Volume(14, 28, 2).fill((x, y, z) => z === 0 && x >= y * 0.48, r.cream[0]).paint((_x, y) => y === 9 || y === 10, r.orange[1]) },
    { id: "jib", at: [6, 12, 0], away: [12, 22, 0], volume: () => new Volume(11, 22, 2).fill((x, y, z) => z === 0 && x < 11 - y * 0.5, r.orange[1]) },
    { id: "flag", at: [2, 39, 0], away: [6, 30, 0], volume: () => new Volume(5, 3, 1).fill((x, y) => x < 5 - Math.abs(y - 1) * 2, r.teal[1]) },
  ],
};

export const voxelChest: VoxelModel = {
  id: "chest",
  name: "Treasure chest",
  parts: [
    { id: "base", volume: () => new Volume(32, 14, 22).fill(box(0, 0, 0, 32, 14, 22), r.brown[1]).carve(box(2, 2, 2, 28, 12, 18)).speckle(r.brown[0], 0.2).paint((x, y) => y === 0 || y === 13 || x < 2 || x > 29 || x === 8 || x === 23, r.yellow[1]).paint(box(13, 7, 21, 6, 7, 1), r.yellow[0]).paint(box(15, 9, 21, 2, 3, 1), r.dark[2]) },
    { id: "gold", at: [0, 8, 0], away: [0, 12, 0], volume: () => new Volume(28, 9, 18).fill((x, y, z) => y < 5 + Math.sin(x * 0.5) * 1.6 + Math.cos(z * 0.6) * 1.4, r.yellow[1]).speckle(r.yellow[0], 0.35).speckle(r.orange[1], 0.12, undefined, 2).speckle(r.red[1], 0.02, undefined, 8).speckle(r.teal[0], 0.02, undefined, 9) },
    { id: "lid", at: [0, 14, 0], away: [0, 30, 0], volume: () => new Volume(32, 11, 22).fill((_x, y, z) => ((z - 10.5) / 11) ** 2 + (y / 11) ** 2 < 1, r.brown[1]).carve((x, y, z) => x > 1 && x < 30 && ((z - 10.5) / 9) ** 2 + (y / 9) ** 2 < 1).speckle(r.brown[0], 0.2).paint((x, y) => y === 0 || x < 2 || x > 29 || x === 8 || x === 23, r.yellow[1]) },
  ],
};

/** Every model of the gallery. */
export const voxelModels: readonly VoxelModel[] = [
  voxelBurger,
  voxelCoffee,
  voxelRamen,
  voxelHouse,
  voxelLighthouse,
  voxelBoat,
  voxelPlant,
  voxelRocket,
  voxelCamera,
  voxelComputer,
  voxelParcel,
  voxelChest,
];

/** Any drawing of the pixel gallery as a standing voxel model. */
export const voxelDrawing = (id: string, depth = 5): VoxelModel => {
  const art = pixelDrawing(id);
  return voxelModel(`drawing-${id}`, art.name, () => volumeFromPixels(art, depth, true));
};
