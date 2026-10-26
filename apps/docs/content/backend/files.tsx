import { C, Callout, Code, Endpoints, Errors, H2, LI, P, Settings, UL } from "@/components/backend/prose";
import { LiveDemo } from "@/components/backend/live-demo";
import UploadDemo from "@/demos/backend/upload";

export default function Files() {
  return (
    <>
      <P>
        <C>pleate_backend.files</C> stores private uploads. Every user sees only their own files. By default the bytes go
        to MongoDB GridFS, so a development setup needs nothing else; production can switch to S3 or any compatible
        storage with one setting.
      </P>

      <LiveDemo
        file="upload"
        title="Upload with progress"
        description="useUpload posts each file as soon as it is picked, reports progress per file and supports retry and removal."
        signIn
        hint={<>Pick any small image or PDF</>}
      >
        <UploadDemo />
      </LiveDemo>

      <H2>What every upload goes through</H2>
      <UL>
        <LI><strong>Size and quota.</strong> At most <C>MAX_SIZE</C> per file and <C>USER_QUOTA</C> per user.</LI>
        <LI><strong>Type sniffing.</strong> The type is detected from the bytes with <C>filetype</C>. The type the browser claims and the extension are ignored, except that UTF-8 text with a <C>.txt</C>, <C>.md</C>, <C>.log</C> or <C>.csv</C> extension becomes <C>text/plain</C> or <C>text/csv</C>. Then it must be in <C>ALLOWED_TYPES</C>.</LI>
        <LI><strong>Image cleaning.</strong> Images are decoded and re-encoded with Pillow: EXIF and GPS metadata are dropped, the EXIF orientation is applied, and they are downscaled to <C>IMAGE_MAX_DIMENSION</C>.</LI>
        <LI><strong>Safe names.</strong> Paths, control and reserved characters are removed from the name; storage keys are random.</LI>
        <LI><strong>Safe downloads.</strong> <C>Content-Disposition: attachment</C> with an RFC 5987 <C>filename*</C>, <C>nosniff</C> and a <C>private</C> cache. <C>?inline=1</C> is honored only for images and PDF.</LI>
      </UL>

      <H2>Endpoints</H2>
      <Endpoints
        rows={[
          ["GET", "/files", <>My files. Page list, <C>search</C> on name, filters <C>content_type</C> and <C>purpose</C>, ordering by <C>created_at</C>, <C>size</C>, <C>name</C>.</>],
          ["POST", "/files", <>Multipart: <C>file</C> (one per request, upload several in parallel) and optional <C>purpose</C>. Throttle scope <C>upload</C>. 201.</>],
          ["GET", "/files/usage", <><C>{"{used, quota, count}"}</C> in bytes.</>],
          ["GET", "/files/<id>", "One file."],
          ["PATCH", "/files/<id>", <><C>{"{name}"}</C> renames.</>],
          ["DELETE", "/files/<id>", "Deletes the record and the blob. 204."],
          ["GET", "/files/<id>/download", <>The bytes. <C>?inline=1</C> for images and PDF.</>],
          ["POST", "/files/presign", <><C>{"{name, size, content_type, purpose?}"}</C> → <C>{"{file_id, upload_url, fields, expires_in}"}</C> for a direct S3 upload.</>],
          ["POST", "/files/<id>/complete", "After the direct upload: checks the size, sniffs the bytes, cleans images and marks the file ready."],
        ]}
      />
      <Code lang="json" title="A file">{`
{
  "id": "6720d0aa1b2c3d4e5f607182",
  "name": "receipt-october.pdf",
  "size": 182044,
  "content_type": "application/pdf",
  "checksum": "9f2c1e…",
  "width": null,
  "height": null,
  "purpose": "attachment",
  "status": "ready",
  "created_at": "2026-10-26T10:12:00Z"
}
`}</Code>

      <H2>From the client</H2>
      <Code lang="tsx">{`
const upload = useUpload({ purpose: "attachment", onUploaded: (file) => console.log(file.id) });

<FileUpload multiple {...upload.fileUploadProps} />
<Button disabled={upload.busy} onClick={() => save(upload.uploaded.map((f) => f.id))}>Save</Button>
`}</Code>
      <P>
        <C>useUpload</C> returns <C>files</C>, <C>uploads</C> (state per file), <C>uploaded</C> (the stored{" "}
        <C>FileItem</C>s), <C>busy</C>, <C>add</C>, <C>remove</C> (which also deletes the stored file), <C>retry</C> and{" "}
        <C>clear</C>. Without the hook: <C>{'client.files.upload(file, { purpose, onProgress, signal })'}</C>. Progress
        uses XMLHttpRequest, since fetch cannot report upload progress.
      </P>

      <H2>Direct uploads to S3</H2>
      <P>
        Large files can skip Django. With the S3 storage and <C>PRESIGNED_UPLOADS</C> on, the browser asks for a presigned
        POST, sends the bytes straight to the bucket, then calls <C>complete</C>, which runs the same checks. Files stay{" "}
        <C>pending</C> (hidden from lists) until completed, and pending files older than a day are removed by the hourly
        cleanup task.
      </P>
      <Code lang="ts">{`
const { file_id, upload_url, fields } = await client.files.presign({
  name: file.name, size: file.size, content_type: file.type,
});
const form = new FormData();
Object.entries(fields).forEach(([key, value]) => form.append(key, value));
form.append("file", file);
await fetch(upload_url, { method: "POST", body: form });
const stored = await client.files.complete(file_id);
`}</Code>
      <Code lang="python" title="settings.py">{`
PLEATE["FILES"] = {
    "STORAGE": "storages.backends.s3.S3Storage",   # pip install "pleate-backend[s3]"
    "PRESIGNED_UPLOADS": True,
}
AWS_STORAGE_BUCKET_NAME = "plate-uploads"
AWS_S3_REGION_NAME = "eu-south-1"
`}</Code>

      <H2>In Python</H2>
      <Code lang="python">{`
from pleate_backend.files.services import save_upload, open_file

file = save_upload(request.user, request.FILES["file"], purpose="avatar")   # runs every check
with open_file(file) as handle:
    data = handle.read()
`}</Code>
      <P>
        <C>File</C> has <C>owner</C>, <C>name</C>, <C>key</C>, <C>size</C>, <C>content_type</C>, <C>checksum</C> (SHA-256
        hex), <C>width</C>, <C>height</C>, <C>purpose</C>, <C>status</C> and <C>created_at</C>. Deleting a file, or its owner,
        deletes the blob. File metadata is part of the account export.
      </P>

      <H2>Settings</H2>
      <P><C>{`PLEATE["FILES"]`}</C>:</P>
      <Settings
        rows={[
          ["STORAGE", "GridFSStorage", <>Dotted path of a Django storage, e.g. <C>storages.backends.s3.S3Storage</C>.</>],
          ["MAX_SIZE", "26214400", "Bytes per file (25 MB)."],
          ["ALLOWED_TYPES", "images, PDF, text, CSV, zip, docx, xlsx", "Content types accepted after sniffing."],
          ["USER_QUOTA", "524288000", <>Bytes per user (500 MB), <C>None</C> for unlimited.</>],
          ["IMAGE_MAX_DIMENSION", "2400", "Longest side of stored images, in pixels."],
          ["AVATAR_MAX_SIZE", "2097152", "Avatar upload limit (2 MB)."],
          ["AVATAR_DIMENSION", "512", "Avatars are cropped to this square."],
          ["PRESIGNED_UPLOADS", "False", "Enable presign and complete. Needs the S3 storage."],
        ]}
      />

      <H2>Error codes</H2>
      <Errors
        rows={[
          ["file_too_large", "413", <>Over <C>MAX_SIZE</C>; the body has <C>max_size</C>.</>],
          ["file_type_not_allowed", "415", <>The sniffed type is not in <C>ALLOWED_TYPES</C>.</>],
          ["quota_exceeded", "413", <>Over <C>USER_QUOTA</C>; the body has <C>quota</C> and <C>used</C>.</>],
          ["invalid_image", "400", "Looks like an image but cannot be decoded."],
          ["presign_not_supported", "400", "Presigned uploads are off or the storage is not S3."],
          ["upload_not_found", "400", "complete was called but the object is not in the bucket."],
        ]}
      />
      <Callout>
        Uploads are throttled with the <C>upload</C> scope, 60 per hour per user by default.
      </Callout>
    </>
  );
}
