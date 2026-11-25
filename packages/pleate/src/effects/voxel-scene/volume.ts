// Voxel models as data: a box of palette indexes, built from shapes, from a pixel drawing, from a compact string or from
// a MagicaVoxel file. Pure and free of three.js, so it runs anywhere and can be tested.
// Axes: x to the right, y up, z toward the viewer. Colors are any CSS color, theme variables included.

import { renderDrawing, type PixelBuffer, type PixelDrawing } from "../pixel-art/buffer.ts";

/** True where a solid covers the voxel at x, y, z. */
export type Solid = (x: number, y: number, z: number) => boolean;

const hash = (x: number, y: number, z: number, seed = 0) => {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 974634541) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export class Volume {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly data: Uint8Array;
  readonly palette: string[];

  constructor(width: number, height: number, depth: number, palette: readonly string[] = []) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.data = new Uint8Array(width * height * depth);
    this.palette = [...palette];
  }

  /** Number of a color (1 and up; 0 is empty), added to the palette the first time it is used. */
  ink(color: string) {
    const at = this.palette.indexOf(color);
    if (at >= 0) return at + 1;
    if (this.palette.length >= 255) throw new Error("pleate Volume: a model can use at most 255 colors");
    this.palette.push(color);
    return this.palette.length;
  }

  get(x: number, y: number, z: number) {
    if (x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.height || z >= this.depth) return 0;
    return this.data[x + this.width * (y + this.height * z)];
  }

  set(x: number, y: number, z: number, color: string | null) {
    if (x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.height || z >= this.depth) return this;
    this.data[x + this.width * (y + this.height * z)] = color ? this.ink(color) : 0;
    return this;
  }

  private each(solid: Solid, write: (at: number, x: number, y: number, z: number) => void) {
    for (let z = 0; z < this.depth; z++)
      for (let y = 0; y < this.height; y++)
        for (let x = 0; x < this.width; x++) if (solid(x, y, z)) write(x + this.width * (y + this.height * z), x, y, z);
    return this;
  }

  /** Fills a solid with a color. */
  fill(solid: Solid, color: string) {
    const ink = this.ink(color);
    return this.each(solid, (at) => (this.data[at] = ink));
  }

  /** Empties a solid. */
  carve(solid: Solid) {
    return this.each(solid, (at) => (this.data[at] = 0));
  }

  /** Recolors the voxels that are already there. */
  paint(solid: Solid, color: string) {
    const ink = this.ink(color);
    return this.each(solid, (at) => {
      if (this.data[at]) this.data[at] = ink;
    });
  }

  /** Recolors some of the voxels that are already there, at random but always the same ones. density is 0..1. */
  speckle(color: string, density: number, solid: Solid = () => true, seed = 0) {
    const ink = this.ink(color);
    return this.each(solid, (at, x, y, z) => {
      if (this.data[at] && hash(x, y, z, seed) < density) this.data[at] = ink;
    });
  }

  /** How many voxels are filled. */
  get count() {
    let n = 0;
    for (const v of this.data) if (v) n++;
    return n;
  }
}

/** Solids to fill, carve or paint. Coordinates are voxel centers. */
export const solids = {
  box:
    (x: number, y: number, z: number, w: number, h: number, d: number): Solid =>
    (px, py, pz) =>
      px >= x && px < x + w && py >= y && py < y + h && pz >= z && pz < z + d,
  ellipsoid:
    (cx: number, cy: number, cz: number, rx: number, ry: number, rz: number): Solid =>
    (x, y, z) =>
      ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 < 0.985,
  /** A vertical cylinder that can taper from its bottom radius to its top radius. */
  cylinder:
    (cx: number, cz: number, y: number, h: number, bottom: number, top = bottom): Solid =>
    (x, py, z) => {
      if (py < y || py >= y + h) return false;
      const radius = bottom + (top - bottom) * (h <= 1 ? 0 : (py - y) / (h - 1));
      return (x - cx) ** 2 + (z - cz) ** 2 < radius * radius * 0.985;
    },
  /** A ring standing up, facing z: handles and wheels. */
  ring:
    (cx: number, cy: number, cz: number, radius: number, thickness: number, depth = thickness): Solid =>
    (x, y, z) =>
      Math.abs(Math.hypot(x - cx, y - cy) - radius) < thickness / 2 && Math.abs(z - cz) < depth / 2,
  and:
    (...all: Solid[]): Solid =>
    (x, y, z) =>
      all.every((s) => s(x, y, z)),
  or:
    (...any: Solid[]): Solid =>
    (x, y, z) =>
      any.some((s) => s(x, y, z)),
  not:
    (solid: Solid): Solid =>
    (x, y, z) =>
      !solid(x, y, z),
};

/** A pixel drawing standing up, `depth` voxels thick. With `rim` the first and last layers are one pixel smaller. */
export function volumeFromPixels(art: PixelBuffer | Pick<PixelDrawing, "size" | "draw">, depth = 4, rim = false): Volume {
  const p = "data" in art ? art : renderDrawing(art);
  const v = new Volume(p.width, p.height, depth, p.palette);
  for (let y = 0; y < p.height; y++)
    for (let x = 0; x < p.width; x++) {
      const ink = p.get(x, y);
      if (!ink) continue;
      const edge = !p.get(x - 1, y) || !p.get(x + 1, y) || !p.get(x, y - 1) || !p.get(x, y + 1);
      for (let z = 0; z < depth; z++) {
        if (rim && depth > 2 && edge && (z === 0 || z === depth - 1)) continue;
        v.data[x + v.width * (p.height - 1 - y + v.height * z)] = ink;
      }
    }
  return v;
}

