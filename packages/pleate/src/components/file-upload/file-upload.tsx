// FileUpload: pick files by dropping them on the zone, clicking it, or with the keyboard (it is a button). Checks
// type (accept), size and count, lists the files with image previews, sizes, optional upload progress and a remove
// button. "dropzone" is the large area; "button" a compact trigger with the same list. With `name` the files are
// part of the form submission (FormData).
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";
import { Button } from "../button/button.tsx";

export type FileRejection = { file: File; reason: "type" | "size" | "count"; message: string };

export type FileUploadProps = {
  value?: File[];
  defaultValue?: File[];
  onValueChange?: (files: File[]) => void;
  onReject?: (rejections: FileRejection[]) => void;
  /** Same syntax as <input accept>: "image/*,.pdf". */
  accept?: string;
  multiple?: boolean;
  /** Bytes. */
  maxSize?: number;
  maxFiles?: number;
  /** Upload progress per file name, 0–100. */
  progress?: Record<string, number>;
  variant?: "dropzone" | "button";
  title?: ReactNode;
  description?: ReactNode;
  buttonLabel?: ReactNode;
  removeLabel?: (file: File) => string;
  name?: string;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  className?: string;
};

export function formatBytes(bytes: number, locale?: string) {
  const units = ["byte", "kilobyte", "megabyte", "gigabyte"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return new Intl.NumberFormat(locale, { style: "unit", unit: units[i], unitDisplay: "short", maximumFractionDigits: i ? 1 : 0 }).format(n);
}

function matches(file: File, accept?: string) {
  if (!accept) return true;
  return accept.split(",").some((raw) => {
    const rule = raw.trim().toLowerCase();
    if (!rule) return false;
    if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule);
    if (rule.endsWith("/*")) return file.type.toLowerCase().startsWith(rule.slice(0, -1));
    return file.type.toLowerCase() === rule;
  });
}

const key = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;

function FileRow({ file, progress, onRemove, removeLabel, disabled }: { file: File; progress?: number; onRemove: () => void; removeLabel: string; disabled?: boolean }) {
  const image = file.type.startsWith("image/");
  const url = useMemo(() => (image ? URL.createObjectURL(file) : null), [file, image]);
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.slice(0, 4).toUpperCase() : "FILE";
  const done = progress === undefined || progress >= 100;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface p-2 pe-3 shadow-xs">
      {url ? (
        <img src={url} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent-soft text-caption2 font-bold text-accent-ink">{ext}</span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-subhead font-medium">{file.name}</span>
        {done ? (
          <span className="text-footnote text-fg-muted">{formatBytes(file.size)}</span>
        ) : (
          <span className="flex items-center gap-2">
            <span
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress!)}
              aria-label={`Uploading ${file.name}`}
              className="h-1 flex-1 overflow-hidden rounded-full bg-fill"
            >
              <span className="block h-full rounded-full bg-accent transition-[width] duration-(--pl-duration-base)" style={{ width: `${progress}%` }} />
            </span>
            <span className="pl-tabular w-9 text-end text-caption1 text-fg-muted">{Math.round(progress!)}%</span>
          </span>
        )}
      </div>
      <button
        type="button"
        aria-label={removeLabel}
        disabled={disabled}
        onClick={onRemove}
        className="pl-focus-ring grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-fg-muted transition-colors hover:bg-fill-2 hover:text-fg disabled:opacity-40 [&_svg]:size-4"
      >
        <XIcon strokeWidth={2.5} />
      </button>
    </div>
  );
}

