import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { useScreen } from "../device/ScreenContext";

/** Render children into the device screen's overlay layer (above app content, below the status bar). */
export function Portal({ children }: { children: ReactNode }) {
  const { overlayRoot } = useScreen();
  if (!overlayRoot) return null;
  return createPortal(children, overlayRoot);
}
