// Composer: the prompt box of an AI chat. A rounded field that grows with the text, attachments as chips (button,
// drag and drop, or paste an image), a toolbar slot (model picker, tools), a mic button and the round send button
// that turns into Stop while a reply is generating. Enter sends, Shift+Enter adds a line (IME-safe).
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type ComposerProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called with the text and attachments; the composer clears itself afterwards. */
  onSubmit?: (message: { text: string; files: File[] }) => void;
  /** A reply is being generated: the send button becomes Stop. */
  generating?: boolean;
  onStop?: () => void;
  /** Attachments: accepted types (input accept syntax); omit to hide the paperclip. */
  accept?: string;
  maxFiles?: number;
  /** Mic button handler (start voice input). */
  onVoice?: () => void;
  /** Mic is active (shows it pressed). */
  listening?: boolean;
  /** Left side of the bottom bar (model picker, tools…). */
  toolbar?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  maxRows?: number;
  autoFocus?: boolean;
  labels?: Partial<Record<"input" | "send" | "stop" | "attach" | "voice" | "remove" | "drop", string>>;
  className?: string;
};

const L = { input: "Message", send: "Send", stop: "Stop generating", attach: "Attach files", voice: "Voice input", remove: "Remove", drop: "Drop files to attach" };

function Chip({ file, onRemove, label }: { file: File; onRemove: () => void; label: string }) {
  const url = useMemo(() => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);
  return (
    <div className="relative flex max-w-56 items-center gap-2 rounded-xl bg-fill-2 p-1.5 pe-8">
      {url ? (
        <img src={url} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-caption2 font-bold text-on-accent">
          {(file.name.split(".").pop() ?? "FILE").slice(0, 4).toUpperCase()}
        </span>
      )}
      <span className="min-w-0 truncate text-footnote font-medium">{file.name}</span>
      <button
        type="button"
        aria-label={`${label} ${file.name}`}
        onClick={onRemove}
        className="pl-focus-ring absolute end-1.5 top-1/2 grid size-5 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-fg-subtle/70 text-surface hover:bg-fg-subtle [&_svg]:size-3"
      >
        <XIcon strokeWidth={3} />
      </button>
    </div>
  );
}

export function Composer({
  value,
  defaultValue = "",
  onValueChange,
  onSubmit,
  generating = false,
  onStop,
  accept,
  maxFiles = 8,
  onVoice,
  listening = false,
  toolbar,
  placeholder = "Ask anything",
  disabled,
  maxRows = 8,
  autoFocus,
  labels,
  className,
}: ComposerProps) {
  const l = { ...L, ...labels };
  const [internal, setInternal] = useState(defaultValue);
  const text = value ?? internal;
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();

  const setText = (next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  const addFiles = (incoming: File[]) => {
    if (!accept) return;
    setFiles((list) => [...list, ...incoming].slice(0, maxFiles));
  };

  // Grow with the content where CSS field-sizing isn't available.
  useEffect(() => {
    const el = area.current;
    if (!el || CSS.supports?.("field-sizing", "content")) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const canSend = !disabled && !generating && (text.trim().length > 0 || files.length > 0);
  const submit = () => {
    if (!canSend) return;
    onSubmit?.({ text: text.trim(), files });
    setText("");
    setFiles([]);
    area.current?.focus();
  };

  const onPaste = (event: ClipboardEvent) => {
    const pasted = [...event.clipboardData.files];
    if (pasted.length && accept) {
      event.preventDefault();
      addFiles(pasted);
    }
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    addFiles([...event.dataTransfer.files]);
  };

  const iconButton =
    "pl-focus-ring grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-fg-muted transition-colors hover:bg-fill-2 hover:text-fg disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-5";

  return (
    <div
      onDragEnter={(e) => {
        if (accept && e.dataTransfer.types.includes("Files")) setDragging(true);
      }}
      onDragOver={(e) => accept && e.preventDefault()}
      onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "pl-focus-within-ring relative flex w-full flex-col gap-2 rounded-[1.625rem] bg-surface p-2 shadow-md",
        "transition-shadow duration-(--pl-duration-base)",
        dragging && "shadow-[0_0_0_2px_var(--pl-accent-ink)]",
        disabled && "opacity-60",
        className,
      )}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[inherit] bg-accent-soft text-subhead font-semibold text-accent-ink">
          {l.drop}
        </div>
      )}
      <AnimatePresence initial={false}>
        {files.length > 0 && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 overflow-hidden px-1 pt-1"
          >
            {files.map((file, i) => (
              <Chip key={`${file.name}-${i}`} file={file} label={l.remove} onRemove={() => setFiles((list) => list.filter((_, j) => j !== i))} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <textarea
        ref={area}
        rows={1}
        value={text}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={l.input}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onPaste={onPaste}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        className="field-sizing-content min-h-11 w-full resize-none bg-transparent px-2.5 pt-2 text-body text-fg outline-none placeholder:text-fg-subtle"
        style={{ maxHeight: `${maxRows}lh` }}
      />
      <div className="flex items-center gap-1">
        {accept && (
          <>
            <button type="button" aria-label={l.attach} title={l.attach} disabled={disabled || files.length >= maxFiles} onClick={() => picker.current?.click()} className={iconButton}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <input
              ref={picker}
              type="file"
              multiple
              accept={accept}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                addFiles([...(e.target.files ?? [])]);
                e.target.value = "";
              }}
            />
          </>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-1">{toolbar}</div>
        {onVoice && (
          <button type="button" aria-label={l.voice} aria-pressed={listening} onClick={onVoice} disabled={disabled} className={cn(iconButton, listening && "bg-danger-soft text-danger-ink hover:bg-danger-soft hover:text-danger-ink")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
            </svg>
          </button>
        )}
        <button
          type="button"
          aria-label={generating ? l.stop : l.send}
          onClick={generating ? onStop : submit}
          disabled={generating ? !onStop : !canSend}
          className={cn(
            "pl-focus-ring grid size-9 shrink-0 cursor-pointer place-items-center rounded-full transition-[background-color,color,scale] duration-(--pl-duration-fast)",
            "motion-safe:active:scale-90 disabled:cursor-default",
            generating || canSend ? "bg-fg text-bg" : "bg-fill text-fg-subtle",
          )}
        >
          {generating ? (
            <span className="size-3 rounded-[3px] bg-current" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
