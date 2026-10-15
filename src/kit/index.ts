// The iOS prototyping kit. Import everything from "@/kit".

export { DeviceFrame, DEVICE, useIsPhone, type DeviceMode } from "./device/DeviceFrame";
export { useScreen, useStatusBarStyle, type StatusBarStyle } from "./device/ScreenContext";

export { Glass, type GlassProps } from "./ios/Glass";
export {
  Button,
  GlassIconButton,
  Toggle,
  SegmentedControl,
  SearchField,
  Stepper,
  type ButtonProps,
} from "./ios/Controls";
export { List, Section, Cell, CellIcon, type CellProps, type SwipeAction } from "./ios/List";
export { Sheet, type SheetProps, type Detent } from "./ios/Sheet";
export { Alert, ActionSheet, Toast, type AlertAction } from "./ios/Overlays";
export { Portal } from "./ios/Portal";

export { Stack, useStack, pushSpring, type StackApi } from "./nav/Stack";
export { Page, type PageProps } from "./nav/Page";
export { TabView, useTabBar, type Tab } from "./nav/TabView";
