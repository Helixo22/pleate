// StepFlow: a multi-step panel. Numbered dots fill in as you advance (a check draws itself on finished steps), the
// content slides in from the side you are heading to, and the panel height eases to fit. Finished steps can be
// revisited from their dots. For a plain progress indicator use Stepper instead.
"use client";

import { AnimatePresence, motion } from "motion/react";
import { Children, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../../components/button/button.tsx";
import { cn } from "../../lib/cn.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type StepFlowProps = {
  /** One child per step. */
  children: ReactNode;
  /** Step titles, used for the dots' labels. */
  titles?: string[];
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
  backLabel?: string;
  nextLabel?: string;
  completeLabel?: string;
  /** Shown after the last step. */
  done?: ReactNode;
  className?: string;
};

export function StepFlow({ children, titles = [], initialStep = 0, onStepChange, onComplete, backLabel = "Back", nextLabel = "Continue", completeLabel = "Finish", done, className }: StepFlowProps) {
  const steps = Children.toArray(children);
  const [step, setStep] = useState(initialStep);
  const [dir, setDir] = useState(1);
  const reduced = useReducedMotion();
  const body = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const finished = step >= steps.length;
  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    if (next >= steps.length) onComplete?.();
    else onStepChange?.(next);
  };
  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const slide = reduced ? {} : { initial: { x: `${dir * 30}%`, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: `${dir * -30}%`, opacity: 0 } };

  return (
    <div className={cn("w-full max-w-lg rounded-3xl bg-surface p-6 shadow-[var(--pl-shadow-lg)] pl-field [--pl-field-border:var(--pl-separator)]", className)}>
      <ol className="flex items-center" aria-label="Progress">
        {steps.map((_, i) => {
          const state = i < step ? "done" : i === step ? "current" : "todo";
          const label = `Step ${i + 1}${titles[i] ? `: ${titles[i]}` : ""}${state === "done" ? ", completed" : ""}`;
          return (
            <li key={i} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
              <button
                type="button"
                aria-label={label}
                aria-current={state === "current" ? "step" : undefined}
                disabled={state === "todo" || finished}
                onClick={() => go(i)}
                className={cn(
                  "pl-focus-ring pl-touch grid size-8 shrink-0 place-items-center rounded-full text-footnote font-semibold transition-colors duration-300 disabled:cursor-default",
                  state === "todo" ? "bg-fill-2 text-fg-muted" : "bg-accent text-on-accent",
                  state === "current" && "ring-4 ring-accent-soft",
                )}
              >
                {state === "done" ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.1 }} />
                  </svg>
                ) : (
                  <span className="pl-tabular">{i + 1}</span>
                )}
              </button>
              {i < steps.length - 1 && (
                <span aria-hidden="true" className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-fill-2">
                  <span className="block h-full origin-left bg-accent transition-transform duration-500 ease-out" style={{ transform: `scaleX(${i < step ? 1 : 0})` }} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <motion.div className="relative overflow-hidden" animate={{ height }} transition={{ duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}>
        <div ref={body} className="py-6">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div key={step} {...slide} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              {finished ? done ?? <p className="text-headline">All done.</p> : steps[step]}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
      {!finished && (
        <div className={cn("flex", step > 0 ? "justify-between" : "justify-end")}>
          {step > 0 && (
            <Button variant="plain" tone="neutral" onClick={() => go(step - 1)}>
              {backLabel}
            </Button>
          )}
          <Button onClick={() => go(step + 1)}>{step === steps.length - 1 ? completeLabel : nextLabel}</Button>
        </div>
      )}
    </div>
  );
}
