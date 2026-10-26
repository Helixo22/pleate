"use client";

import { FileUpload, fileKey, type FileUploadState } from "pleate/file-upload";
import { useEffect, useRef, useState } from "react";

export default function Demo() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploads, setUploads] = useState<Record<string, FileUploadState>>({});
  const timers = useRef(new Map<string, number>());
  const count = useRef(0);

  const set = (file: File, state: FileUploadState) => setUploads((u) => ({ ...u, [fileKey(file)]: state }));
  // Fake upload that climbs to 100%. Every third file fails once, so you can try Retry.
  const upload = (file: File, retry = false) => {
    const fails = !retry && count.current++ % 3 === 2;
    let progress = 0;
    set(file, { status: "uploading", progress });
    const id = window.setInterval(() => {
      progress += 0.06 + Math.random() * 0.1;
      if (fails && progress > 0.55) {
        window.clearInterval(id);
        set(file, { status: "error", error: "Connection lost. Try again." });
      } else if (progress >= 1) {
        window.clearInterval(id);
        set(file, { status: "done" });
      } else set(file, { status: "uploading", progress });
    }, 300);
    timers.current.set(fileKey(file), id);
  };

  // Start with three files already in different states.
  useEffect(() => {
    const now = Date.now();
    const sample = ["weekly-plan.pdf", "shopping-list.pdf", "receipts-october.pdf"].map(
      (name, i) => new File([new Uint8Array(180_000 * (i + 1))], name, { type: "application/pdf", lastModified: now }),
    );
    setFiles(sample);
    setUploads({
      [fileKey(sample[0])]: { status: "done" },
      [fileKey(sample[1])]: { status: "uploading", progress: 0.42 },
      [fileKey(sample[2])]: { status: "error", error: "The server took too long to answer." },
    });
  }, []);

  return (
    <FileUpload
      className="max-w-lg"
      value={files}
      onValueChange={(next) => {
        next.filter((f) => !files.includes(f)).forEach((f) => upload(f));
        setFiles(next);
      }}
      uploads={uploads}
      onRetry={(file) => upload(file, true)}
      onRemove={(file) => window.clearInterval(timers.current.get(fileKey(file)))}
      accept="image/*,.pdf"
      maxFiles={6}
    />
  );
}
