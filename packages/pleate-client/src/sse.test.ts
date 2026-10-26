import { describe, expect, it } from "vitest";

import { parseSse, type SseEvent } from "./sse.ts";

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(chunks: string[]): Promise<SseEvent[]> {
  const out: SseEvent[] = [];
  for await (const event of parseSse(streamOf(chunks))) out.push(event);
  return out;
}

const SAMPLE =
  'retry: 3000\n\nevent: start\ndata: {"message": {"id": "m1"}}\n\n: ping\n\nevent: delta\ndata: {"text": "Hel"}\n\nevent: delta\ndata: {"text": "lo"}\n\nevent: done\nid: 7\ndata: {"ok": true}\n\n';

describe("parseSse", () => {
  it("parses named events with JSON data and ids, skipping comments and retry lines", async () => {
    const events = await collect([SAMPLE]);
    expect(events).toEqual([
      { event: "start", data: { message: { id: "m1" } }, id: undefined },
      { event: "delta", data: { text: "Hel" }, id: undefined },
      { event: "delta", data: { text: "lo" }, id: undefined },
      { event: "done", data: { ok: true }, id: "7" },
    ]);
  });

  it("gives the same result whatever the chunk boundaries", async () => {
    const expected = await collect([SAMPLE]);
    for (const size of [1, 2, 3, 5, 7, 13]) {
      const chunks: string[] = [];
      for (let i = 0; i < SAMPLE.length; i += size) chunks.push(SAMPLE.slice(i, i + size));
      expect(await collect(chunks)).toEqual(expected);
    }
  });

  it("splits inside a multi byte character without corrupting it", async () => {
    const bytes = new TextEncoder().encode('data: {"text": "caffè \u{1F37D}"}\n\n');
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
        controller.close();
      },
    });
    const out: SseEvent[] = [];
    for await (const e of parseSse(stream)) out.push(e);
    expect(out).toEqual([{ event: "message", data: { text: "caffè \u{1F37D}" }, id: undefined }]);
  });

  it("joins multi line data with newlines and keeps plain text payloads", async () => {
    const events = await collect(["event: note\ndata: first line\ndata: second line\n\n", "data:no space\n\n"]);
    expect(events).toEqual([
      { event: "note", data: "first line\nsecond line", id: undefined },
      { event: "message", data: "no space", id: undefined },
    ]);
  });

  it("handles CRLF line endings and heartbeats only streams", async () => {
    expect(await collect([": ping\r\n\r\n: ping\r\n\r\n"])).toEqual([]);
    const events = await collect(["event: a\r\ndata: 1\r\n\r\nevent: b\r\n", "data: 2\r\n\r\n"]);
    expect(events.map((e) => [e.event, e.data])).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });

  it("emits a last event without the trailing blank line", async () => {
    expect(await collect(["event: done\ndata: {}"])).toEqual([{ event: "done", data: {}, id: undefined }]);
  });

  it("stops when the signal aborts", async () => {
    const controller = new AbortController();
    const encoder = new TextEncoder();
    let pulls = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(c) {
        pulls += 1;
        c.enqueue(encoder.encode(`data: ${pulls}\n\n`));
      },
    });
    const seen: unknown[] = [];
    await expect(
      (async () => {
        for await (const e of parseSse(stream, controller.signal)) {
          seen.push(e.data);
          if (seen.length === 3) controller.abort();
        }
      })(),
    ).resolves.toBeUndefined();
    expect(seen.slice(0, 3)).toEqual([1, 2, 3]);
    expect(seen.length).toBeLessThan(6);
  });

  it("cancels the body right away when the signal is already aborted", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        // never produces: only a cancel ends this stream
      },
      cancel() {
        cancelled = true;
      },
    });
    const controller = new AbortController();
    controller.abort();
    const seen: unknown[] = [];
    for await (const e of parseSse(stream, controller.signal)) seen.push(e);
    expect(seen).toEqual([]);
    expect(cancelled).toBe(true);
  });
});
