import { useScreen } from "./ScreenContext";

/** Simulated iOS status bar: 9:41, cellular, Wi-Fi, battery. Only drawn inside the device frame. */
export function StatusBar() {
  const { statusBarStyle, theme } = useScreen();
  const color =
    statusBarStyle === "light" ? "#fff" : statusBarStyle === "dark" ? "#000" : theme === "dark" ? "#fff" : "#000";

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[2000] flex h-[54px] items-center justify-between pl-[52px] pr-[38px] pt-[6px]"
      style={{ color }}
    >
      <span className="w-[54px] text-center text-[17px] font-semibold tracking-[-0.4px]">9:41</span>
      <div className="flex items-center gap-[7px]">
        <svg width="19" height="12" viewBox="0 0 19 12" fill="currentColor" aria-hidden>
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.9" />
          <rect x="5.2" y="5.2" width="3.2" height="6.8" rx="0.9" />
          <rect x="10.4" y="2.6" width="3.2" height="9.4" rx="0.9" />
          <rect x="15.6" y="0" width="3.2" height="12" rx="0.9" />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden>
          <path d="M8.5 2.3c2.4 0 4.6.9 6.3 2.5.1.1.3.1.4 0l1.2-1.2c.1-.1.1-.3 0-.4C14.3 1.2 11.5 0 8.5 0S2.7 1.2.6 3.2c-.1.1-.1.3 0 .4l1.2 1.2c.1.1.3.1.4 0C3.9 3.2 6.1 2.3 8.5 2.3Z" />
          <path d="M8.5 6.1c1.3 0 2.6.5 3.6 1.4.1.1.3.1.4 0l1.2-1.2c.1-.1.1-.3 0-.4-1.4-1.3-3.2-2-5.2-2s-3.8.7-5.2 2c-.1.1-.1.3 0 .4l1.2 1.2c.1.1.3.1.4 0 1-.9 2.3-1.4 3.6-1.4Z" />
          <path d="M10.9 9.5c.1-.1.1-.3 0-.4-.6-.6-1.5-.9-2.4-.9s-1.8.3-2.4.9c-.1.1-.1.3 0 .4l2.2 2.2c.1.1.3.1.4 0l2.2-2.2Z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none" aria-hidden>
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" stroke="currentColor" opacity="0.35" />
          <rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor" />
          <path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="currentColor" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

export function DynamicIsland() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[11px] z-[2001] h-[37px] w-[126px] -translate-x-1/2 rounded-full bg-black" />
  );
}

export function HomeIndicator() {
  const { theme } = useScreen();
  return (
    <div
      className="pointer-events-none absolute bottom-[8px] left-1/2 z-[2000] h-[5px] w-[139px] -translate-x-1/2 rounded-full"
      style={{ background: theme === "dark" ? "#fff" : "#000" }}
    />
  );
}
