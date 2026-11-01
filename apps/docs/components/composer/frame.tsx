// The preview iframe. The canvas renders in /composer/frame, a same-origin page sized to the device width, so the
// library's media queries (md:, lg:...) see a real tablet or phone. The editor sends the page state down with
// postMessage; the frame sends edits (select, drop, move, duplicate, delete, undo) back up. The iframe is scaled to
// fit the canvas area.
"use client";

import { useEffect, useRef, useState } from "react";
import { CanvasBlocks, themeProps, type CanvasProps, type DragPayload } from "./canvas";
import type { Block, SiteTheme } from "./model";

export type FrameState = { blocks: Block[]; names: Record<string, string>; selected: string | null; theme: SiteTheme; scale: number };

type FromFrame =
  | { type: "ready" }
  | { type: "select"; id: string | null }
  | { type: "drop"; payload: DragPayload; index: number }
  | { type: "move"; id: string; by: -1 | 1 }
  | { type: "duplicate"; id: string }
  | { type: "delete"; id: string }
  | { type: "undo" }
  | { type: "redo" };

export type FrameHandlers = Pick<CanvasProps, "onSelect" | "onDrop" | "onMove" | "onDuplicate" | "onDelete"> & { onUndo: () => void; onRedo: () => void };

export const FRAME_PATH = "/composer/frame";

/** Editor side: the scaled iframe. */
export function FrameHost({ width, state, handlers }: { width: number; state: Omit<FrameState, "scale">; handlers: FrameHandlers }) {
  const outer = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const live = useRef(handlers);
  live.current = handlers;

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    if (outer.current) ro.observe(outer.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent<FromFrame>) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow) return;
      const m = e.data;
      const h = live.current;
      if (m.type === "ready") setReady(true);
      else if (m.type === "select") h.onSelect(m.id);
      else if (m.type === "drop") h.onDrop(m.payload, m.index);
      else if (m.type === "move") h.onMove(m.id, m.by);
      else if (m.type === "duplicate") h.onDuplicate(m.id);
      else if (m.type === "delete") h.onDelete(m.id);
      else if (m.type === "undo") h.onUndo();
      else if (m.type === "redo") h.onRedo();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const scale = box.w ? Math.min(1, box.w / width) : 1;
  const message = { ...state, scale };
  const json = JSON.stringify(message);
  const lastSent = useRef("");
  useEffect(() => {
    if (!ready) return;
    lastSent.current = json;
    frame.current?.contentWindow?.postMessage({ type: "state", state: JSON.parse(json) }, location.origin);
  }, [ready, json]);

  // A reload of the frame (dev refresh) says ready again: resend the state.
  useEffect(() => {
    const onReady = (e: MessageEvent<FromFrame>) => {
      if (e.source === frame.current?.contentWindow && e.data?.type === "ready" && lastSent.current)
        frame.current?.contentWindow?.postMessage({ type: "state", state: JSON.parse(lastSent.current) }, location.origin);
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, []);

  return (
    <div ref={outer} className="size-full">
      {box.w > 0 && (
        <div className="mx-auto overflow-hidden rounded-lg shadow-[0_0_0_1px_var(--pl-separator)]" style={{ width: width * scale, height: box.h }}>
          <iframe
            ref={frame}
            src={FRAME_PATH}
            title="Page preview"
            style={{ width, height: box.h / scale, transform: `scale(${scale})`, transformOrigin: "top left" }}
            className="block border-0 bg-bg"
          />
        </div>
      )}
    </div>
  );
}

/** Frame side: renders whatever the editor sends and reports edits back. */
export function FrameClient() {
  const [state, setState] = useState<FrameState | null>(null);
  useEffect(() => {
    const post = (m: FromFrame) => window.parent.postMessage(m, location.origin);
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== window.parent) return;
      if (e.data?.type === "state") setState(e.data.state as FrameState);
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!(e.metaKey || e.ctrlKey) || e.altKey || (k !== "z" && k !== "y")) return;
      e.preventDefault();
      post({ type: k === "y" || e.shiftKey ? "redo" : "undo" });
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKey);
    post({ type: "ready" });
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    // Portaled parts of demos (menus, dialogs) render on <body>: give the document the canvas theme too.
    if (!state) return;
    document.documentElement.dataset.theme = state.theme.mode;
  }, [state]);

  const post = (m: FromFrame) => window.parent.postMessage(m, location.origin);
  const theme = state ? themeProps(state.theme) : null;
  return (
    // Covers the docs chrome, which this route still gets from the root layout.
    <main
      {...(theme ?? {})}
      style={{ ...theme?.style, ["--composer-scale" as string]: state?.scale ?? 1 }}
      className="fixed inset-0 z-(--pl-z-overlay) overflow-y-auto bg-bg text-fg"
    >
      {state && (
        <CanvasBlocks
          blocks={state.blocks}
          names={state.names}
          selected={state.selected}
          onSelect={(id) => {
            setState((s) => (s ? { ...s, selected: id } : s));
            post({ type: "select", id });
          }}
          onDrop={(payload, index) => post({ type: "drop", payload, index })}
          onMove={(id, by) => post({ type: "move", id, by })}
          onDuplicate={(id) => post({ type: "duplicate", id })}
          onDelete={(id) => post({ type: "delete", id })}
        />
      )}
    </main>
  );
}