/* ------------------------------------------------------------------------------------------------ Compact string */

/** The model as a short string (run lengths in base 36), to keep in a file or a constant. */
export function encodeVolume(v: Volume): string {
  const runs: string[] = [];
  for (let i = 0; i < v.data.length; ) {
    let n = 1;
    while (i + n < v.data.length && v.data[i + n] === v.data[i]) n++;
    runs.push(n > 1 ? `${v.data[i].toString(36)}*${n.toString(36)}` : v.data[i].toString(36));
    i += n;
  }
  return `${v.width}x${v.height}x${v.depth}|${v.palette.join(";")}|${runs.join(" ")}`;
}

export function decodeVolume(text: string): Volume {
  const [size, palette, runs] = text.split("|");
  const [w, h, d] = (size ?? "").split("x").map(Number);
  if (!(w > 0 && h > 0 && d > 0) || runs === undefined) throw new Error("pleate decodeVolume: not a voxel model");
  const v = new Volume(w, h, d, palette ? palette.split(";") : []);
  let at = 0;
  for (const run of runs.split(" ")) {
    const [ink, n] = run.split("*").map((part) => parseInt(part, 36));
    const value = ink;
    const length = n ?? 1;
    if (!(value >= 0 && value <= v.palette.length) || !(length > 0) || at + length > v.data.length) throw new Error("pleate decodeVolume: damaged voxel model");
    v.data.fill(value, at, at + length);
    at += length;
  }
  if (at !== v.data.length) throw new Error("pleate decodeVolume: damaged voxel model");
  return v;
}

/* ------------------------------------------------------------------------------------------------ MagicaVoxel */

/** The first model of a MagicaVoxel .vox file, with its palette. */
export function parseVox(buffer: ArrayBuffer): Volume {
  const view = new DataView(buffer);
  const tag = (at: number) => String.fromCharCode(view.getUint8(at), view.getUint8(at + 1), view.getUint8(at + 2), view.getUint8(at + 3));
  if (buffer.byteLength < 20 || tag(0) !== "VOX ") throw new Error("pleate parseVox: not a .vox file");
  let size: [number, number, number] | null = null;
  let voxels: number[] | null = null;
  let colors: string[] | null = null;
  // 8 bytes of header, then the MAIN chunk, whose children follow its 12 byte header.
  let at = 20;
  while (at + 12 <= buffer.byteLength) {
    const id = tag(at);
    const length = view.getUint32(at + 4, true);
    const body = at + 12;
    if (body + length > buffer.byteLength) break;
    if (id === "SIZE" && !size) size = [view.getUint32(body, true), view.getUint32(body + 4, true), view.getUint32(body + 8, true)];
    else if (id === "XYZI" && !voxels) {
      const n = Math.min(view.getUint32(body, true), Math.floor((length - 4) / 4));
      voxels = [];
      for (let i = 0; i < n * 4; i++) voxels.push(view.getUint8(body + 4 + i));
    } else if (id === "RGBA") {
      colors = [];
      for (let i = 0; i < 255; i++) {
        const hex = [0, 1, 2].map((c) => view.getUint8(body + i * 4 + c).toString(16).padStart(2, "0"));
        colors.push(`#${hex.join("")}`);
      }
    }
    at = body + length;
  }
  if (!size || !voxels) throw new Error("pleate parseVox: the file has no model");
  if (!colors) throw new Error("pleate parseVox: the file has no palette, save it again from MagicaVoxel");
  if (size.some((n) => n < 1 || n > 256)) throw new Error("pleate parseVox: the model is too large");
  // MagicaVoxel is z up, with y going away from the viewer.
  const v = new Volume(size[0], size[2], size[1]);
  for (let i = 0; i < voxels.length; i += 4) v.set(voxels[i], voxels[i + 2], size[1] - 1 - voxels[i + 1], colors[voxels[i + 3] - 1] ?? null);
  return v;
}

/** Fetches and reads a MagicaVoxel file. */
export async function loadVox(url: string): Promise<Volume> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`pleate loadVox: ${url} answered ${response.status}`);
  return parseVox(await response.arrayBuffer());
}

/* ------------------------------------------------------------------------------------------------ Models */

export type VoxelPart = {
  id: string;
  /** Built on demand and only once per scene. */
  volume: () => Volume;
  /** Where its bottom center sits, in voxels from the bottom center of the model. */
  at?: readonly [number, number, number];
  /** Where it goes when the model comes apart, in voxels. Without it the part stays. */
  away?: readonly [number, number, number];
};

export type VoxelModel = { id: string; name: string; parts: readonly VoxelPart[] };

/** A model with one part. */
export const voxelModel = (id: string, name: string, volume: () => Volume): VoxelModel => ({ id, name, parts: [{ id: "body", volume }] });
