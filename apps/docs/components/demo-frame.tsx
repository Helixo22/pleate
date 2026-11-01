// One example on a component page: a large live preview with a Preview / Code switch, Replay (remounts the demo, for
// effects that play once) and a fullscreen toggle. The Code tab shows the example's own file.
"use client";

import { Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { cn, IconButton, spring } from "pleate";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CopyButton } from "./backend/copy-button";

export function DemoFrame({
  id,
  title,
  description,
  code,
  children,
  align = "center",
  replay = false,
}: {
  id: string;
  title: string;
  description?: string;
  code: string;
  children: ReactNode;
  align?: "center" | "start" | "stretch";
  replay?: boolean;
}) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [run, setRun] = useState(0);
  const [full, setFull] = useState(false);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frame.current?.requestFullscreen?.().catch(() => {});
  };

  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-3">
        <h2 className="text-title3 text-fg">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-subhead text-fg-muted">{description}</p>}
      </div>
      <div
        ref={frame}
        className={cn(
          "pl-field flex flex-col overflow-clip bg-surface [--pl-field-border:var(--pl-separator)]",
          full ? "h-full overflow-auto rounded-none" : "rounded-2xl",
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-separator px-2">
          <div role="tablist" aria-label={`${title} view`} className="flex gap-0.5">
            {(["preview", "code"] as const).map((value) => (
              <button
                key={value}
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={cn(
                  "pl-focus-ring relative h-8 cursor-pointer rounded-full px-3.5 text-footnote font-medium capitalize transition-colors",
                  tab === value ? "text-fg" : "text-fg-muted hover:text-fg",
                )}
              >
                {tab === value && <motion.span layoutId={`tab-${id}`} transition={spring.snap} className="absolute inset-0 rounded-full bg-fill-2" />}
                <span className="relative">{value}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {tab === "code" ? (
              <CopyButton text={code} />
            ) : (
              replay && (
                <IconButton aria-label="Replay" size="sm" variant="plain" tone="neutral" icon={<RotateCcw />} onClick={() => setRun((n) => n + 1)} />
              )
            )}
            <IconButton
              aria-label={full ? "Exit fullscreen" : "Fullscreen"}
              size="sm"
              variant="plain"
              tone="neutral"
              icon={full ? <Minimize2 /> : <Maximize2 />}
              onClick={toggleFull}
            />
          </div>
        </div>
        {tab === "preview" ? (
          <div
            key={run}
            role="tabpanel"
            className={cn(
              "flex gap-4 p-6 md:p-10",
              full ? "flex-1" : replay ? "min-h-80" : "min-h-56",
              align === "center" && "flex-wrap items-center justify-center",
              align === "start" && "flex-wrap items-start justify-start",
              // No wrap here: a wrapping column sizes itself to its widest child instead of the frame.
              align === "stretch" && "flex-col items-stretch justify-center",
            )}
          >
            {children}
          </div>
        ) : (
          <div role="tabpanel" className={cn(full && "flex-1")}>
            <pre className={cn("overflow-auto bg-surface-2 p-5 font-mono text-[0.8125rem] leading-relaxed text-fg", full ? "h-full" : "max-h-[32rem]")}>
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
