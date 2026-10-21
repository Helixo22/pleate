"use client";

import { BotFace, type BotState } from "pleate/ai/bot-face";
import { Tag } from "pleate/tag";
import { useState } from "react";

const STATES: BotState[] = ["idle", "listening", "thinking", "speaking", "waiting", "happy", "error", "offline"];

export default function Demo() {
  const [state, setState] = useState<BotState>("idle");
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="grid h-56 place-items-center">
        <BotFace state={state} size={150} track dot />
      </div>
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="State">
        {STATES.map((s) => (
          <Tag key={s} selected={state === s} onClick={() => setState(s)} className="capitalize">
            {s}
          </Tag>
        ))}
      </div>
    </div>
  );
}
