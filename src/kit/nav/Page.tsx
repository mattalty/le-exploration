import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { GlassIconButton } from "../ios/Controls";
import { useStack } from "./Stack";
import { useTabBar } from "./TabView";

export interface PageProps {
  title?: string;
  /** Large title that collapses into the bar on scroll (default true for root screens). */
  largeTitle?: boolean;
  /** Leading bar items. Defaults to a glass back button when inside a Stack. */
  leading?: ReactNode;
  /** Trailing bar items, e.g. <GlassIconButton>. */
  trailing?: ReactNode;
  /** Content under the large title that scrolls with it, e.g. a SearchField. */
  header?: ReactNode;
  /** "grouped" = systemGroupedBackground (lists), "plain" = systemBackground. */
  background?: "grouped" | "plain" | string;
  /** Hide the nav bar entirely (full-bleed screens). */
  hideNavBar?: boolean;
  /**
   * Fixed content pinned to the bottom, e.g. a primary button. Inside a TabView it
   * becomes the tab bar's accessory: it sits above the bar, then slides into the
   * slot beside the minimised bar on scroll (iOS 26 behaviour).
   */
  bottomBar?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A screen with an iOS 26 navigation bar: content scrolls under a soft blur
 * edge, the large title collapses into a centred inline title, and bar
 * buttons are floating glass circles.
 */
export function Page({
  title,
  largeTitle,
  leading,
  trailing,
  header,
  background = "plain",
  hideNavBar,
  bottomBar,
  children,
  className,
}: PageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const stack = useStack();
  const tabBar = useTabBar();
  const isRoot = !stack || stack.index === 0;
  const showLarge = largeTitle ?? isRoot;
  const { scrollY } = useScroll({ container: ref });

  // Hand the bottom bar to the tab bar while this page is the top of its stack.
  const owner = useId();
  const isTop = !stack || stack.index === stack.depth - 1;
  const asAccessory = !!tabBar && !!bottomBar;
  useEffect(() => {
    if (!tabBar || !bottomBar || !isTop) return;
    tabBar.setAccessory(owner, bottomBar);
    return () => tabBar.setAccessory(owner, null);
  }, [tabBar, bottomBar, isTop, owner]);

  useMotionValueEvent(scrollY, "change", (y) => tabBar?.reportScroll(y));

  const inlineTitleOpacity = useTransform(scrollY, showLarge ? [28, 44] : [0, 1], [showLarge ? 0 : 1, 1]);
  const edgeOpacity = useTransform(scrollY, [0, 16], [0, 1]);

  const bg =
    background === "grouped" ? "var(--ios-grouped-bg)" : background === "plain" ? "var(--ios-bg)" : background;
  const bottomInset = tabBar
    ? `calc(var(--safe-bottom) + ${tabBar.inset + (bottomBar ? tabBar.accessoryInset : 0)}px)`
    : `calc(var(--safe-bottom) + ${bottomBar ? 72 : 16}px)`;

  const backButton =
    !isRoot && stack ? (
      <GlassIconButton aria-label="Back" onClick={stack.pop}>
        <ChevronLeft size={26} strokeWidth={2.4} className="-ml-0.5" />
      </GlassIconButton>
    ) : null;

  return (
    <div className={`absolute inset-0 ${className ?? ""}`} style={{ background: bg }}>
      <div
        ref={ref}
        className="absolute inset-0 overflow-y-auto overscroll-contain"
        style={{ paddingTop: hideNavBar ? 0 : "calc(var(--safe-top) + 54px)", paddingBottom: bottomInset }}
      >
        {!hideNavBar && showLarge && title && (
          <h1 className="px-4 pb-2 pt-1 text-large-title font-bold text-label">{title}</h1>
        )}
        {header && <div className="px-4 pb-2">{header}</div>}
        {children}
      </div>

      {!hideNavBar && (
        <>
          {/* Scroll edge effect: content blurs and fades as it slides under the bar. */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 z-10"
            style={{
              opacity: edgeOpacity,
              height: "calc(var(--safe-top) + 64px)",
              background: `linear-gradient(to bottom, ${bg} 0%, color-mix(in srgb, ${bg} 70%, transparent) 55%, transparent 100%)`,
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              maskImage: "linear-gradient(to bottom, black 55%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent)",
            }}
          />
          <div
            className="absolute inset-x-0 top-0 z-20 flex h-[54px] items-center justify-between gap-2 px-4"
            style={{ top: "var(--safe-top)", marginTop: -4 }}
          >
            <div className="flex min-w-[44px] items-center gap-2">{leading ?? backButton}</div>
            {title && (
              <motion.div
                style={{ opacity: inlineTitleOpacity }}
                className="pointer-events-none absolute left-1/2 max-w-[55%] -translate-x-1/2 truncate text-headline text-label"
              >
                {title}
              </motion.div>
            )}
            <div className="flex min-w-[44px] items-center justify-end gap-2">{trailing}</div>
          </div>
        </>
      )}

      {bottomBar && !asAccessory && (
        <div className="absolute inset-x-0 z-20 px-4" style={{ bottom: "max(8px, calc(var(--safe-bottom) - 8px))" }}>
          {bottomBar}
        </div>
      )}
    </div>
  );
}
