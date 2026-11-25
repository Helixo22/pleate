// Turns a Volume into as few triangles as possible: faces between two voxels are dropped, and flat areas of one color
// become one rectangle (greedy meshing). Corners get a soft contact shadow (ambient occlusion); rectangles only merge
// where that shadow is even. Pure and free of three.js.
import type { Volume } from "./volume.ts";

export type VoxelMeshData = {
  /** Centered on x and z, standing on y = 0, one unit per voxel. */
  positions: Float32Array;
  normals: Int8Array;
  /** Palette number of each vertex, 1 and up. */
  inks: Uint8Array;
  /** Light left at each vertex, 0 to 255. */
  shade: Uint8Array;
  indices: Uint32Array;
};

const AO_LIGHT = [120, 180, 220, 255];

export function meshVolume(v: Volume): VoxelMeshData {
  const dims = [v.width, v.height, v.depth];
  const offset = [v.width / 2, 0, v.depth / 2];
  const positions: number[] = [];
  const normals: number[] = [];
  const inks: number[] = [];
  const shade: number[] = [];
  const indices: number[] = [];
  const pos = [0, 0, 0];
  const solid = (p: number[]) => (v.get(p[0], p[1], p[2]) ? 1 : 0);

  for (let axis = 0; axis < 3; axis++) {
    const u = (axis + 1) % 3;
    const w = (axis + 2) % 3;
    const mask = new Int32Array(dims[u] * dims[w]);
    for (const dir of [1, -1]) {
      for (let slice = 0; slice < dims[axis]; slice++) {
        // One number per visible face of the slice: its color and the light of its four corners.
        for (let b = 0; b < dims[w]; b++)
          for (let a = 0; a < dims[u]; a++) {
            pos[axis] = slice;
            pos[u] = a;
            pos[w] = b;
            const ink = v.get(pos[0], pos[1], pos[2]);
            const front = [...pos];
            front[axis] += dir;
            if (!ink || solid(front)) {
              mask[a + b * dims[u]] = 0;
              continue;
            }
            const near = (du: number, dw: number) => {
              const p = [...front];
              p[u] += du;
              p[w] += dw;
              return solid(p);
            };
            const corner = (du: number, dw: number) => {
              const s1 = near(du, 0);
              const s2 = near(0, dw);
              return s1 && s2 ? 0 : 3 - s1 - s2 - near(du, dw);
            };
            const ao = corner(-1, -1) | (corner(1, -1) << 2) | (corner(1, 1) << 4) | (corner(-1, 1) << 6);
            mask[a + b * dims[u]] = ink | (ao << 8);
          }
        for (let b = 0; b < dims[w]; b++)
          for (let a = 0; a < dims[u]; ) {
            const face = mask[a + b * dims[u]];
            if (!face) {
              a++;
              continue;
            }
            const ao = face >> 8;
            const even = ao === (ao & 3) * 85;
            let width = 1;
            let height = 1;
            if (even) {
              while (a + width < dims[u] && mask[a + width + b * dims[u]] === face) width++;
              grow: while (b + height < dims[w]) {
                for (let i = 0; i < width; i++) if (mask[a + i + (b + height) * dims[u]] !== face) break grow;
                height++;
              }
            }
            const base = positions.length / 3;
            const light = [ao & 3, (ao >> 2) & 3, (ao >> 4) & 3, (ao >> 6) & 3];
            const corners = [[a, b], [a + width, b], [a + width, b + height], [a, b + height]];
            corners.forEach(([cu, cw], i) => {
              const p = [0, 0, 0];
              p[axis] = slice + (dir > 0 ? 1 : 0);
              p[u] = cu;
              p[w] = cw;
              positions.push(p[0] - offset[0], p[1] - offset[1], p[2] - offset[2]);
              const n = [0, 0, 0];
              n[axis] = dir * 127;
              normals.push(n[0], n[1], n[2]);
              inks.push(face & 255);
              shade.push(AO_LIGHT[light[i]]);
            });
            // Split along the brighter diagonal, so the contact shadow bends the right way.
            const quad = light[0] + light[2] >= light[1] + light[3] ? [0, 1, 2, 0, 2, 3] : [1, 2, 3, 1, 3, 0];
            if (dir < 0) quad.reverse();
            for (const i of quad) indices.push(base + i);
            for (let j = 0; j < height; j++) mask.fill(0, a + (b + j) * dims[u], a + (b + j) * dims[u] + width);
            a += width;
          }
      }
    }
  }
  return {
    positions: new Float32Array(positions),
    normals: new Int8Array(normals),
    inks: new Uint8Array(inks),
    shade: new Uint8Array(shade),
    indices: new Uint32Array(indices),
  };
}
