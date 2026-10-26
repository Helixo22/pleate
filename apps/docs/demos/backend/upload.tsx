"use client";

import { FileUpload } from "pleate/file-upload";
import { useUpload } from "pleate-client/react";

const size = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

export default function UploadDemo() {
  // Each file is posted to /api/files as soon as it is picked, with its own progress.
  const upload = useUpload({ purpose: "attachment" });

  return (
    <div className="mx-auto grid w-full max-w-xl gap-4">
      <FileUpload
        multiple
        accept="image/*,application/pdf,text/plain"
        maxSize={25 * 1024 * 1024}
        title="Drop receipts or photos"
        description="Images, PDF or text, up to 25 MB each"
        {...upload.fileUploadProps}
      />
      {upload.uploaded.length > 0 && (
        <div className="rounded-2xl bg-bg p-4">
          <p className="mb-2 text-footnote font-semibold text-fg-muted">Stored on the server</p>
          <ul className="grid gap-1.5">
            {upload.uploaded.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-3 text-subhead">
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 font-mono text-caption1 text-fg-muted">
                  {file.content_type} · {size(file.size)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
