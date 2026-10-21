// BottomSheet: the iOS sheet. It rises from the bottom to the first snap point; drag the grabber or the header to
// move between snap points (fractions of the screen height, e.g. [0.5, 0.92]); a flick down from the lowest one
// closes it. The backdrop fades with the sheet. Radix Dialog underneath: focus trap, Escape, labelled by the title.
// On wide screens the sheet keeps a comfortable width, centered.
"use client";

import { animate, AnimatePresence, motion, useDragControls, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { Dialog } from "radix-ui";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn.ts";
import { XIcon } from "../../lib/icons.tsx";
import { closeButton } from "../../lib/overlay-styles.ts";
import { spring } from "../../motion/tokens.ts";
import { useReducedMotion } from "../../motion/use-reduced-motion.ts";

export type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  /** Heights as fractions of the viewport, ascending. The sheet opens at `defaultSnap`. */
  snapPoints?: number[];
  defaultSnap?: number;
  /** Called with the index of the snap point the sheet settled on. */
  onSnapChange?: (index: number) => void;
  /** Drag down or tap the backdrop to close (default true). */
  dismissible?: boolean;
  showClose?: boolean;
  closeLabel?: string;
  /** Pinned under the scrolling content (buttons). */
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
};

function useViewportHeight() {
  const [height, setHeight] = useState(() => (typeof window === "undefined" ? 800 : window.innerHeight));
  useEffect(() => {
    const update = () => setHeight(window.visualViewport?.height ?? window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return height;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  snapPoints = [0.92],
  defaultSnap = 0,
  onSnapChange,
  dismissible = true,
  showClose = false,
  closeLabel = "Close",
  footer,
  children,
  className,
}: BottomSheetProps) {
  const vh = useViewportHeight();
  const reduced = useReducedMotion();
  const drag = useDragControls();
  const points = [...snapPoints].sort((a, b) => a - b);
  const sheetHeight = Math.round(points[points.length - 1] * vh);
  // y = how far the sheet is pushed down from fully open; each snap point is a y offset.
  const offsets = points.map((p) => sheetHeight - Math.round(p * vh));
  const y = useMotionValue(sheetHeight);
  const backdrop = useTransform(y, [offsets[0], sheetHeight], [1, 0]);
  // The footer stays on the visible edge at every snap point, and leaves with the sheet when it closes.
  const footerY = useTransform(y, (value) => -Math.min(value, offsets[0]));
  const [snap, setSnap] = useState(defaultSnap);

  const settle = (index: number) => {
    setSnap(index);
    onSnapChange?.(index);
    animate(y, offsets[index], reduced ? { duration: 0 } : spring.sheet);
  };

  useEffect(() => {
    if (open) setSnap(defaultSnap);
  }, [open, defaultSnap]);

  // Keep the sheet on its snap point when the viewport changes (rotation, keyboard).
  useEffect(() => {
    if (open) y.set(offsets[Math.min(snap, offsets.length - 1)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vh]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // Project the release with its velocity, then pick the nearest snap point (or close below the lowest one).
    const projected = y.get() + info.velocity.y * 0.18;
    const lowest = offsets[0];
    if (dismissible && (projected > lowest + (sheetHeight - lowest) * 0.45 || (info.velocity.y > 900 && snap === 0))) {
      onOpenChange(false);
      return;
    }
    let nearest = 0;
    offsets.forEach((offset, i) => {
      if (Math.abs(offset - projected) < Math.abs(offsets[nearest] - projected)) nearest = i;
    });
    settle(nearest);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next || dismissible ? onOpenChange(next) : undefined)}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay forceMount asChild>
              <motion.div
                className="fixed inset-0 z-(--pl-z-modal) bg-overlay"
                style={{ opacity: backdrop }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              forceMount
              asChild
              {...(!description && { "aria-describedby": undefined })}
              // Focus the sheet itself, not its first button: no focus ring flashing on open; Tab still enters it.
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                (event.currentTarget as HTMLElement | null)?.focus();
              }}
              onEscapeKeyDown={(event) => !dismissible && event.preventDefault()}
              onPointerDownOutside={(event) => !dismissible && event.preventDefault()}
            >
              <motion.div
                className={cn(
                  "fixed inset-x-0 bottom-0 z-(--pl-z-modal) mx-auto flex w-full flex-col rounded-t-[1.75rem] bg-elevated text-fg shadow-xl outline-none md:max-w-xl",
                  className,
                )}
                style={{ height: sheetHeight, y }}
                initial={{ y: sheetHeight }}
                animate={{ y: offsets[defaultSnap] ?? offsets[0] }}
                exit={{ y: sheetHeight }}
                transition={reduced ? { duration: 0.15 } : spring.sheet}
                drag="y"
                dragListener={false}
                dragControls={drag}
                dragConstraints={{ top: 0, bottom: sheetHeight }}
                dragElastic={{ top: 0.08, bottom: 0.4 }}
                dragMomentum={false}
                onDragEnd={onDragEnd}
              >
                {/* Drag handle area: grabber + header. */}
                <div className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing" onPointerDown={(event) => drag.start(event)}>
                  <div className="flex justify-center pt-2 pb-1">
                    <span aria-hidden="true" className="h-1.5 w-9 rounded-full bg-fill" />
                  </div>
                  {(title || showClose) && (
                    <div className="flex items-start gap-3 px-5 pt-1 pb-3">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        {title && <Dialog.Title className="text-headline">{title}</Dialog.Title>}
                        {description && <Dialog.Description className="text-footnote text-fg-muted">{description}</Dialog.Description>}
                      </div>
                      {showClose && (
                        <Dialog.Close className={closeButton} aria-label={closeLabel}>
                          <XIcon strokeWidth={2.5} />
                        </Dialog.Close>
                      )}
                    </div>
                  )}
                  {!title && <Dialog.Title className="sr-only">Sheet</Dialog.Title>}
                </div>
                <div
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5"
                  // The visible part shrinks at lower snap points: keep the end of the content reachable.
                  style={{ paddingBottom: `calc(${offsets[snap] ?? 0}px + 1rem + ${footer ? "0px" : "var(--pl-safe-bottom)"})` }}
                >
                  {children}
                </div>
                {footer && (
                  <motion.div
                    style={{ y: footerY }}
                    className="shrink-0 border-t border-separator bg-elevated px-5 pt-3 pb-[calc(0.75rem+var(--pl-safe-bottom))]"
                  >
                    {footer}
                  </motion.div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
