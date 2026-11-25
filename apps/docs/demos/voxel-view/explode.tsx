"use client";

import { VoxelView } from "pleate/effects/voxel-scene";
import { voxelCamera } from "pleate/effects/voxel-gallery";
import { Slider } from "pleate/slider";
import { useState } from "react";

export default function Demo() {
  const [apart, setApart] = useState([0]);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="h-96 w-full max-w-xl">
        <VoxelView model={voxelCamera} explode={apart[0] / 100} build pixel={4} disc={{ radius: 0.46 }} label="A camera" />
      </div>
      <div className="w-full max-w-xs">
        <Slider value={apart} onValueChange={setApart} thumbLabels={["Take the camera apart"]} />
      </div>
    </div>
  );
}