export function FileUpload({
  value,
  defaultValue = [],
  onValueChange,
  onReject,
  accept,
  multiple = true,
  maxSize,
  maxFiles,
  progress,
  variant = "dropzone",
  title,
  description,
  buttonLabel = "Choose files",
  removeLabel = (f) => `Remove ${f.name}`,
  name,
  disabled,
  className,
  ...aria
}: FileUploadProps) {
  const [internal, setInternal] = useState<File[]>(defaultValue);
  const files = value ?? internal;
  const [over, setOver] = useState(false);
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const formInput = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();
  const hintId = useId();

  // Mirror the list into a hidden file input so it is part of FormData.
  useEffect(() => {
    if (!name || !formInput.current || typeof DataTransfer === "undefined") return;
    const transfer = new DataTransfer();
    files.forEach((f) => transfer.items.add(f));
    formInput.current.files = transfer.files;
  }, [files, name]);

  const update = (next: File[]) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  const add = (incoming: File[]) => {
    const rejected: FileRejection[] = [];
    const accepted: File[] = [];
    const existing = new Set(files.map(key));
    for (const file of incoming) {
      if (existing.has(key(file))) continue;
      if (!matches(file, accept)) rejected.push({ file, reason: "type", message: `${file.name}: this file type isn't supported.` });
      else if (maxSize && file.size > maxSize) rejected.push({ file, reason: "size", message: `${file.name} is larger than ${formatBytes(maxSize)}.` });
      else accepted.push(file);
    }
    let next = multiple ? [...files, ...accepted] : accepted.slice(0, 1);
    if (maxFiles && next.length > maxFiles) {
      next.slice(maxFiles).forEach((file) => rejected.push({ file, reason: "count", message: `Up to ${maxFiles} files.` }));
      next = next.slice(0, maxFiles);
    }
    setRejections(rejected);
    if (rejected.length) onReject?.(rejected);
    update(next);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    if (!disabled) add([...event.dataTransfer.files]);
  };

  const hint =
    description ??
    [accept && accept.replaceAll(",", ", "), maxSize && `up to ${formatBytes(maxSize)}`, maxFiles && multiple && `max ${maxFiles} files`]
      .filter(Boolean)
      .join(" · ");

  const picker = (
    <input
      ref={input}
      type="file"
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      tabIndex={-1}
      className="sr-only"
      aria-hidden="true"
      onChange={(event) => {
        add([...(event.target.files ?? [])]);
        event.target.value = "";
      }}
    />
  );

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {picker}
      {name && <input ref={formInput} type="file" name={name} multiple className="sr-only" tabIndex={-1} aria-hidden="true" />}
      {variant === "dropzone" ? (
        <button
          type="button"
          id={aria.id}
          disabled={disabled}
          aria-describedby={[hint && hintId, aria["aria-describedby"]].filter(Boolean).join(" ") || undefined}
          aria-invalid={aria["aria-invalid"]}
          onClick={() => input.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
          }}
          onDrop={onDrop}
          className={cn(
            "pl-focus-ring pl-touch flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center",
            "transition-[background-color,border-color,scale] duration-(--pl-duration-base) ease-ios disabled:cursor-not-allowed disabled:opacity-50",
            over ? "border-accent-ink bg-accent-soft motion-safe:scale-[1.01]" : "border-border bg-fill-3 hover:bg-fill-2",
            aria["aria-invalid"] && "border-danger-ink",
          )}
        >
          <span className={cn("grid size-12 place-items-center rounded-full transition-colors", over ? "bg-accent text-on-accent" : "bg-accent-soft text-accent-ink")}>
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 15v2.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V15" />
            </svg>
          </span>
          <span className="text-headline text-fg">{title ?? (over ? "Drop to upload" : multiple ? "Drop files or click to browse" : "Drop a file or click to browse")}</span>
          {hint && (
            <span id={hintId} className="text-footnote text-fg-muted">
              {hint}
            </span>
          )}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            id={aria.id}
            variant="gray"
            disabled={disabled}
            aria-describedby={[hint && hintId, aria["aria-describedby"]].filter(Boolean).join(" ") || undefined}
            onClick={() => input.current?.click()}
            startIcon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.3 3.3 0 0 1 4.7 4.7l-8.4 8.4a1.7 1.7 0 0 1-2.4-2.4L16 7.1" />
              </svg>
            }
          >
            {buttonLabel}
          </Button>
          {hint && (
            <span id={hintId} className="text-footnote text-fg-muted">
              {hint}
            </span>
          )}
        </div>
      )}

      {rejections.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 text-footnote font-medium text-danger-ink">
          {rejections.map((r) => (
            <li key={key(r.file) + r.reason}>{r.message}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Selected files">
          <AnimatePresence initial={false}>
            {files.map((file) => (
              <motion.li
                key={key(file)}
                layout={!reduced}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
              >
                <FileRow
                  file={file}
                  progress={progress?.[file.name]}
                  disabled={disabled}
                  removeLabel={removeLabel(file)}
                  onRemove={() => update(files.filter((f) => f !== file))}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
