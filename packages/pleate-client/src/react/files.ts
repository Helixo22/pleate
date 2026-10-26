"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import type { FileItem } from "../api.ts";
import { ApiError } from "../errors.ts";
import { keys, usePleateClient } from "./provider.tsx";

/** Same key pleate's FileUpload uses for its `uploads` prop. */
export const fileKey = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;

type UploadState = { status: "uploading" | "done" | "error"; progress?: number; error?: string };

/**
 * Uploads files as soon as they are picked, with per file progress, retry
 * and removal. Spread `fileUploadProps` on <FileUpload>.
 *
 *     const upload = useUpload({ purpose: "attachment" });
 *     <FileUpload multiple {...upload.fileUploadProps} />
 *     upload.uploaded // FileItem[] ready to reference by id
 */
export function useUpload(options: { purpose?: string; concurrency?: number; onUploaded?: (file: FileItem) => void } = {}) {
  const client = usePleateClient();
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [results, setResults] = useState<Record<string, FileItem>>({});
  const controllers = useRef(new Map<string, AbortController>());
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const patch = (key: string, state: UploadState) => setUploads((prev) => ({ ...prev, [key]: state }));

  const start = useCallback(
    async (file: File) => {
      const key = fileKey(file);
      const controller = new AbortController();
      controllers.current.set(key, controller);
      patch(key, { status: "uploading", progress: 0 });
      try {
        const item = await client.files.upload(file, {
          purpose: optionsRef.current.purpose,
          signal: controller.signal,
          onProgress: (progress) => patch(key, { status: "uploading", progress }),
        });
        patch(key, { status: "done", progress: 1 });
        setResults((prev) => ({ ...prev, [key]: item }));
        optionsRef.current.onUploaded?.(item);
        qc.invalidateQueries({ queryKey: keys.list("/files") });
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        patch(key, { status: "error", error: error instanceof ApiError ? error.message : "Upload failed." });
      } finally {
        controllers.current.delete(key);
      }
    },
    [client, qc],
  );

  // Mirror of `files`, so `add` starts uploads outside of a state updater
  // (updaters run twice under StrictMode, which uploaded every file twice).
  const filesRef = useRef<File[]>([]);
  const commitFiles = (next: File[]) => {
    filesRef.current = next;
    setFiles(next);
  };

  const add = useCallback(
    (next: File[]) => {
      const known = new Set(filesRef.current.map(fileKey));
      const fresh = next.filter((f) => {
        const key = fileKey(f);
        if (known.has(key)) return false;
        known.add(key);
        return true;
      });
      if (!fresh.length) return;
      commitFiles([...filesRef.current, ...fresh]);
      fresh.forEach((f) => void start(f));
    },
    [start],
  );

  const remove = useCallback(
    (file: File) => {
      const key = fileKey(file);
      controllers.current.get(key)?.abort();
      const uploaded = results[key];
      if (uploaded) void client.files.remove(uploaded.id).catch(() => {});
      commitFiles(filesRef.current.filter((f) => fileKey(f) !== key));
      setUploads(({ [key]: _u, ...rest }) => rest);
      setResults(({ [key]: _r, ...rest }) => rest);
    },
    [client, results],
  );

  const uploaded = files.map((f) => results[fileKey(f)]).filter(Boolean) as FileItem[];

  return {
    files,
    uploads,
    uploaded,
    busy: Object.values(uploads).some((u) => u.status === "uploading"),
    add,
    remove,
    retry: (file: File) => void start(file),
    clear: () => {
      controllers.current.forEach((c) => c.abort());
      commitFiles([]);
      setUploads({});
      setResults({});
    },
    fileUploadProps: {
      value: files,
      onValueChange: (next: File[]) => {
        const nextKeys = new Set(next.map(fileKey));
        files.filter((f) => !nextKeys.has(fileKey(f))).forEach(remove);
        add(next);
      },
      uploads,
      onRetry: (file: File) => void start(file),
      onRemove: remove,
    },
  };
}
