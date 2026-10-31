// Countdown: time left until a target ("Seats held for 14:59"). Digits roll (Odometer), tick once per second on the
// second boundary, pause while the tab is hidden and resync on return. Screen readers get a minute-level text instead
// of the per-second digits (announced politely only with `announce`). Renders "--:--" until mounted, so server and
// client markup match.
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { Odometer } from "../../effects/motion-graphics/motion-graphics.tsx";

export type CountdownFormat = "mm:ss" | "hh:mm:ss" | "d h m";

export type CountdownProps = {
  /** Target moment, a Date or epoch milliseconds. */
  to: Date | number;
  format?: CountdownFormat;
  /** Called once when the time runs out. */
  onComplete?: () => void;
  size?: "sm" | "md" | "lg";
  /** Visible text before the digits, e.g. "Seats held for". */
  label?: ReactNode;
  /** Announce the minute-level text politely as it changes. Off by default. */
  announce?: boolean;
  className?: string;
};

const SIZE = { sm: "text-footnote", md: "text-title3", lg: "text-title1" } as const;
const LABEL = { sm: "text-footnote", md: "text-subhead", lg: "text-body" } as const;
const PAD: Intl.NumberFormatOptions = { minimumIntegerDigits: 2, useGrouping: false };
const PLAIN: Intl.NumberFormatOptions = { useGrouping: false };

type Part = { value: number; pad: boolean; after: string };

function parts(seconds: number, format: CountdownFormat): Part[] {
  const s = seconds % 60;
  if (format === "mm:ss") return [{ value: Math.floor(seconds / 60), pad: true, after: ":" }, { value: s, pad: true, after: "" }];
  const m = Math.floor(seconds / 60) % 60;
  if (format === "hh:mm:ss")
    return [
      { value: Math.floor(seconds / 3600), pad: true, after: ":" },
      { value: m, pad: true, after: ":" },
      { value: s, pad: true, after: "" },
    ];
  // d h m counts whole minutes started, so 30 seconds left still reads 1m.
  const mins = Math.ceil(seconds / 60);
  return [
    { value: Math.floor(mins / 1440), pad: false, after: "d " },
    { value: Math.floor(mins / 60) % 24, pad: true, after: "h " },
    { value: mins % 60, pad: true, after: "m" },
  ];
}

const PLACEHOLDER = { "mm:ss": "--:--", "hh:mm:ss": "--:--:--", "d h m": "-d --h --m" } as const;

function spoken(seconds: number) {
  if (seconds <= 0) return "Time is up";
  const mins = Math.ceil(seconds / 60);
  if (mins <= 1) return "Less than a minute left";
  const d = Math.floor(mins / 1440);
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const unit = (n: number, w: string) => (n ? `${n} ${w}${n === 1 ? "" : "s"}` : "");
  return `${[unit(d, "day"), unit(h, "hour"), unit(m, "minute")].filter(Boolean).join(" ")} left`;
}

export function Countdown({ to, format = "mm:ss", onComplete, size = "md", label, announce = false, className }: CountdownProps) {
  const target = typeof to === "number" ? to : to.getTime();
  const [now, setNow] = useState<number | null>(null);
  const complete = useRef(onComplete);
  useEffect(() => {
    complete.current = onComplete;
  });

  useEffect(() => {
    let timer = 0;
    let done = false;
    const tick = () => {
      window.clearTimeout(timer);
      const n = Date.now();
      setNow(n);
      const left = target - n;
      if (left <= 0) {
        if (!done) complete.current?.();
        done = true;
        return;
      }
      // Wake on the next whole-second boundary of the time left, not every 1000ms from now, so it never drifts.
      if (!document.hidden) timer = window.setTimeout(tick, left % 1000 || 1000);
    };
    const onVisibility = () => (document.hidden ? window.clearTimeout(timer) : tick());
    tick();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [target]);

  const seconds = now === null ? null : Math.max(0, Math.ceil((target - now) / 1000));

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      {label && <span className={cn("text-fg-muted", LABEL[size])}>{label}</span>}
      <span aria-hidden="true" className={cn("pl-tabular font-mono font-medium text-fg", SIZE[size])}>
        {seconds === null
          ? PLACEHOLDER[format]
          : parts(seconds, format).map((p, i) => (
              <span key={i}>
                <Odometer value={p.value} format={p.pad ? PAD : PLAIN} duration={0.4} />
                {p.after && <span className="text-fg-subtle">{p.after}</span>}
              </span>
            ))}
      </span>
      <span className="sr-only" aria-live={announce ? "polite" : "off"}>
        {seconds === null ? "" : spoken(seconds)}
      </span>
    </span>
  );
}
