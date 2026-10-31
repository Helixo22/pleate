// Snippet: a code or command block with a copy button. A header strip holds the language (mono meta), an optional
// tab rail for variants (npm, pnpm, yarn) and the copy button, so long lines scroll under nothing. The copy button
// draws a check for 1.4s, only after the clipboard write succeeded.
"use client";

import { motion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { useState, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "../../lib/cn.ts";
import { CopyIcon } from "../../lib/icons.tsx";
import { closeButton } from "../../lib/overlay-styles.ts";
import { useCopy } from "../../lib/use-copy.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type SnippetTab = { label: string; code: string };

export type SnippetProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  ref?: Ref<HTMLElement>;
  /** The code; ignored when `tabs` is set. */
  code?: string;
  /** Variants of the same command, shown as a tab rail in the header. */
  tabs?: SnippetTab[];
  /** Mono meta in the header, e.g. "bash" or "tsx". */
  language?: string;
  /** Drawn before every line and left out of the copy, e.g. "$". */
  prompt?: string;
  /** Height (px or any CSS length) after which the code scrolls. */
  maxHeight?: number | string;
  /** Wrap long lines instead of scrolling sideways. */
  wrap?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
};

function Code({ code, prompt, wrap, maxHeight, label }: { code: string; prompt?: string; wrap: boolean; maxHeight?: number | string; label: string }) {
  return (
    <pre
      // Scrollable regions need to be reachable by keyboard.
      tabIndex={0}
      aria-label={label}
      className={cn(
        "overflow-auto px-3 py-2.5 font-mono text-footnote text-fg outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--pl-ring)]",
        wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
      )}
      style={{ maxHeight }}
    >
      <code>
        {prompt
          ? code.split("\n").map((line, i) => (
              <span key={i} className={cn("block", wrap && "ps-[2ch] -indent-[2ch]")}>
                <span aria-hidden="true" className="select-none text-fg-subtle">
                  {prompt}{" "}
                </span>
                {line}
              </span>
            ))
          : code}
      </code>
    </pre>
  );
}

function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const { copied, copy } = useCopy(1400);
  const reduced = useReducedMotion();
  return (
    <>
      <button type="button" aria-label={copied ? copiedLabel : label} onClick={() => copy(text)} className={cn(closeButton, copied && "text-fg")}>
        {copied ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              initial={{ pathLength: reduced ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduced ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
        ) : (
          <CopyIcon strokeWidth={2} />
        )}
      </button>
      <span role="status" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </>
  );
}

export function Snippet({
  code = "",
  tabs,
  language,
  prompt,
  maxHeight,
  wrap = false,
  copyLabel = "Copy",
  copiedLabel = "Copied",
  className,
  ...props
}: SnippetProps) {
  const [active, setActive] = useState(tabs?.[0]?.label ?? "");
  const current = tabs?.find((t) => t.label === active)?.code ?? tabs?.[0]?.code ?? code;
  const name = language ?? "Code";
  // p-px keeps children (scrollbars, header fill) inside the 1px inset border drawn by pl-field.
  const frame = cn("pl-field flex min-w-0 flex-col overflow-hidden rounded-md bg-surface p-px", className);
  const meta = language && <span className="truncate font-mono text-caption1 text-fg-subtle">{language}</span>;
  const header = (rail?: ReactNode) => (
    <div className="flex h-9 shrink-0 items-center gap-2 ps-3 pe-1 shadow-[inset_0_-1px_0_var(--pl-separator)]">
      {rail}
      <div className={cn("flex min-w-0 items-center", rail ? "ms-auto" : "flex-1")}>{meta}</div>
      <CopyButton text={current} label={copyLabel} copiedLabel={copiedLabel} />
    </div>
  );

  if (!tabs?.length) {
    return (
      <figure className={frame} {...props}>
        {header()}
        <Code code={code} prompt={prompt} wrap={wrap} maxHeight={maxHeight} label={name} />
      </figure>
    );
  }

  return (
    <TabsPrimitive.Root asChild value={active} onValueChange={setActive}>
      <figure className={frame} {...props}>
        {header(
          <TabsPrimitive.List aria-label={language ? `${language} variants` : "Variants"} className="pl-no-scrollbar -ms-1.5 flex min-w-0 items-center gap-0.5 overflow-x-auto">
            {tabs.map((t) => (
              <TabsPrimitive.Trigger
                key={t.label}
                value={t.label}
                className="pl-focus-ring pl-touch h-6 shrink-0 cursor-pointer rounded-xs px-1.5 font-mono text-caption1 text-fg-subtle transition-colors duration-(--pl-duration-fast) hover:text-fg data-[state=active]:bg-fill-2 data-[state=active]:text-fg"
              >
                {t.label}
              </TabsPrimitive.Trigger>
            ))}
          </TabsPrimitive.List>,
        )}
        {tabs.map((t) => (
          <TabsPrimitive.Content key={t.label} value={t.label} tabIndex={-1} className="outline-none">
            <Code code={t.code} prompt={prompt} wrap={wrap} maxHeight={maxHeight} label={`${name}, ${t.label}`} />
          </TabsPrimitive.Content>
        ))}
      </figure>
    </TabsPrimitive.Root>
  );
}
