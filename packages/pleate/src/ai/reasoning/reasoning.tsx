// The assistant's work in progress.
// - ShimmerText: a label with a light sweeping across it ("Thinking…", "Searching the web…").
// - Reasoning: a collapsible panel for the model's thoughts. Open while it thinks (with a live timer and a shimmer),
//   then it folds into "Thought for 12s", which the reader can expand.
// - ReasoningSteps: tool calls / steps with pending, active, done and error states.
"use client";

import { Collapsible } from "radix-ui";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { CheckIcon, ChevronDownIcon, XIcon } from "../../lib/icons.tsx";
import { Spinner } from "../../components/spinner/spinner.tsx";

export function ShimmerText({ children, className, active = true }: { children: ReactNode; className?: string; active?: boolean }) {
  return (
    <span
      className={cn(
        active &&
          "bg-[linear-gradient(90deg,var(--pl-fg-muted)_0%,var(--pl-fg-muted)_40%,var(--pl-fg)_50%,var(--pl-fg-muted)_60%,var(--pl-fg-muted)_100%)] bg-[length:200%_100%] bg-clip-text text-transparent motion-safe:animate-[pl-shine_1.8s_linear_infinite]",
        !active && "text-fg-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

export type ReasoningProps = {
  /** True while the model is thinking. */
  active: boolean;
  /** Seconds spent; measured automatically from `active` when omitted. */
  duration?: number;
  children?: ReactNode;
  /** Open by default while active, closed after. Control it with open/onOpenChange. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  activeLabel?: ReactNode;
  doneLabel?: (seconds: number) => ReactNode;
  className?: string;
};

export function Reasoning({
  active,
  duration,
  children,
  open: openProp,
  onOpenChange,
  activeLabel = "Thinking…",
  doneLabel = (s) => (s < 1 ? "Thought for a moment" : `Thought for ${s}s`),
  className,
}: ReasoningProps) {
  const [openState, setOpenState] = useState(active);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };
  const started = useRef<number | null>(active ? Date.now() : null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (active) {
      started.current ??= Date.now();
      setOpenState(true);
      const id = setInterval(() => setElapsed(Math.floor((Date.now() - started.current!) / 1000)), 500);
      return () => clearInterval(id);
    }
    if (started.current !== null) {
      setElapsed(Math.round((Date.now() - started.current) / 1000));
      started.current = null;
      setOpenState(false);
    }
  }, [active]);

  const seconds = duration ?? elapsed;
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className={cn("flex flex-col", className)}>
      <Collapsible.Trigger className="pl-focus-ring group -ms-1 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 text-subhead font-medium">
        <svg viewBox="0 0 24 24" className={cn("size-4 shrink-0", active ? "text-accent-ink" : "text-fg-muted")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3ZM9.5 19.5h5M10.5 22h3" />
        </svg>
        {active ? (
          <ShimmerText>
            {activeLabel} {seconds > 0 && <span className="pl-tabular">{seconds}s</span>}
          </ShimmerText>
        ) : (
          <span className="text-fg-muted group-hover:text-fg">{doneLabel(seconds)}</span>
        )}
        <ChevronDownIcon className="size-3.5 text-fg-subtle transition-[rotate] duration-(--pl-duration-base) group-data-[state=open]:rotate-180" strokeWidth={2.5} />
      </Collapsible.Trigger>
      <Collapsible.Content className="pl-collapsible [--radix-accordion-content-height:var(--radix-collapsible-content-height)]">
        <div className="mt-2 ms-2 border-s-2 border-separator ps-4 text-subhead text-fg-muted">{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export type ReasoningStep = { label: ReactNode; detail?: ReactNode; status: "pending" | "active" | "done" | "error" };

export function ReasoningSteps({ steps, className }: { steps: ReasoningStep[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col gap-2.5", className)}>
      {steps.map((step, i) => (
        <li key={i} aria-current={step.status === "active" ? "step" : undefined} className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full [&_svg]:size-3",
              step.status === "done" && "bg-success text-on-status",
              step.status === "error" && "bg-danger text-on-status",
              step.status === "pending" && "shadow-[inset_0_0_0_1.5px_var(--pl-border)]",
              step.status === "active" && "text-accent-ink",
            )}
          >
            {step.status === "done" && <CheckIcon strokeWidth={3.5} />}
            {step.status === "error" && <XIcon strokeWidth={3.5} />}
            {step.status === "active" && <Spinner size={16} label={null} />}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className={cn("text-subhead", step.status === "pending" ? "text-fg-subtle" : "text-fg")}>
              {step.status === "active" ? <ShimmerText>{step.label}</ShimmerText> : step.label}
            </span>
            {step.detail && <span className="text-footnote text-fg-muted">{step.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
