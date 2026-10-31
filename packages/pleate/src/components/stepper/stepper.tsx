// Stepper: progress through a multi-step flow (checkout, booking, onboarding). Done steps draw a check, the current one
// gets an accent ring, the rest stay muted; the line between steps fills with the accent as you advance. With
// onStepClick, done steps become buttons to jump back.
import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { CheckIcon } from "../../lib/icons.tsx";

export type StepperStep = { id: string; label: ReactNode; description?: ReactNode };

export type StepperProps = {
  steps: StepperStep[];
  /** Index of the current step; steps before it are done. Use steps.length when all are done. */
  current: number;
  orientation?: "horizontal" | "vertical";
  /** Makes done steps buttons. */
  onStepClick?: (index: number, step: StepperStep) => void;
  "aria-label"?: string;
  className?: string;
};

export function Stepper({ steps, current, orientation = "horizontal", onStepClick, className, ...props }: StepperProps) {
  const vertical = orientation === "vertical";
  return (
    <ol aria-label={props["aria-label"] ?? "Progress"} className={cn("flex", vertical ? "flex-col" : "w-full items-start", className)}>
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "current" : "upcoming";
        const last = i === steps.length - 1;
        const text = (
          <>
            <span className={cn("block text-subhead font-medium", state === "upcoming" ? "text-fg-muted" : "text-fg")}>{step.label}</span>
            {step.description && <span className="block text-footnote text-fg-muted">{step.description}</span>}
            {state === "done" && <span className="sr-only">, done</span>}
          </>
        );
        return (
          <li
            key={step.id}
            aria-current={state === "current" ? "step" : undefined}
            className={cn("flex min-w-0", vertical ? "gap-3" : cn("flex-col gap-2", !last && "flex-1"))}
          >
            <div className={cn("flex items-center", vertical ? "flex-col self-stretch" : "pe-2")}>
              <Marker state={state} index={i} />
              {!last && <Connector filled={i < current} vertical={vertical} />}
            </div>
            <div className={cn("min-w-0", vertical ? "pt-0.5 pb-6" : "pe-4", vertical && last && "pb-0")}>
              {state === "done" && onStepClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick(i, step)}
                  className="pl-focus-ring cursor-pointer rounded-xs text-start hover:[&>span:first-child]:text-accent-ink"
                >
                  {text}
                </button>
              ) : (
                text
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Marker({ state, index }: { state: "done" | "current" | "upcoming"; index: number }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full font-mono text-caption1 font-medium transition-colors duration-(--pl-duration-base)",
        state === "done" && "bg-accent text-on-accent",
        state === "current" && "bg-surface text-accent-ink shadow-[inset_0_0_0_1.5px_var(--pl-accent-ink),0_0_0_3px_var(--pl-accent-soft)]",
        state === "upcoming" && "pl-field bg-surface text-fg-subtle",
      )}
    >
      {state === "done" ? (
        <CheckIcon className="size-3.5 [&_path]:[stroke-dasharray:24] motion-safe:[&_path]:animate-[pl-check_var(--pl-duration-base)_var(--pl-ease-out)_both]" strokeWidth={2.75} />
      ) : (
        index + 1
      )}
    </span>
  );
}

function Connector({ filled, vertical }: { filled: boolean; vertical: boolean }) {
  return (
    <span aria-hidden="true" className={cn("relative overflow-hidden bg-separator", vertical ? "my-1 min-h-4 w-px flex-1" : "ms-2 h-px flex-1")}>
      <span
        className={cn(
          "absolute inset-0 bg-accent transition-transform duration-(--pl-duration-slow) ease-out motion-reduce:transition-none",
          vertical ? "origin-top" : "origin-left rtl:origin-right",
          filled ? "scale-100" : vertical ? "scale-y-0" : "scale-x-0",
        )}
      />
    </span>
  );
}
