/** One Server-Sent Event. `data` is JSON decoded when possible. */
export interface SseEvent<T = unknown> {
  event: string;
  data: T;
  id?: string;
}

/**
 * Parses a `text/event-stream` body. Works with fetch, so it supports POST
 * requests and custom headers (EventSource does not).
 */
export async function* parseSse<T = unknown>(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<SseEvent<T>> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const onAbort = () => reader.cancel().catch(() => {});
  signal?.addEventListener("abort", onAbort);
  // Aborted before the body was read: the listener above would never fire.
  if (signal?.aborted) void onAbort();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary: number;
      while ((boundary = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const chunk = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary).replace(/^\r?\n\r?\n/, "");
        const event = parseChunk<T>(chunk);
        if (event) yield event;
      }
    }
    const tail = parseChunk<T>(buffer);
    if (tail) yield tail;
  } finally {
    signal?.removeEventListener("abort", onAbort);
    reader.releaseLock();
  }
}

function parseChunk<T>(chunk: string): SseEvent<T> | null {
  let event = "message";
  let id: string | undefined;
  const data: string[] = [];
  for (const line of chunk.split(/\r?\n/)) {
    if (!line || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
    else if (field === "id") id = value;
  }
  if (!data.length) return null;
  const raw = data.join("\n");
  let parsed: unknown = raw;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // plain text payload
  }
  return { event, data: parsed as T, id };
}
