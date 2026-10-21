"use client";

import { Check, Compass, Copy, Map, Plane, RefreshCw, Sparkles, ThumbsUp, Utensils, Zap } from "lucide-react";
import { BotFace, type BotState } from "pleate/ai/bot-face";
import { ChatThread, Message, MessageAction } from "pleate/ai/chat";
import { Composer } from "pleate/ai/composer";
import { ModelPicker } from "pleate/ai/model-picker";
import { PromptSuggestions } from "pleate/ai/prompt-suggestions";
import { Reasoning, ReasoningSteps, type ReasoningStep } from "pleate/ai/reasoning";
import { SourceList } from "pleate/ai/result-card";
import { StreamingText, TypingIndicator } from "pleate/ai/streaming-text";
import { Badge } from "pleate/badge";
import { useEffect, useRef, useState } from "react";

type Turn = {
  id: number;
  role: "user" | "assistant";
  text: string;
  files?: string[];
  streaming?: boolean;
  thinking?: boolean;
  steps?: ReasoningStep[];
  sources?: boolean;
};

const ANSWER = `Here's a relaxed three-day plan for Lisbon.

Day 1 — Alfama and the castle. Start at Miradouro de Santa Luzia for the view, wander down to the cathedral and end with fado in a small tasca.

Day 2 — Belém. Pastéis de Belém in the morning (go before 10), the Jerónimos Monastery, then a sunset walk along the river to LX Factory.

Day 3 — Sintra. Take the train from Rossio (about 40 min), see Pena Palace early to beat the crowds, and have lunch in the old town before heading back.`;

const SOURCES = [
  { href: "https://www.visitlisboa.com", title: "Visit Lisboa — official tourism guide", site: "visitlisboa.com" },
  { href: "https://www.parquesdesintra.pt", title: "Parques de Sintra — tickets and hours", site: "parquesdesintra.pt" },
  { href: "https://www.cp.pt", title: "CP trains Lisbon–Sintra timetable", site: "cp.pt" },
];

const MODELS = [
  { id: "swift", name: "Swift", description: "Fast answers for everyday questions", icon: <Zap />, badges: <Badge size="sm" tone="success">Fast</Badge> },
  { id: "atlas", name: "Atlas", description: "Plans, compares and reasons step by step", icon: <Sparkles />, badges: <Badge size="sm">Reasoning</Badge> },
];

