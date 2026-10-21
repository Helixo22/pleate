// Chat building blocks.
// - ChatThread: the scrolling list. Stays pinned to the bottom while new messages and streamed text arrive, unless
//   the reader scrolled up — then a "latest" button appears. role="log" so new messages are announced politely.
// - Message: one turn. "bubble" (messaging look: user right in accent, assistant left in gray) or "document"
//   (assistant text full width, as in AI chat apps). Avatar, name, time, status, and actions shown on hover/focus.
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { ChevronDownIcon } from "../../lib/icons.tsx";
import { spring } from "../../motion/tokens.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type ChatThreadProps = HTMLAttributes<HTMLDivElement> & {
  /** Distance in px from the bottom that still counts as "at the bottom". */
  threshold?: number;
  latestLabel?: string;
  /** Classes of the inner column (max width, padding). */
  contentClassName?: string;
};

export function ChatThread({ className, contentClassName, threshold = 80, latestLabel = "Jump to latest", children, ...props }: ChatThreadProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const [away, setAway] = useState(false);
  const reduced = useReducedMotion();

  const toBottom = useCallback(
    (smooth: boolean) => {
      const el = scroller.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduced ? "smooth" : "auto" });
    },
    [reduced],
  );

  // Follow the content while pinned: new messages and every streamed token grow it.
  useLayoutEffect(() => {
    const el = content.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (pinned.current) toBottom(false);
    });
    observer.observe(el);
    toBottom(false);
    return () => observer.disconnect();
  }, [toBottom]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      pinned.current = distance < threshold;
      setAway(!pinned.current);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return (
    <div className={cn("relative flex min-h-0 flex-col", className)} {...props}>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain [contain:inline-size]">
        <div ref={content} role="log" aria-live="polite" aria-relevant="additions" className={cn("mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6", contentClassName)}>
          {children}
        </div>
      </div>
      <AnimatePresence>
        {away && (
          <motion.button
            type="button"
            aria-label={latestLabel}
            onClick={() => {
              pinned.current = true;
              toBottom(true);
            }}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={reduced ? { duration: 0.1 } : spring.snap}
            className="pl-focus-ring absolute start-1/2 bottom-4 grid size-9 -translate-x-1/2 cursor-pointer place-items-center rounded-full bg-elevated text-fg shadow-lg [&_svg]:size-5"
          >
            <ChevronDownIcon strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export type MessageProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  role: "user" | "assistant" | "system";
  variant?: "bubble" | "document";
  avatar?: ReactNode;
  name?: ReactNode;
  time?: ReactNode;
  /** Delivery state of a user message. */
  status?: "sending" | "sent" | "error";
  /** Shown under the message on hover / focus (always on touch). */
  actions?: ReactNode;
  /** Attachments, sources or cards under the text. */
  footer?: ReactNode;
  /** Groups consecutive messages: hides avatar/name and tightens the corner. */
  continued?: boolean;
  errorLabel?: ReactNode;
};

export function Message({
  role,
  variant = "bubble",
  avatar,
  name,
  time,
  status,
  actions,
  footer,
  continued,
  errorLabel = "Not delivered",
  className,
  children,
  ...props
}: MessageProps) {
  const reduced = useReducedMotion();
  if (role === "system") {
    return (
      <div className={cn("self-center rounded-full bg-fill-2 px-3 py-1 text-center text-footnote text-fg-muted", className)} {...props}>
        {children}
      </div>
    );
  }
  const user = role === "user";
  const doc = variant === "document" && !user;
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring.soft}
      data-role={role}
      className={cn("group/msg flex w-full gap-3", user ? "flex-row-reverse" : "flex-row", continued && "-mt-3.5", className)}
      {...(props as object)}
    >
      {!user && avatar !== undefined && <div className={cn("w-8 shrink-0", continued && "invisible")}>{avatar}</div>}
      <div className={cn("flex min-w-0 flex-col gap-1", user ? "items-end" : "items-start", doc ? "flex-1" : "max-w-[min(85%,36rem)]")}>
        {(name || time) && !continued && (
          <div className={cn("flex items-baseline gap-2 px-1 text-footnote", user && "flex-row-reverse")}>
            {name && <span className="font-semibold text-fg">{name}</span>}
            {time && <span className="text-fg-subtle">{time}</span>}
          </div>
        )}
        <div
          className={cn(
            "min-w-0 text-body",
            doc
              ? "w-full text-fg"
              : [
                  "rounded-[1.25rem] px-3.5 py-2",
                  user ? "bg-accent text-on-accent" : "bg-fill-2 text-fg",
                  !continued && (user ? "rounded-br-md" : "rounded-bl-md"),
                ],
            status === "sending" && "opacity-70",
          )}
        >
          {children}
        </div>
        {footer && <div className="w-full">{footer}</div>}
        {status === "error" && <span className="px-1 text-footnote font-medium text-danger-ink">{errorLabel}</span>}
        {actions && (
          <div className="flex items-center gap-0.5 opacity-100 transition-opacity duration-(--pl-duration-fast) md:opacity-0 md:group-hover/msg:opacity-100 md:group-focus-within/msg:opacity-100">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Small icon button for message actions (copy, retry, rate). */
export function MessageAction({ label, className, children, ...props }: HTMLAttributes<HTMLButtonElement> & { label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "pl-focus-ring grid size-8 cursor-pointer place-items-center rounded-lg text-fg-muted transition-colors hover:bg-fill-2 hover:text-fg [&_svg]:size-4",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
