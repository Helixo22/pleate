// <Toaster />: renders the toasts queued with toast(). iOS-style notifications, solid rounded cards with an icon,
// title, description and an optional action, stacked newest first, at the top center by default (like a banner
// dropping in) or in a corner. Timers pause on hover and focus; swipe or drag a toast away to dismiss it.
// Mount it once, near the root of the app.
"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";
import { spring } from "../../motion/tokens.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Spinner } from "../spinner/spinner.tsx";
import { toast, toastStore, type ToastData, type ToastTone } from "./store.ts";

export type ToasterPosition = "top-center" | "top-right" | "bottom-center" | "bottom-right";

export type ToasterProps = {
  position?: ToasterPosition;
  /** Toasts visible at once; older ones wait. */
  visible?: number;
  /** Default duration in ms. */
  duration?: number;
  label?: string;
  closeLabel?: string;
};

const TONE: Record<Exclude<ToastTone, "loading" | "default">, { className: string; path: string }> = {
  success: { className: "bg-success-vivid", path: "M7.5 12.5l3 3 6-6.5" },
  error: { className: "bg-danger", path: "M9 9l6 6M15 9l-6 6" },
  warning: { className: "bg-warning", path: "M12 7.5v5.5M12 16.5h.01" },
  info: { className: "bg-info", path: "M12 8h.01M11 11.5h1v5h1" },
};

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === "loading") return <Spinner size="md" label={null} className="text-fg-muted" />;
  if (tone === "default") return null;
  const t = TONE[tone];
  return (
    <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-on-status", t.className)} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d={t.path} />
      </svg>
    </span>
  );
}

function ToastItem({ data, position, duration, closeLabel }: { data: ToastData; position: ToasterPosition; duration: number; closeLabel: string }) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const remaining = useRef(data.duration ?? duration);
  const started = useRef(Date.now());
  const tone = data.tone ?? "default";
  const top = position.startsWith("top");
  const horizontal = position.endsWith("right");

  // Restart the clock when the toast changes (e.g. loading → success).
  useEffect(() => {
    remaining.current = data.duration ?? duration;
  }, [data.title, data.tone, data.duration, duration]);

  useEffect(() => {
    if (paused || tone === "loading" || !Number.isFinite(remaining.current)) return;
    started.current = Date.now();
    const timer = window.setTimeout(() => toast.dismiss(data.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - started.current;
    };
  }, [paused, tone, data.id, data.title, data.tone]);

  const enter = reduced ? { opacity: 0 } : horizontal ? { opacity: 0, x: 40 } : { opacity: 0, y: top ? -32 : 32, scale: 0.96 };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    const distance = horizontal ? info.offset.x : top ? -info.offset.y : info.offset.y;
    const speed = horizontal ? info.velocity.x : top ? -info.velocity.y : info.velocity.y;
    if (distance > 48 || speed > 500) toast.dismiss(data.id);
  };

  return (
    <motion.li
      layout={!reduced}
      role={tone === "error" ? "alert" : "status"}
      aria-atomic="true"
      initial={enter}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : horizontal ? { opacity: 0, x: 60 } : { opacity: 0, y: top ? -24 : 24, scale: 0.96 }}
      transition={reduced ? { duration: 0.15 } : spring.soft}
      drag={data.dismissible === false ? false : horizontal ? "x" : "y"}
      dragConstraints={horizontal ? { left: 0, right: 0 } : { top: 0, bottom: 0 }}
      dragElastic={horizontal ? { left: 0.05, right: 0.8 } : top ? { top: 0.8, bottom: 0.05 } : { top: 0.05, bottom: 0.8 }}
      onDragEnd={onDragEnd}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="group pointer-events-auto relative flex w-full touch-none items-center gap-3 rounded-2xl bg-elevated p-3 ps-3.5 text-fg shadow-xl select-none"
    >
      {data.icon ?? <ToneIcon tone={tone} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-subhead font-semibold">{data.title}</p>
        {data.description && <p className="text-footnote text-fg-muted">{data.description}</p>}
      </div>
      {data.action && (
        <button
          type="button"
          onClick={() => {
            data.action!.onClick();
            toast.dismiss(data.id);
          }}
          className="pl-focus-ring shrink-0 cursor-pointer rounded-full bg-accent-soft px-3 py-1.5 text-footnote font-semibold text-accent-ink hover:bg-accent-soft-hover"
        >
          {data.action.label}
        </button>
      )}
      {data.dismissible !== false && (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={() => toast.dismiss(data.id)}
          className="pl-focus-ring absolute -start-2 -top-2 grid size-6 cursor-pointer place-items-center rounded-full bg-elevated text-fg-muted opacity-0 shadow-md transition-opacity group-hover:opacity-100 focus-visible:opacity-100 [&_svg]:size-3"
        >
          <XIcon strokeWidth={3} />
        </button>
      )}
    </motion.li>
  );
}

const POSITION: Record<ToasterPosition, string> = {
  "top-center": "top-0 inset-x-0 flex-col items-center pt-[max(0.75rem,var(--pl-safe-top))]",
  "top-right": "top-0 end-0 flex-col items-end pt-[max(1rem,var(--pl-safe-top))] pe-4",
  "bottom-center": "bottom-0 inset-x-0 items-center pb-[max(0.75rem,var(--pl-safe-bottom))] flex-col-reverse",
  "bottom-right": "bottom-0 end-0 items-end pb-[max(1rem,var(--pl-safe-bottom))] pe-4 flex-col-reverse",
};

export function Toaster({ position = "top-center", visible = 3, duration = 4000, label = "Notifications", closeLabel = "Dismiss" }: ToasterProps) {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getServerSnapshot);
  const shown = toasts.slice(0, visible);
  return (
    <section aria-label={label} className={cn("pointer-events-none fixed z-(--pl-z-toast) flex px-2", POSITION[position])}>
      <ol
        aria-live="polite"
        className={cn("flex w-[min(24rem,calc(100vw-1rem))] gap-2", position.startsWith("bottom") ? "flex-col-reverse" : "flex-col")}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((t) => (
            <ToastItem key={t.id} data={t} position={position} duration={duration} closeLabel={closeLabel} />
          ))}
        </AnimatePresence>
      </ol>
    </section>
  );
}
