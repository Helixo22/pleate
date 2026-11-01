"use client";

import { Button } from "pleate/button";
import { Card } from "pleate/card";
import { UsageMeter } from "pleate/usage-meter";
import { useState } from "react";

export default function Demo() {
  const [videos, setVideos] = useState(1.2);
  return (
    <div className="w-full max-w-md rounded-xl bg-bg p-4">
      <Card padding="sm" radius="lg">
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
          <Button size="sm" variant="gray" onClick={() => setVideos((v) => Math.min(4.9, Math.round((v + 0.9) * 10) / 10))}>
            Upload video
          </Button>
          <Button size="sm" variant="plain" onClick={() => setVideos(1.2)}>
            Reset
          </Button>
        </div>
      </Card>
    </div>
  );
}
