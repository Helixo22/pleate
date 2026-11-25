import assert from "node:assert/strict";
import { test } from "node:test";
import { renderDrawing } from "../pixel-art/buffer.ts";
import { pixelDrawings } from "../pixel-gallery/drawings.ts";
import { meshVolume } from "../voxel-scene/mesher.ts";
import { voxelDrawing, voxelModels } from "./models.ts";

test("ids are unique and every drawing has pixels", () => {
  assert.equal(new Set(pixelDrawings.map((d) => d.id)).size, pixelDrawings.length);
  for (const d of pixelDrawings) assert.ok(renderDrawing(d).data.filter(Boolean).length > 120, d.id);
});

test("every model has parts with voxels and stays light", () => {
  assert.equal(new Set(voxelModels.map((m) => m.id)).size, voxelModels.length);
  for (const model of voxelModels) {
    let triangles = 0;
    for (const part of model.parts) {
      const v = part.volume();
      assert.ok(v.count > 5, `${model.id} ${part.id} is empty`);
      triangles += meshVolume(v).indices.length / 3;
    }
    assert.ok(triangles < 24000, `${model.id}: ${triangles} triangles`);
  }
});

test("any drawing becomes a model", () => {
  assert.ok(voxelDrawing("gem").parts[0].volume().count > 500);
  assert.throws(() => voxelDrawing("nothing"));
});
