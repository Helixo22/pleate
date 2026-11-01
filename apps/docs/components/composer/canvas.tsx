// The composer canvas: a frame at the chosen device width, scaled down to fit, with its own theme, and the page's
// sections inside. Sections are selected by click or focus, reordered by dragging their handle (pointer events)
// or with the move buttons, and new ones dropped in from the library (native drag and drop).
"use client";

import { ArrowDown, ArrowUp, Copy, GripVertical, Trash2 } from "lucide-react";
import { cn, IconButton } from "pleate";
import { createPalette, paletteStyle } from "pleate/theme";
import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { SECTIONS, type Block, type SiteTheme } from "./model";
import { SectionView } from "./sections";

export type Device = "desktop" | "tablet" | "mobile";
export const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, tablet: 834, mobile: 390 };
export const DRAG_TYPE = "application/x-pleate-composer";
export type DragPayload = { kind: "new"; item: string } | { kind: "move"; id: string };

/** The theme of the canvas only: data-theme / data-palette / roundness on the frame, never on the docs. */
export function themeProps(theme: SiteTheme): { "data-theme": string; "data-palette"?: string; style: CSSProperties } {
  const custom = theme.palette === "custom";
  return {
    "data-theme": theme.mode,
    "data-palette": custom ? undefined : theme.palette,
    style: { ...(custom ? paletteStyle(createPalette(theme.custom), theme.mode) : {}), "--pl-roundness": theme.roundness } as CSSProperties,
  };
}

/** Renders children at `width` px and scales them down to the available width. */
export function ScaledFrame({ width, theme, children, className }: { width: number; theme: SiteTheme; children: ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ avail: width, height: 0 });
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => setBox({ avail: outer.current?.clientWidth ?? width, height: inner.current?.offsetHeight ?? 0 }));
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, [width]);
  const scale = Math.min(1, box.avail / width);
  return (
    <div ref={outer} className="w-full">
      <div className="mx-auto" style={{ width: width * scale, height: box.height * scale }}>
        <div
          ref={inner}
          {...themeProps(theme)}
          style={{ ...themeProps(theme).style, width, transform: `scale(${scale})`, transformOrigin: "top left", ["--composer-scale" as string]: scale }}
          className={cn("min-h-[40rem] overflow-hidden bg-bg text-fg", className)}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

type CanvasProps = {
  blocks: Block[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onDrop: (payload: DragPayload, index: number) => void;
  onMove: (id: string, by: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

export function CanvasBlocks({ blocks, selected, onSelect, onDrop, onMove, onDuplicate, onDelete }: CanvasProps) {
  const list = useRef<HTMLDivElement>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const indexAt = (y: number) => {
    const items = [...(list.current?.querySelectorAll<HTMLElement>(":scope > [data-block]") ?? [])];
    const i = items.findIndex((el) => {
      const r = el.getBoundingClientRect();
      return y < r.top + r.height / 2;
    });
    return i === -1 ? items.length : i;
  };
  const over = (e: DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDropAt(indexAt(e.clientY));
  };
  const drop = (e: DragEvent) => {
    const data = e.dataTransfer.getData(DRAG_TYPE);
    setDropAt(null);
    if (!data) return;
    e.preventDefault();
    try {
      onDrop(JSON.parse(data) as DragPayload, indexAt(e.clientY));
    } catch {
      // not our payload
    }
  };

  const line = (i: number) =>
    dropAt === i && (
      <div aria-hidden className="relative h-0">
        <div className="absolute inset-x-0 -top-0.5 z-10 h-1 bg-accent" />
      </div>
    );

  return (
    <div
      ref={list}
      className="min-h-[40rem]"
      onDragOver={over}
      onDragLeave={(e) => !list.current?.contains(e.relatedTarget as Node) && setDropAt(null)}
      onDrop={drop}
      onClick={(e) => e.target === e.currentTarget && onSelect(null)}
    >
      {blocks.length === 0 && (
        <div className="m-8 grid min-h-[30rem] place-items-center rounded-xl border-2 border-dashed border-border text-center text-callout text-fg-muted">
          <p>
            Drag a section here,
            <br />
            or pick one from the library.
          </p>
        </div>
      )}
      {blocks.map((block, i) => {
        const name = SECTIONS[block.type].name;
        const active = selected === block.id;
        return (
          <Fragment key={block.id}>
          {line(i)}
          <div
            data-block={block.id}
            role="group"
            aria-label={`${name} section`}
            tabIndex={0}
            onFocus={() => onSelect(block.id)}
            onClickCapture={(e) => {
              // Links inside the preview select the section instead of navigating.
              if ((e.target as Element).closest("a")) e.preventDefault();
              onSelect(block.id);
            }}
            className={cn(
              // The ring sits on an overlay: an outline on the wrapper would paint under the sections' own backgrounds.
              "group/block relative focus-visible:outline-none",
              "after:pointer-events-none after:absolute after:inset-0 after:z-40 after:ring-inset",
              active ? "after:ring-2 after:ring-accent" : "hover:after:ring-1 hover:after:ring-accent/60 focus-visible:after:ring-2 focus-visible:after:ring-accent",
            )}
          >
            <div
              className={cn(
                "absolute end-2 top-2 z-[45] flex items-center gap-0.5 rounded-full bg-elevated p-1 text-fg shadow-lg",
                "[transform:scale(calc(1/var(--composer-scale,1)))] origin-top-right",
                active ? "flex" : "hidden group-hover/block:flex group-focus-within/block:flex",
              )}
            >
              <span
                aria-hidden
                title="Drag to reorder"
                // Pointer events, not native drag and drop: works with touch and inside the scaled frame.
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  onSelect(block.id);
                  setDragging(block.id);
                }}
                onPointerMove={(e) => {
                  if (dragging !== block.id) return;
                  setDropAt(indexAt(e.clientY));
                  const scroller = list.current?.closest("main");
                  const r = scroller?.getBoundingClientRect();
                  if (scroller && r) scroller.scrollBy(0, e.clientY < r.top + 60 ? -16 : e.clientY > r.bottom - 60 ? 16 : 0);
                }}
                onPointerUp={(e) => {
                  if (dragging === block.id) onDrop({ kind: "move", id: block.id }, indexAt(e.clientY));
                  setDragging(null);
                  setDropAt(null);
                }}
                onPointerCancel={() => (setDragging(null), setDropAt(null))}
                className="grid size-7 cursor-grab touch-none place-items-center text-fg-muted active:cursor-grabbing [&_svg]:size-4"
              >
                <GripVertical />
              </span>
              <span className="px-1.5 text-footnote font-medium">{name}</span>
              <IconButton size="xs" variant="plain" tone="neutral" aria-label={`Move ${name} up`} icon={<ArrowUp />} disabled={i === 0} onClick={() => onMove(block.id, -1)} />
              <IconButton size="xs" variant="plain" tone="neutral" aria-label={`Move ${name} down`} icon={<ArrowDown />} disabled={i === blocks.length - 1} onClick={() => onMove(block.id, 1)} />
              <IconButton size="xs" variant="plain" tone="neutral" aria-label={`Duplicate ${name}`} icon={<Copy />} onClick={() => onDuplicate(block.id)} />
              <IconButton size="xs" variant="plain" tone="danger" aria-label={`Delete ${name}`} icon={<Trash2 />} onClick={() => onDelete(block.id)} />
            </div>
            <SectionView block={block} editing />
          </div>
          </Fragment>
        );
      })}
      {line(blocks.length)}
    </div>
  );
}
