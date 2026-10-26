/** An event written to a `text/event-stream` body, like pleate-backend's `sse_format`. */
export interface MockSseEvent {
  event?: string;
  data?: unknown;
  id?: string;
}

export function formatSse(event: MockSseEvent | null): string {
  if (event === null) return ": ping\n\n";
  const lines: string[] = [];
  if (event.id) lines.push(`id: ${event.id}`);
  if (event.event) lines.push(`event: ${event.event}`);
  lines.push(`data: ${JSON.stringify(event.data ?? null)}`);
  return `${lines.join("\n")}\n\n`;
}

/**
 * A streaming SSE response fed by an async generator. The generator gets a
 * signal that aborts when the client goes away (reader cancelled or request
 * aborted), so it can stop its timers and save partial work.
 */
export function sseResponse(
  produce: (signal: AbortSignal) => AsyncGenerator<MockSseEvent | null | string>,
  requestSignal?: AbortSignal,
): Response {
  const encoder = new TextEncoder();
  const controller = new AbortController();
  const abort = () => controller.abort();
  requestSignal?.addEventListener("abort", abort);
  let iterator: AsyncGenerator<MockSseEvent | null | string> | undefined;

  const body = new ReadableStream<Uint8Array>({
    start() {
      iterator = produce(controller.signal);
    },
    async pull(stream) {
      try {
        const { value, done } = await iterator!.next();
        if (done || controller.signal.aborted) {
          requestSignal?.removeEventListener("abort", abort);
          try {
            stream.close();
          } catch {
            // already closed by a cancel
          }
          return;
        }
        stream.enqueue(encoder.encode(typeof value === "string" ? value : formatSse(value)));
      } catch (error) {
        requestSignal?.removeEventListener("abort", abort);
        stream.error(error);
      }
    },
    async cancel() {
      controller.abort();
      requestSignal?.removeEventListener("abort", abort);
      await iterator?.return(undefined);
    },
  });

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
