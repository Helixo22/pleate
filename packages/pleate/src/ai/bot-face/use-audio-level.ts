// useAudioLevel: the loudness of a MediaStream (a microphone) as a MotionValue between 0 and 1, updated every
// frame without re-rendering. Feed it to <BotFace level={…} /> while listening, or to anything else that should
// react to sound. Returns a still 0 when there is no stream.
"use client";

import { useMotionValue, type MotionValue } from "motion/react";
import { useEffect } from "react";

export function useAudioLevel(stream: MediaStream | null | undefined, { smoothing = 0.8, gain = 2.2 } = {}): MotionValue<number> {
  const level = useMotionValue(0);
  useEffect(() => {
    if (!stream || typeof AudioContext === "undefined") {
      level.set(0);
      return;
    }
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = smoothing;
    source.connect(analyser);
    const data = new Float32Array(analyser.fftSize);
    let raf = 0;
    const tick = () => {
      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += v * v;
      const rms = Math.sqrt(sum / data.length);
      // Perceptual-ish curve: quiet speech already moves things, shouting saturates at 1.
      level.set(Math.min(1, Math.pow(rms * gain * 4, 0.7)));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      void context.close();
    };
  }, [stream, smoothing, gain, level]);
  return level;
}
