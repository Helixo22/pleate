"use client";

import { Mic, Square } from "lucide-react";
import { Button } from "pleate/button";
import { IconButton } from "pleate/icon-button";
import { StatusMark, Waveform, type Status } from "pleate/effects/motion-graphics";
import { useState } from "react";

export default function Demo() {
  const [recording, setRecording] = useState(true);
  const [status, setStatus] = useState<Status>("pending");
  return (
    <div className="grid w-full gap-8 sm:grid-cols-2">
      <div className="pl-field flex items-center gap-3 rounded-lg bg-surface p-3 [--pl-field-border:var(--pl-separator)]">
        <IconButton
          size="sm"
          variant={recording ? "filled" : "surface"}
          tone={recording ? "danger" : "neutral"}
          aria-label={recording ? "Stop recording" : "Record"}
          onClick={() => setRecording((r) => !r)}
          icon={recording ? <Square /> : <Mic />}
        />
        <Waveform active={recording} bars={28} height={28} label={recording ? "Recording" : "Recording paused"} className="min-w-0 flex-1" />
        <span className="font-mono text-caption1 text-fg-subtle pl-tabular">0:14</span>
      </div>
      <div className="flex items-center gap-4">
        <StatusMark status={status} size={28} />
        <div className="flex flex-wrap gap-1.5">
          {(["pending", "success", "warning", "error"] as const).map((s) => (
            <Button key={s} size="xs" variant={s === status ? "tinted" : "plain"} tone="neutral" onClick={() => setStatus(s)} className="capitalize">
              {s}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
