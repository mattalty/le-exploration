import { animate, motion, useMotionValue } from "motion/react";
import { type ComponentType, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

/** Inset-grouped list container. */
export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-[28px] py-2 ${className ?? ""}`}>{children}</div>;
}

export interface SectionProps {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function Section({ header, footer, children }: SectionProps) {
  return (
    <section className="px-4">
      {header && <div className="px-4 pb-[7px] text-footnote font-medium text-label-secondary">{header}</div>}
      {/* Each Cell draws its own inset separator; hide it on the last row. */}
      <div className="overflow-hidden rounded-[var(--ios-radius-cell)] bg-grouped-bg-secondary [&>*:last-child_.cell-separator]:hidden">
        {children}
      </div>
      {footer && <div className="px-4 pt-[7px] text-footnote text-label-secondary">{footer}</div>}
    </section>
  );
}

/** The rounded-square coloured icon used in Settings-style rows. */
export function CellIcon({ icon: Icon, color }: { icon: ComponentType<{ size?: number; strokeWidth?: number }>; color: string }) {
  return (
    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] text-white" style={{ background: color }}>
      <Icon size={18} strokeWidth={2.2} />
    </span>
  );
}

export interface SwipeAction {
  label: string;
  color: string;
  icon?: ReactNode;
  onClick: () => void;
}

export interface CellProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Trailing value text, e.g. "On" or "English". */
  detail?: ReactNode;
  /** Leading element, often <CellIcon>. */
  leading?: ReactNode;
  /** "chevron", a custom node (Toggle, checkmark), or nothing. */
  accessory?: "chevron" | ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  /** Trailing swipe-left actions. */
  swipeActions?: SwipeAction[];
}

export function Cell({ title, subtitle, detail, leading, accessory, onClick, destructive, swipeActions }: CellProps) {
  const x = useMotionValue(0);
  const actionsWidth = (swipeActions?.length ?? 0) * 76;
  const indent = leading ? 58 : 16;

  const row = (
    <div
      onClick={onClick}
      className={`flex min-h-[52px] items-center gap-3 bg-grouped-bg-secondary px-4 py-[11px] ${onClick ? "cursor-pointer active:bg-fill-tertiary" : ""}`}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <div className={`truncate text-body ${destructive ? "text-ios-red" : onClick && !accessory && !detail ? "text-tint" : "text-label"}`}>{title}</div>
        {subtitle && <div className="truncate text-subhead text-label-secondary">{subtitle}</div>}
      </div>
      {detail && <div className="shrink-0 text-body text-label-secondary">{detail}</div>}
      {accessory === "chevron" ? (
        <ChevronRight size={18} strokeWidth={2.6} className="-mr-1 shrink-0 text-label-tertiary" />
      ) : (
        accessory
      )}
    </div>
  );

  return (
    <div className="relative">
      {swipeActions?.length ? (
        <>
          <div className="absolute inset-y-0 right-0 flex" style={{ width: actionsWidth }}>
            {swipeActions.map((a) => (
              <button
                key={a.label}
                onClick={() => {
                  animate(x, 0);
                  a.onClick();
                }}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 text-subhead font-medium text-white"
                style={{ background: a.color }}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
          </div>
          <motion.div
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: -actionsWidth, right: 0 }}
            dragElastic={0.08}
            style={{ x }}
            onDragEnd={(_, info) => {
              const open = x.get() < -actionsWidth / 2 || info.velocity.x < -400;
              animate(x, open ? -actionsWidth : 0, { type: "spring", stiffness: 500, damping: 40 });
            }}
            className="relative"
          >
            {row}
          </motion.div>
        </>
      ) : (
        row
      )}
      <div className="cell-separator pointer-events-none absolute bottom-0 right-0 h-[0.5px] bg-separator" style={{ left: indent }} />
    </div>
  );
}
