// One example on a component page: live preview on a solid card, with a Code tab showing the example's own file.
"use client";

import { motion } from "motion/react";
import { cn, spring } from "pleate";
import { useState, type ReactNode } from "react";
import { CopyButton } from "./backend/copy-button";

export function DemoFrame({
  id,
  title,
  description,
  code,
  children,
  align = "center",
}: {
  id: string;
  title: string;
  description?: string;
  code: string;
  children: ReactNode;
  align?: "center" | "start" | "stretch";
}) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-title3 text-fg">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-subhead text-fg-muted">{description}</p>}
        </div>
        <div role="tablist" aria-label={`${title} view`} className="pl-field flex shrink-0 rounded-md bg-surface-2 p-0.5 [--pl-field-border:var(--pl-separator)]">
          {(["preview", "code"] as const).map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                "pl-focus-ring relative h-7 cursor-pointer rounded-[calc(var(--radius-md)-2px)] px-2.5 text-footnote font-medium capitalize transition-colors",
                tab === value ? "text-fg" : "text-fg-muted hover:text-fg",
              )}
            >
              {tab === value && (
                <motion.span layoutId={`tab-${id}`} transition={spring.snap} className="absolute inset-0 rounded-[calc(var(--radius-md)-2px)] bg-surface shadow-[inset_0_0_0_1px_var(--pl-border),var(--pl-lip)] dark:bg-fill-2" />
              )}
              <span className="relative">{value}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="pl-field overflow-clip rounded-xl bg-surface [--pl-field-border:var(--pl-separator)]">
        {tab === "preview" ? (
          <div
            role="tabpanel"
            className={cn(
              "flex min-h-48 gap-4 p-6 md:p-10",
              align === "center" && "flex-wrap items-center justify-center",
              align === "start" && "flex-wrap items-start justify-start",
              // No wrap here: a wrapping column sizes itself to its widest child instead of the frame.
              align === "stretch" && "flex-col items-stretch",
            )}
          >
            {children}
          </div>
        ) : (
          <div role="tabpanel" className="relative">
            <CopyButton text={code} variant="surface" className="absolute end-3 top-3" />
            <pre className="max-h-[32rem] overflow-auto bg-surface-2 p-5 pe-14 font-mono text-[0.8125rem] leading-relaxed text-fg">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
