"use client";

import { VoxelView } from "pleate/effects/voxel-scene";
import { voxelDrawing } from "pleate/effects/voxel-gallery";
import { useMemo } from "react";

export default function Demo() {
  const models = useMemo(() => ["gem", "mushroom", "key"].map((id) => voxelDrawing(id, 7)), []);
  return (
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
      {models.map((model) => (
        <div key={model.id} className="h-56">
          <VoxelView model={model} spin={6} pixel={3} />
        </div>
      ))}
    </div>
  );
}
