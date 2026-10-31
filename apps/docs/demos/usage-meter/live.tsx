"use client";

import { Button } from "pleate/button";
import { UsageMeter } from "pleate/usage-meter";
import { useState } from "react";

export default function Demo() {
  const [videos, setVideos] = useState(1.2);
  return (
    <div className="grid w-full max-w-md gap-4">
      <UsageMeter
        label="Trip photo storage"
        unit="GB"
        max={10}
        segments={[
          { label: "Photos", value: 5.1 },
          { label: "Videos", value: videos },
        ]}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="surface" tone="neutral" onClick={() => setVideos((v) => Math.min(4.9, Math.round((v + 0.9) * 10) / 10))}>
          Upload video
        </Button>
        <Button size="sm" variant="plain" tone="neutral" onClick={() => setVideos(1.2)}>
          Reset
        </Button>
      </div>
    </div>
  );
}
