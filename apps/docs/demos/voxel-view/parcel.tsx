"use client";

import { Button } from "pleate/button";
import { VoxelView } from "pleate/effects/voxel-scene";
import { voxelParcel } from "pleate/effects/voxel-gallery";
import { useState } from "react";

export default function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="h-96 w-full max-w-xl">
        <VoxelView
          model={voxelParcel}
          explode={open ? 0.62 : 0}
          spin={0}
          margin={1.1}
          label="A parcel with a gem inside"
          pose={(actor, { time }) => {
            // The gem turns in the air while the box is open.
            actor.parts.gift.rotation.y = open ? time : 0;
          }}
        />
      </div>
      <Button onClick={() => setOpen(!open)}>{open ? "Close the parcel" : "Open the parcel"}</Button>
    </div>
  );
}
