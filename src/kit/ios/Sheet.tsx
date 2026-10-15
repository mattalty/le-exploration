import { AnimatePresence, animate, motion, useDragControls, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { GlassIconButton } from "./Controls";
import { Portal } from "./Portal";
import { useScreen } from "../device/ScreenContext";

export type Detent = "medium" | "large" | number;

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Allowed resting heights. A number is a height in points. Default ["medium", "large"]. */
  detents?: Detent[];
  /** Which detent to open at (index into detents). */
  initialDetent?: number;
  title?: ReactNode;
  /** Bar items on the left/right of the header. Right defaults to a close button. */
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Dim the content behind. Default true. */
  dimmed?: boolean;
  children: ReactNode;
}

const spring = { type: "spring", stiffness: 400, damping: 40 } as const;

/**
 * iOS 26 sheet. Floats inset as glass at smaller detents, goes edge to edge
 * at large. Drag the grabber/header between detents or down to dismiss.
 */
export function Sheet({
  open,
  onClose,
  detents = ["medium", "large"],
  initialDetent = 0,
  title,
  leading,
  trailing,
  dimmed = true,
  children,
}: SheetProps) {
  const { screen } = useScreen();
  const [screenH, setScreenH] = useState(874);
  useLayoutEffect(() => {
    if (screen) setScreenH(screen.clientHeight);
  }, [screen, open]);

  const largeH = screenH - 54; // leaves the status bar region visible, like iOS
  const heights = detents.map((d) => (d === "large" ? largeH : d === "medium" ? Math.round(screenH * 0.5) : d));
  const smallest = Math.min(...heights);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <SheetBody
            key="sheet"
            heights={heights}
            largeH={largeH}
            smallest={smallest}
            initial={heights[initialDetent] ?? heights[0]}
            onClose={onClose}
            title={title}
            leading={leading}
            trailing={trailing}
            dimmed={dimmed}
          >
            {children}
          </SheetBody>
        )}
      </AnimatePresence>
    </Portal>
  );
}

function SheetBody({
  heights,
  largeH,
  smallest,
  initial,
  onClose,
  title,
  leading,
  trailing,
  dimmed,
  children,
}: {
  heights: number[];
  largeH: number;
  smallest: number;
  initial: number;
  onClose: () => void;
  title?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  dimmed: boolean;
  children: ReactNode;
}) {
  const controls = useDragControls();
  // y = how far the large-height panel is pushed down. visible height = largeH - y.
  const y = useMotionValue(largeH);
  const inset = useTransform(y, [0, Math.max(1, largeH - smallest)], [0, 8], { clamp: true });
  const solid = useTransform(y, [0, Math.max(1, largeH - smallest)], [1, 0], { clamp: true });
  const dimOpacity = useTransform(y, [largeH - smallest, largeH], [1, 0], { clamp: true });

  useEffect(() => {
    animate(y, largeH - initial, spring);
    // Only on mount: open to the initial detent.
  }, []);

  const snap = (_: unknown, info: PanInfo) => {
    const projected = y.get() + info.velocity.y * 0.15;
    const visible = largeH - projected;
    if (visible < smallest * 0.6 || info.velocity.y > 1200) {
      onClose();
      return;
    }
    const nearest = heights.reduce((a, b) => (Math.abs(b - visible) < Math.abs(a - visible) ? b : a));
    animate(y, largeH - nearest, spring);
  };

  return (
    <>
      {dimmed && (
        <motion.div
          className="pointer-events-auto absolute inset-0 bg-[var(--ios-dim)]"
          style={{ opacity: dimOpacity }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
      )}
      <motion.div
        className="pointer-events-auto absolute flex flex-col overflow-hidden ios-glass"
        data-strong
        style={{
          y,
          left: inset,
          right: inset,
          bottom: inset,
          height: largeH,
          borderRadius: "var(--ios-radius-sheet)",
        }}
        exit={{ y: largeH + 20, transition: { type: "spring", stiffness: 400, damping: 45 } }}
        drag="y"
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: largeH }}
        dragElastic={{ top: 0.05, bottom: 0.3 }}
        dragMomentum={false}
        onDragEnd={snap}
      >
        <motion.div className="pointer-events-none absolute inset-0 bg-background" style={{ opacity: solid }} />
        <div className="relative shrink-0 touch-none" onPointerDown={(e) => controls.start(e)}>
          <div className="mx-auto mt-[5px] h-[5px] w-[36px] rounded-full bg-label-tertiary" />
          {(title || leading || trailing !== null) && (
            <div className="relative flex h-[56px] items-center justify-between px-4">
              <div className="flex min-w-[44px] gap-2">{leading}</div>
              {title && <div className="absolute left-1/2 -translate-x-1/2 text-headline text-label">{title}</div>}
              <div className="flex min-w-[44px] justify-end gap-2">
                {trailing === undefined ? (
                  <GlassIconButton aria-label="Close" onClick={onClose} size={40}>
                    <X size={20} strokeWidth={2.4} />
                  </GlassIconButton>
                ) : (
                  trailing
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(var(--safe-bottom)+8px)]">
          {children}
        </div>
      </motion.div>
    </>
  );
}
