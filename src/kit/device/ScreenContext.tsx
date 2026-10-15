import { createContext, useContext, useEffect } from "react";
import { useStack } from "../nav/Stack";
import { useTabBar } from "../nav/TabView";

export type StatusBarStyle = "auto" | "light" | "dark";

export interface ScreenContextValue {
  /** Element overlays (sheets, alerts, toasts) portal into. Sits above app content. */
  overlayRoot: HTMLElement | null;
  /** The .ios-screen element itself. */
  screen: HTMLElement | null;
  /** True when rendering inside the simulated device (we draw status bar etc.). */
  simulated: boolean;
  theme: "light" | "dark";
  statusBarStyle: StatusBarStyle;
  setStatusBarStyle: (style: StatusBarStyle) => void;
}

export const ScreenContext = createContext<ScreenContextValue>({
  overlayRoot: null,
  screen: null,
  simulated: false,
  theme: "light",
  statusBarStyle: "auto",
  setStatusBarStyle: () => {},
});

export const useScreen = () => useContext(ScreenContext);

/**
 * Set the status bar text colour while this screen is the one on display
 * (top of its stack, in the visible tab).
 * "light" = white text (for dark imagery), "dark" = black text, "auto" follows theme.
 */
export function useStatusBarStyle(style: StatusBarStyle) {
  const { setStatusBarStyle } = useScreen();
  const stack = useStack();
  const tabBar = useTabBar();
  const onScreen = (!stack || stack.index === stack.depth - 1) && (!tabBar || tabBar.visible);
  useEffect(() => {
    if (!onScreen) return;
    setStatusBarStyle(style);
    return () => setStatusBarStyle("auto");
  }, [style, onScreen, setStatusBarStyle]);
}
