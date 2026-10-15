import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { Search } from "lucide-react";
import { Glass } from "../ios/Glass";

/** One spring for every piece of the bar so they move together. */
const barSpring = { type: "spring", stiffness: 420, damping: 40, mass: 0.9 } as const;

const BAR_H = 62; // tab capsule / search button height
const ACC_H = 50; // bottom accessory height
const GAP = 12; // spacing between bar elements
const SIDE = 21; // screen-edge margin
/** Scroll distance in one direction before the bar changes state. */
const SCROLL_THRESHOLD = 24;

export interface Tab {
  id: string;
  label: string;
  /** A lucide-react icon (or any component taking size/strokeWidth). */
  icon: ComponentType<{ size?: number; strokeWidth?: number; fill?: string }>;
  content: ReactNode;
  badge?: number | string;
}

interface TabBarContextValue {
  /** Space (px, excluding safe area) pages should leave at the bottom for the bar. */
  inset: number;
  /** Height an accessory adds above the bar. */
  accessoryInset: number;
  /** Pages call this with their scroll position so the bar can minimise. */
  reportScroll: (y: number) => void;
  /**
   * Show a bottom accessory (e.g. a primary button) above the tab bar.
   * When the bar minimises it slides into the slot between the tab and search buttons.
   * Page does this automatically for its `bottomBar`.
   */
  setAccessory: (owner: string, node: ReactNode | null) => void;
  /** Whether this tab is the one on screen. */
  visible: boolean;
}

const TabBarContext = createContext<TabBarContextValue | null>(null);
export const useTabBar = () => useContext(TabBarContext);

export interface TabViewProps {
  tabs: Tab[];
  /** Separate circular search tab on the right (iOS 26). */
  search?: { content: ReactNode };
  /** Collapse the bar to the active tab when scrolling down. */
  minimizeOnScroll?: boolean;
  initialTab?: string;
  onChange?: (id: string) => void;
}

type Accessory = { owner: string; node: ReactNode };

/**
 * iOS 26 tab bar: a floating Liquid Glass capsule with a sliding selection
 * lens, an optional separate search button, minimise-on-scroll, and a bottom
 * accessory slot. Each tab's content stays mounted (keeps its stack and scroll).
 */
export function TabView({ tabs, search, minimizeOnScroll, initialTab, onChange }: TabViewProps) {
  const [active, setActive] = useState(initialTab ?? tabs[0]?.id);
  const lastTab = useRef(active);
  const [minimized, setMinimized] = useState(false);
  const [accessories, setAccessories] = useState<Record<string, Accessory | undefined>>({});

  const select = (id: string) => {
    if (id !== "__search") lastTab.current = id;
    setMinimized(false);
    setActive(id);
    onChange?.(id);
  };

  // Accumulate scroll in one direction so slow, steady scrolls still trigger.
  const scroll = useRef({ last: 0, acc: 0 });
  const reportScroll = useCallback(
    (y: number) => {
      if (!minimizeOnScroll) return;
      const s = scroll.current;
      const dy = y - s.last;
      s.last = y;
      if (Math.abs(dy) > 200) {
        s.acc = 0; // jumped (switched page), not a real scroll
        return;
      }
      s.acc = Math.sign(dy) === Math.sign(s.acc) ? s.acc + dy : dy;
      if (y < 40) setMinimized(false);
      else if (s.acc > SCROLL_THRESHOLD) setMinimized(true);
      else if (s.acc < -SCROLL_THRESHOLD) setMinimized(false);
    },
    [minimizeOnScroll],
  );

  const all = search ? [...tabs, { id: "__search", label: "Search", icon: Search, content: search.content }] : tabs;
  const accessory = accessories[active];
  const compactTab = tabs.find((t) => t.id === (active === "__search" ? lastTab.current : active)) ?? tabs[0];

  return (
    <>
      <div className="absolute inset-0">
        {all.map((t) => (
          <TabPane
            key={t.id}
            id={t.id}
            visible={t.id === active}
            reportScroll={reportScroll}
            setAccessories={setAccessories}
          >
            {t.content}
          </TabPane>
        ))}
      </div>

      <Bar
        tabs={tabs}
        active={active}
        compactTab={compactTab}
        minimized={minimized}
        hasSearch={!!search}
        accessory={accessory}
        onSelect={select}
        onExpand={() => setMinimized(false)}
      />
    </>
  );
}

function TabPane({
  id,
  visible,
  reportScroll,
  setAccessories,
  children,
}: {
  id: string;
  visible: boolean;
  reportScroll: (y: number) => void;
  setAccessories: React.Dispatch<React.SetStateAction<Record<string, Accessory | undefined>>>;
  children: ReactNode;
}) {
  const setAccessory = useCallback(
    (owner: string, node: ReactNode | null) =>
      setAccessories((prev) => {
        if (node === null) {
          // Only the page that set the accessory may clear it.
          return prev[id]?.owner === owner ? { ...prev, [id]: undefined } : prev;
        }
        return { ...prev, [id]: { owner, node } };
      }),
    [id, setAccessories],
  );
  const ctx = useMemo(
    () => ({ inset: BAR_H + 12, accessoryInset: ACC_H + 10, reportScroll, setAccessory, visible }),
    [reportScroll, setAccessory, visible],
  );
  return (
    <TabBarContext.Provider value={ctx}>
      <div className="absolute inset-0" style={{ display: visible ? "block" : "none" }}>
        {children}
      </div>
    </TabBarContext.Provider>
  );
}

