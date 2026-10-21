"use client";

import { Mic, MicOff } from "lucide-react";
import { BotFace, useAudioLevel } from "pleate/ai/bot-face";
import { Button } from "pleate/button";
import { SegmentedControl } from "pleate/segmented-control";
import { Slider } from "pleate/slider";
import { useEffect, useState } from "react";

export default function Demo() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"listening" | "speaking">("listening");
  const [manual, setManual] = useState(0.4);
  const mic = useAudioLevel(stream);
  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  const toggle = async () => {
    if (stream) return setStream(null);
    try {
      setError(null);
      setStream(await navigator.mediaDevices.getUserMedia({ audio: true }));
    } catch {
      setError("Microphone not available — use the slider instead.");
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="grid h-52 place-items-center">
        <BotFace state={mode} size={130} level={stream ? mic : manual} />
      </div>
      <SegmentedControl
        aria-label="State"
        value={mode}
        onValueChange={setMode}
        options={[
          { value: "listening", label: "Listening" },
          { value: "speaking", label: "Speaking" },
        ]}
      />
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <Button variant={stream ? "tinted" : "filled"} tone={stream ? "danger" : "accent"} startIcon={stream ? <MicOff /> : <Mic />} onClick={toggle}>
          {stream ? "Stop microphone" : "Use my microphone"}
        </Button>
        {error && <p className="text-footnote text-danger-ink">{error}</p>}
        {!stream && (
          <label className="flex w-full items-center gap-3 text-subhead text-fg-muted">
            Level
            <Slider value={[manual]} min={0} max={1} step={0.01} onValueChange={([v]) => setManual(v)} thumbLabels={["Level"]} />
          </label>
        )}
      </div>
    </div>
  );
}
