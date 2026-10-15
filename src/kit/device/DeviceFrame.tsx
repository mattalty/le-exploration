import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ScreenContext, type StatusBarStyle } from "./ScreenContext";
import { DynamicIsland, HomeIndicator, StatusBar } from "./StatusBar";

/** iPhone 17 Pro, in points. */
export const DEVICE = {
  name: "iPhone 17 Pro",
  width: 402,
  height: 874,
  screenRadius: 62,
  bezel: 13,
  safeTop: 62,
  safeBottom: 34,
} as const;

export type DeviceMode = "frame" | "bare" | "fullscreen";

interface Props {
  children: ReactNode;
  theme: "light" | "dark";
  /** frame = bezel + island; bare = screen only; fullscreen = fill the viewport (real phone) */
  mode: DeviceMode;
}

/** True on a phone-sized touch device, where prototypes should run full-screen. */
export function useIsPhone() {
  const query = "(max-width: 540px) and (pointer: coarse)";
  const [isPhone, setIsPhone] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setIsPhone(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isPhone;
}

function Screen({
  children,
  theme,
  simulated,
  className,
  style,
}: {
  children: ReactNode;
  theme: "light" | "dark";
  simulated: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [screen, setScreen] = useState<HTMLElement | null>(null);
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);
  const [statusBarStyle, setStatusBarStyleState] = useState<StatusBarStyle>("auto");
  const setStatusBarStyle = useCallback((s: StatusBarStyle) => setStatusBarStyleState(s), []);

  const ctx = useMemo(
    () => ({ overlayRoot, screen, simulated, theme, statusBarStyle, setStatusBarStyle }),
    [overlayRoot, screen, simulated, theme, statusBarStyle, setStatusBarStyle],
  );

  return (
    <ScreenContext.Provider value={ctx}>
      <div
        ref={setScreen}
        data-theme={theme}
        className={`ios-screen relative overflow-hidden bg-background ${className ?? ""}`}
        style={{ contain: "layout paint", ...style }}
      >
        <div className="absolute inset-0">{children}</div>
        <div ref={setOverlayRoot} className="pointer-events-none absolute inset-0 z-[1000]" />
        {simulated && (
          <>
            <StatusBar />
            <HomeIndicator />
          </>
        )}
      </div>
    </ScreenContext.Provider>
  );
}

/**
 * Renders a prototype inside an iPhone 17 Pro.
 * - frame: bezel, Dynamic Island, status bar, scaled to fit the available space
 * - bare: just the screen (rounded), same scaling
 * - fullscreen: fills the viewport and uses the phone's real safe areas
 */
export function DeviceFrame({ children, theme, mode }: Props) {
  if (mode === "fullscreen") {
    return (
      <Screen
        theme={theme}
        simulated={false}
        className="!fixed inset-0"
        style={
          {
            "--safe-top": "max(env(safe-area-inset-top, 0px), 8px)",
            "--safe-bottom": "env(safe-area-inset-bottom, 0px)",
          } as React.CSSProperties
        }
      >
        {children}
      </Screen>
    );
  }

  return <ScaledDevice theme={theme} withBezel={mode === "frame"}>{children}</ScaledDevice>;
}

function ScaledDevice({ children, theme, withBezel }: { children: ReactNode; theme: "light" | "dark"; withBezel: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const bezel = withBezel ? DEVICE.bezel : 0;
  const outerW = DEVICE.width + bezel * 2;
  const outerH = DEVICE.height + bezel * 2;

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const pad = 32;
      const s = Math.min(1, (el.clientWidth - pad) / outerW, (el.clientHeight - pad) / outerH);
      setScale(Math.max(0.3, s));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [outerW, outerH]);

  return (
    <div ref={wrapRef} className="flex h-full w-full items-center justify-center overflow-hidden">
      <div style={{ width: outerW * scale, height: outerH * scale }} className="relative shrink-0">
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: outerW,
            height: outerH,
            transform: `scale(${scale})`,
            borderRadius: DEVICE.screenRadius + bezel,
            padding: bezel,
            background: withBezel ? "#0b0b0c" : "transparent",
            boxShadow: withBezel
              ? "0 0 0 1.5px #3a3a3e, 0 0 0 3.5px #1d1d20, 0 30px 80px -20px rgba(0,0,0,.45), 0 10px 30px -10px rgba(0,0,0,.3)"
              : "0 30px 80px -20px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.06)",
          }}
        >
          <Screen
            theme={theme}
            simulated
            style={{ width: DEVICE.width, height: DEVICE.height, borderRadius: DEVICE.screenRadius }}
          >
            {children}
          </Screen>
          {withBezel && (
            <div className="pointer-events-none absolute" style={{ left: bezel, top: bezel, width: DEVICE.width }}>
              <DynamicIsland />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
