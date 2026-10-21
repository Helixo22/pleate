"use client";

import { StreamingText, TypingIndicator } from "pleate/ai/streaming-text";
import { Button } from "pleate/button";
import { useEffect, useRef, useState } from "react";

const TEXT = `Kyoto in April is cherry-blossom season, so book early.

The cheapest route from Milan is usually a one-stop flight to Osaka Kansai, then the Haruka express to Kyoto in about 75 minutes. Prices drop noticeably if you fly mid-week.`;

export default function Demo() {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const timer = useRef<number>(undefined);
  const start = () => {
    window.clearTimeout(timer.current);
    setText("");
    setStreaming(true);
    let i = 0;
    const tick = () => {
      i += 2 + Math.floor(Math.random() * 6);
      setText(TEXT.slice(0, i));
      if (i < TEXT.length) timer.current = window.setTimeout(tick, 40 + Math.random() * 50);
      else setStreaming(false);
    };
    timer.current = window.setTimeout(tick, 600);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <div className="grid w-full max-w-xl gap-5">
      <Button className="justify-self-start" onClick={start}>{text ? "Stream again" : "Start streaming"}</Button>
      <div className="min-h-40 rounded-2xl bg-fill-3 p-5">
        {streaming && !text ? <TypingIndicator /> : <StreamingText text={text || "Press the button to stream a reply."} streaming={streaming} />}
      </div>
    </div>
  );
}
