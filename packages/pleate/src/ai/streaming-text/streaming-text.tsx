// StreamingText: text that arrives in pieces (an LLM stream). Each new piece fades in where it lands and a caret
// blinks at the end while streaming. Paragraphs split on blank lines. Pass the whole text so far on every update.
// Screen readers get the text once, when the stream ends (aria-busy while streaming).
"use client";

import { useRef } from "react";
import { cn } from "../../lib/cn.ts";

export type StreamingTextProps = {
  text: string;
  streaming?: boolean;
  /** Fade new pieces in (default true; off with reduced motion through the global rule). */
  animate?: boolean;
  className?: string;
};

export function StreamingText({ text, streaming = false, animate = true, className }: StreamingTextProps) {
  // Remember where each chunk started, so only freshly appended text animates.
  const chunks = useRef<{ start: number; key: number }[]>([]);
  const seen = useRef("");
  const counter = useRef(0);
  if (!text.startsWith(seen.current)) {
    chunks.current = [];
    seen.current = "";
  }
  if (text.length > seen.current.length) {
    chunks.current.push({ start: seen.current.length, key: counter.current++ });
    seen.current = text;
  }

  const pieces = chunks.current.map((c, i) => ({ key: c.key, text: text.slice(c.start, chunks.current[i + 1]?.start ?? text.length) }));
  // Render chunk by chunk, breaking into paragraphs at blank lines.
  const paragraphs: { key: string; parts: { key: number; text: string }[] }[] = [{ key: "p0", parts: [] }];
  pieces.forEach((piece) => {
    piece.text.split(/(\n{2,})/).forEach((part, j) => {
      if (/^\n{2,}$/.test(part)) paragraphs.push({ key: `p${paragraphs.length}`, parts: [] });
      else if (part) paragraphs[paragraphs.length - 1].parts.push({ key: piece.key * 1000 + j, text: part });
    });
  });

  return (
    <div aria-busy={streaming || undefined} className={cn("flex flex-col gap-3 text-body break-words whitespace-pre-wrap", className)}>
      {paragraphs.map((p, pi) => (
        <p key={p.key}>
          {p.parts.map((part) => (
            <span key={part.key} className={cn(animate && "animate-[pl-fade-in_0.35s_var(--pl-ease-out)]")}>
              {part.text}
            </span>
          ))}
          {streaming && pi === paragraphs.length - 1 && (
            <span
              aria-hidden="true"
              className="ms-0.5 inline-block h-[1.05em] w-[0.5em] translate-y-[0.15em] rounded-[0.15em] bg-accent-ink align-baseline motion-safe:animate-[pl-blink_1s_steps(1)_infinite]"
            />
          )}
        </p>
      ))}
    </div>
  );
}

export function TypingIndicator({ className, label = "Assistant is typing" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex items-center gap-1 py-1.5", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 rounded-full bg-fg-subtle motion-safe:animate-[pl-typing_1.2s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}