export default function Demo() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [model, setModel] = useState("atlas");
  const [bot, setBot] = useState<BotState>("idle");
  const [copied, setCopied] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const generating = turns.some((t) => t.streaming || t.thinking);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const patch = (id: number, p: Partial<Turn>) => setTurns((list) => list.map((t) => (t.id === id ? { ...t, ...p } : t)));

  const reply = () => {
    const id = Date.now() + 1;
    const steps = (s: ReasoningStep["status"][]): ReasoningStep[] => [
      { label: "Understanding the request", status: s[0] },
      { label: "Searching travel guides", detail: "3 sources", status: s[1] },
      { label: "Drafting the itinerary", status: s[2] },
    ];
    setBot("thinking");
    setTurns((list) => [...list, { id, role: "assistant", text: "", thinking: true, steps: steps(["active", "pending", "pending"]) }]);
    later(() => patch(id, { steps: steps(["done", "active", "pending"]) }), 700);
    later(() => patch(id, { steps: steps(["done", "done", "active"]) }), 1500);
    later(() => {
      patch(id, { thinking: false, streaming: true, steps: steps(["done", "done", "done"]) });
      setBot("speaking");
      const words = ANSWER.split(/(?<= )/);
      let i = 0;
      const tick = () => {
        i += 1 + Math.floor(Math.random() * 3);
        patch(id, { text: words.slice(0, i).join("") });
        if (i < words.length) later(tick, 45 + Math.random() * 60);
        else {
          patch(id, { streaming: false, sources: true });
          setBot("happy");
          later(() => setBot("idle"), 2200);
        }
      };
      tick();
    }, 2300);
  };

  const send = (text: string, files: File[] = []) => {
    setTurns((list) => [...list, { id: Date.now(), role: "user", text, files: files.map((f) => f.name) }]);
    reply();
  };
  const stop = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setTurns((list) => list.map((t) => (t.streaming || t.thinking ? { ...t, streaming: false, thinking: false } : t)));
    setBot("idle");
  };

  return (
    <div className="flex h-[40rem] w-full flex-col overflow-hidden rounded-3xl bg-bg shadow-[inset_0_0_0_1px_var(--pl-separator)]">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-separator px-4">
        <BotFace state={bot} size={32} decorative />
        <div className="min-w-0 flex-1">
          <p className="text-headline">Trip assistant</p>
          <p className="text-caption1 text-fg-muted capitalize" aria-live="polite">{bot === "idle" ? "Online" : bot}</p>
        </div>
      </div>

      {turns.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-6">
          <BotFace state="idle" size={96} track />
          <p className="text-title3 text-center">Where shall we go?</p>
          <PromptSuggestions
            className="w-full max-w-xl"
            onSelect={(prompt) => send(prompt)}
            suggestions={[
              { icon: <Map />, title: "Plan 3 days in Lisbon", description: "Relaxed pace, local food", prompt: "Plan 3 relaxed days in Lisbon" },
              { icon: <Plane />, title: "Cheapest way to Kyoto", description: "From Milan in April", prompt: "What's the cheapest way to get to Kyoto from Milan in April?" },
              { icon: <Utensils />, title: "Where to eat in Naples", description: "Pizza beyond the classics", prompt: "Where should I eat in Naples beyond the classic pizzerias?" },
              { icon: <Compass />, title: "Surprise me", description: "A weekend under €300", prompt: "Suggest a surprise weekend trip under €300" },
            ]}
          />
        </div>
      ) : (
        <ChatThread className="flex-1">
          {turns.map((t, i) =>
            t.role === "user" ? (
              <Message key={t.id} role="user" status="sent" footer={t.files?.length ? <p className="text-end text-footnote text-fg-muted">📎 {t.files.join(", ")}</p> : undefined}>
                {t.text}
              </Message>
            ) : (
              <Message
                key={t.id}
                role="assistant"
                variant="document"
                avatar={<BotFace state={i === turns.length - 1 ? bot : "idle"} size={32} decorative animated={i === turns.length - 1} />}
                footer={t.sources ? <SourceList sources={SOURCES} className="mt-2" /> : undefined}
                actions={
                  !t.streaming && !t.thinking && t.text ? (
                    <>
                      <MessageAction
                        label={copied === t.id ? "Copied" : "Copy"}
                        onClick={() => {
                          void navigator.clipboard.writeText(t.text);
                          setCopied(t.id);
                          setTimeout(() => setCopied(null), 1400);
                        }}
                      >
                        {copied === t.id ? <Check /> : <Copy />}
                      </MessageAction>
                      <MessageAction label="Good answer"><ThumbsUp /></MessageAction>
                      <MessageAction label="Regenerate" onClick={reply}><RefreshCw /></MessageAction>
                    </>
                  ) : undefined
                }
              >
                <div className="flex flex-col gap-3">
                  {t.steps && (
                    <Reasoning active={Boolean(t.thinking)}>
                      <ReasoningSteps steps={t.steps} />
                    </Reasoning>
                  )}
                  {t.thinking && !t.text && <TypingIndicator />}
                  {t.text && <StreamingText text={t.text} streaming={t.streaming} />}
                </div>
              </Message>
            ),
          )}
        </ChatThread>
      )}

      <div className="shrink-0 px-3 pt-1 pb-3">
        <Composer
          accept="image/*,.pdf"
          generating={generating}
          onStop={stop}
          onSubmit={({ text, files }) => send(text || "(attachment)", files)}
          onVoice={() => setBot((b) => (b === "listening" ? "idle" : "listening"))}
          listening={bot === "listening"}
          toolbar={<ModelPicker models={MODELS} value={model} onValueChange={setModel} side="top" />}
          placeholder="Ask about any destination"
        />
      </div>
    </div>
  );
}