/**
 * Lays out the capsule, search button and accessory with explicit geometry so
 * every transition is one coordinated spring instead of separate layout jumps.
 */
function Bar({
  tabs,
  active,
  compactTab,
  minimized,
  hasSearch,
  accessory,
  onSelect,
  onExpand,
}: {
  tabs: Tab[];
  active: string;
  compactTab: Tab;
  minimized: boolean;
  hasSearch: boolean;
  accessory?: Accessory;
  onSelect: (id: string) => void;
  onExpand: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const searchSpace = hasSearch ? BAR_H + GAP : 0;
  const capsuleW = minimized ? BAR_H : width - searchSpace;
  const acc = minimized
    ? { left: BAR_H + GAP, bottom: (BAR_H - ACC_H) / 2, width: width - BAR_H - GAP - searchSpace }
    : { left: 0, bottom: BAR_H + 10, width };

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute z-[500]"
      style={{
        left: SIDE,
        right: SIDE,
        height: BAR_H + ACC_H + 10,
        bottom: "max(8px, calc(var(--safe-bottom) - 13px))",
      }}
    >
      {/* Tab capsule */}
      <motion.div
        className="pointer-events-auto absolute bottom-0 left-0"
        initial={false}
        animate={{ width: capsuleW }}
        transition={barSpring}
        style={{ height: BAR_H }}
      >
        <Glass className="relative h-full w-full overflow-hidden rounded-full">
          <motion.div
            className="absolute inset-y-0 left-0 flex items-center p-[4px]"
            style={{ width: width - searchSpace, pointerEvents: minimized ? "none" : "auto" }}
            initial={false}
            animate={{ opacity: minimized ? 0 : 1, scale: minimized ? 0.92 : 1 }}
            transition={{ ...barSpring, opacity: { duration: minimized ? 0.12 : 0.22, delay: minimized ? 0 : 0.06 } }}
          >
            {tabs.map((t) => (
              <TabButton key={t.id} tab={t} selected={t.id === active} onClick={() => onSelect(t.id)} />
            ))}
          </motion.div>
          <motion.button
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: "var(--ios-tint)", pointerEvents: minimized ? "auto" : "none" }}
            initial={false}
            animate={{ opacity: minimized ? 1 : 0, scale: minimized ? 1 : 0.6 }}
            transition={{ ...barSpring, opacity: { duration: minimized ? 0.22 : 0.1, delay: minimized ? 0.05 : 0 } }}
            onClick={onExpand}
            aria-label={`Expand tab bar (${compactTab.label})`}
          >
            <compactTab.icon size={24} strokeWidth={2.4} />
          </motion.button>
        </Glass>
      </motion.div>

      {/* Search button */}
      {hasSearch && (
        <div className="pointer-events-auto absolute bottom-0 right-0" style={{ width: BAR_H, height: BAR_H }}>
          <Glass className="flex h-full w-full items-center justify-center rounded-full">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect("__search")}
              className="flex size-[54px] items-center justify-center rounded-full"
              style={{ color: active === "__search" ? "var(--ios-tint)" : "var(--ios-label)" }}
              aria-label="Search"
            >
              <Search size={24} strokeWidth={active === "__search" ? 2.4 : 2} />
            </motion.button>
          </Glass>
        </div>
      )}

      {/* Bottom accessory */}
      <AnimatePresence>
        {accessory && (
          <motion.div
            key={accessory.owner}
            className="pointer-events-auto absolute flex items-center [&>*]:w-full"
            style={{ height: ACC_H }}
            initial={{ ...acc, opacity: 0, y: 16 }}
            animate={{ ...acc, opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.15 } }}
            transition={barSpring}
          >
            {accessory.node}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ tab, selected, onClick }: { tab: Tab; selected: boolean; onClick: () => void }) {
  const Icon = tab.icon;
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="relative flex h-[54px] min-w-0 flex-1 flex-col items-center justify-center rounded-full px-1"
      style={{ color: selected ? "var(--ios-tint)" : "var(--ios-label)" }}
    >
      {selected && (
        <motion.span layoutId="tab-lens" transition={barSpring} className="absolute inset-0 rounded-full bg-fill-tertiary" />
      )}
      <span className="relative">
        <Icon size={22} strokeWidth={selected ? 2.4 : 2} />
        {tab.badge !== undefined && (
          <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ios-red px-1 text-[12px] font-medium text-white">
            {tab.badge}
          </span>
        )}
      </span>
      <span className="relative mt-[2px] text-[10px] font-semibold leading-[12px] tracking-[0.1px]">{tab.label}</span>
    </motion.button>
  );
}
