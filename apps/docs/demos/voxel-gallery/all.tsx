"use client";

import { Button } from "pleate/button";
import { VoxelView } from "pleate/effects/voxel-scene";
import { voxelModels } from "pleate/effects/voxel-gallery";
import { useState } from "react";

export default function Demo() {
  const [id, setId] = useState(voxelModels[0].id);
  const [apart, setApart] = useState(false);
  const model = voxelModels.find((m) => m.id === id)!;
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="h-[26rem] w-full max-w-2xl">
        <VoxelView key={id} model={model} build explode={apart ? 1 : 0} disc={{ radius: 0.46 }} />
      </div>
      <Button variant="tinted" size="sm" aria-pressed={apart} onClick={() => setApart(!apart)}>
        {apart ? "Put it together" : "Take it apart"}
      </Button>
      <ul className="flex flex-wrap justify-center gap-2" aria-label="Models">
        {voxelModels.map((m) => (
          <li key={m.id}>
            <Button size="sm" variant={m.id === id ? "filled" : "plain"} tone={m.id === id ? "accent" : "neutral"} aria-pressed={m.id === id} onClick={() => setId(m.id)}>
              {m.name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
