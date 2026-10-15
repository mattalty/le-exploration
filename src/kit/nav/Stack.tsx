import { animate, motion, motionValue, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

/** iOS navigation push/pop spring. */
export const pushSpring = { type: "spring", stiffness: 380, damping: 40, mass: 1 } as const;

interface Entry {
  key: number;
  element: ReactNode;
  x: MotionValue<number>;
}

export interface StackApi {
  /** Push a new screen, sliding in from the right. */
  push: (element: ReactNode) => void;
  /** Pop the top screen. */
  pop: () => void;
  popToRoot: () => void;
  /** Index of the screen calling the hook (0 = root). */
  index: number;
  depth: number;
}

const StackContext = createContext<StackApi | null>(null);

/** Navigation for the nearest <Stack>. Returns null outside a stack. */
export const useStack = () => useContext(StackContext);

/**
 * A UINavigationController-style stack: push/pop with parallax and
 * interactive swipe-back from the left edge.
 *
 *   <Stack root={<Inbox />} />
 *   const nav = useStack(); nav.push(<Detail id={1} />)
 */
export function Stack({ root }: { root: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nextKey = useRef(1);
  const rootX = useMotionValue(0);
  const [entries, setEntries] = useState<Entry[]>(() => [{ key: 0, element: root, x: rootX }]);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const width = () => containerRef.current?.clientWidth ?? 402;

  const push = useCallback((element: ReactNode) => {
    const x = motionValue(width());
    const entry = { key: nextKey.current++, element, x };
    setEntries((e) => [...e, entry]);
    requestAnimationFrame(() => animate(x, 0, pushSpring));
  }, []);

  const pop = useCallback(() => {
    const list = entriesRef.current;
    if (list.length < 2) return;
    const top = list[list.length - 1];
    animate(top.x, width(), { ...pushSpring, restDelta: 0.5 }).then(() =>
      setEntries((e) => e.filter((en) => en.key !== top.key)),
    );
  }, []);

  const popToRoot = useCallback(() => {
    const list = entriesRef.current;
    if (list.length < 2) return;
    const top = list[list.length - 1];
    // Drop the middle screens instantly, animate only the top one out.
    setEntries([list[0], top]);
    animate(top.x, width(), pushSpring).then(() => setEntries([list[0]]));
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {entries.map((entry, i) => (
        <StackScreen
          key={entry.key}
          entry={entry}
          nextX={entries[i + 1]?.x}
          isTop={i === entries.length - 1}
          index={i}
          getWidth={width}
          api={{ push, pop, popToRoot, index: i, depth: entries.length }}
        />
      ))}
    </div>
  );
}

function StackScreen({
  entry,
  nextX,
  isTop,
  index,
  getWidth,
  api,
}: {
  entry: Entry;
  nextX?: MotionValue<number>;
  isTop: boolean;
  index: number;
  getWidth: () => number;
  api: StackApi;
}) {
  const fallback = useMotionValue(Number.POSITIVE_INFINITY);
  const source = nextX ?? fallback;
  // Covered screens slide 30% left as the next one comes in.
  const x = useTransform(() => {
    const own = entry.x.get();
    const next = source.get();
    const parallax = Number.isFinite(next) ? Math.min(0, (next - getWidth()) * 0.3) : 0;
    return own + parallax;
  });
  const shadow = useTransform(entry.x, (v) => {
    const w = getWidth();
    const t = Math.max(0, Math.min(1, 1 - v / w));
    return index === 0 ? "none" : `-8px 0 32px rgba(0,0,0,${0.18 * t})`;
  });

  const { push, pop, popToRoot, depth } = api;
  const value = useMemo(() => ({ push, pop, popToRoot, index, depth }), [push, pop, popToRoot, index, depth]);

  return (
    <StackContext.Provider value={value}>
      <motion.div
        className="absolute inset-0 bg-background"
        style={{ x, boxShadow: shadow }}
        aria-hidden={!isTop}
        inert={!isTop}
      >
        {entry.element}
      </motion.div>
      {isTop && index > 0 && <SwipeBackEdge x={entry.x} getWidth={getWidth} onPop={api.pop} />}
    </StackContext.Provider>
  );
}

/** Invisible strip along the left edge that drives interactive swipe-back. */
function SwipeBackEdge({ x, getWidth, onPop }: { x: MotionValue<number>; getWidth: () => number; onPop: () => void }) {
  const start = useRef<number | null>(null);
  return (
    <div
      className="absolute inset-y-0 left-0 z-50 w-[24px] touch-none"
      onPointerDown={(e) => {
        start.current = e.clientX;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (start.current === null) return;
        // clientX is in viewport pixels; the device may be scaled down.
        const el = e.currentTarget.parentElement!;
        const scale = el.getBoundingClientRect().width / el.clientWidth || 1;
        x.set(Math.max(0, (e.clientX - start.current) / scale));
      }}
      onPointerUp={() => {
        if (start.current === null) return;
        start.current = null;
        const w = getWidth();
        if (x.get() > w * 0.4 || x.getVelocity() > 600) {
          onPop();
        } else {
          animate(x, 0, pushSpring);
        }
      }}
      onPointerCancel={() => {
        start.current = null;
        animate(x, 0, pushSpring);
      }}
    />
  );
}
