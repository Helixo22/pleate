"use client";

import { ChatThread, Message } from "pleate/ai/chat";
import { Composer } from "pleate/ai/composer";
import { TypingIndicator } from "pleate/ai/streaming-text";
import { useEffect, useRef, useState } from "react";

type Line = { id: number; role: "user" | "assistant"; text: string };

const START: Line[] = [
  { id: 1, role: "user", text: "Is the 8:40 train to Sintra still running on Sundays?" },
  { id: 2, role: "assistant", text: "Yes, it leaves Rossio every 20 minutes on weekends." },
  { id: 3, role: "assistant", text: "The 8:40 gets you to Sintra at 9:20, ten minutes before Pena Palace opens." },
  { id: 4, role: "user", text: "Perfect" },
  { id: 5, role: "user", text: "Do I need to book the palace?" },
];

const REPLIES = [
  "Booking online is cheaper and skips the ticket line. The 9:30 slot still has space this Sunday.",
  "Bring a light jacket, the hill is often in fog until noon.",
];

export default function Demo() {
  const [lines, setLines] = useState(START);
  const [typing, setTyping] = useState(true);
  const replies = useRef(0);
  const timer = useRef<number>(undefined);

  const answer = () => {
    setTyping(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const text = REPLIES[replies.current++ % REPLIES.length];
      setLines((list) => [...list, { id: Date.now(), role: "assistant", text }]);
      setTyping(false);
    }, 1600);
  };
  useEffect(() => {
    answer();
    return () => window.clearTimeout(timer.current);
  }, []);

  const lastUser = lines.map((l) => l.role).lastIndexOf("user");
  return (
    <div className="flex h-[34rem] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-surface shadow-[inset_0_0_0_1px_var(--pl-separator)]">
      <ChatThread className="flex-1" contentClassName="gap-5 px-3 py-4">
        <Message role="system">Today 9:41</Message>
        {lines.map((l, i) => {
          const prev = lines[i - 1];
          const next = lines[i + 1];
          return (
            <Message
              key={l.id}
              role={l.role}
              continued={prev?.role === l.role}
              tail={next?.role !== l.role && !(typing && i === lines.length - 1 && l.role === "assistant")}
              receipt={i === lastUser && !typing ? "Read 9:42" : undefined}
            >
              {l.text}
            </Message>
          );
        })}
        {typing && <TypingIndicator bubble />}
      </ChatThread>
      <div className="shrink-0 border-t border-separator bg-surface px-3 py-2">
        <Composer
          variant="capsule"
          accept="image/*"
          placeholder="Message"
          onVoice={() => {}}
          onSubmit={({ text }) => {
            setLines((list) => [...list, { id: Date.now(), role: "user", text: text || "Photo" }]);
            answer();
          }}
        />
      </div>
    </div>
  );
}
