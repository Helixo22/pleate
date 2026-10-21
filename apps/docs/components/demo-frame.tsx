// One example on a component page: live preview on a solid card, with a Code tab showing the example's own file.
"use client";

import { Check, Copy } from "lucide-react";
import { motion } from "motion/react";
import { cn, IconButton, spring } from "pleate";
import { useState, type ReactNode } from "react";

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
  const [copied, setCopied] = useState(false);
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-title3">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-subhead text-fg-muted">{description}</p>}
        </div>
        <div role="tablist" aria-label={`${title} view`} className="flex shrink-0 rounded-full bg-fill-2 p-0.5">
          {(["preview", "code"] as const).map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                "pl-focus-ring relative h-7 cursor-pointer rounded-full px-3 text-footnote font-semibold capitalize transition-colors",
                tab === value ? "text-fg" : "text-fg-muted hover:text-fg",
              )}
            >
              {tab === value && (
                <motion.span layoutId={`tab-${id}`} transition={spring.snap} className="absolute inset-0 rounded-full bg-surface shadow-sm" />
              )}
              <span className="relative">{value}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl bg-surface shadow-sm">
        {tab === "preview" ? (
          <div
            role="tabpanel"
            className={cn(
              "flex min-h-48 flex-wrap gap-4 p-6 md:p-10",
              align === "center" && "items-center justify-center",
              align === "start" && "items-start justify-start",
              align === "stretch" && "flex-col items-stretch",
            )}
          >
            {children}
          </div>
        ) : (
          <div role="tabpanel" className="relative">
            <IconButton
              aria-label={copied ? "Copied" : "Copy code"}
              size="sm"
              variant="gray"
              tone="neutral"
              className="absolute end-3 top-3"
              onClick={() => {
                void navigator.clipboard.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
              }}
              icon={copied ? <Check /> : <Copy />}
            />
            <pre className="max-h-[32rem] overflow-auto bg-surface-2 p-6 pe-14 font-mono text-[0.8125rem] leading-relaxed text-fg">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
