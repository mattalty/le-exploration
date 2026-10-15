import { motion } from "motion/react";
import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Minus, Plus, Search, X } from "lucide-react";
import { Glass } from "./Glass";

const spring = { type: "spring", stiffness: 500, damping: 38 } as const;

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "filled" | "tinted" | "gray" | "glass" | "plain";
type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Destructive styling (red). */
  destructive?: boolean;
  icon?: ReactNode;
  full?: boolean;
}

const sizeClass: Record<ButtonSize, string> = {
  small: "h-[28px] px-3 text-subhead gap-1",
  medium: "h-[36px] px-4 text-subhead font-semibold gap-1.5",
  large: "h-[50px] px-5 text-headline gap-2",
};

/** iOS 26 capsule button. Filled, tinted, gray, glass or plain. */
export function Button({
  variant = "filled",
  size = "large",
  destructive,
  icon,
  full,
  className,
  children,
  style,
  ...rest
}: ButtonProps) {
  const color = destructive ? "var(--ios-red)" : "var(--ios-tint)";
  const variantStyle: React.CSSProperties =
    variant === "filled"
      ? { background: color, color: "#fff" }
      : variant === "tinted"
        ? { background: `color-mix(in srgb, ${color} 15%, transparent)`, color }
        : variant === "gray"
          ? { background: "var(--ios-fill-tertiary)", color }
          : { color };

  const content = (
    <>
      {icon}
      {children}
    </>
  );
  const classes = `inline-flex items-center justify-center rounded-full font-medium transition-[filter,opacity] active:opacity-70 disabled:opacity-40 ${sizeClass[size]} ${full ? "w-full" : ""} ${className ?? ""}`;

  if (variant === "glass") {
    return (
      <motion.button whileTap={{ scale: 1.06 }} transition={spring} className={`${classes} ios-glass`} style={{ ...variantStyle, ...style }} {...(rest as object)}>
        {content}
      </motion.button>
    );
  }
  return (
    <button className={classes} style={{ ...variantStyle, ...style }} {...rest}>
      {content}
    </button>
  );
}

/** Circular glass button, as used in iOS 26 nav bars and toolbars. */
export function GlassIconButton({
  children,
  className,
  size = 44,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: number }) {
  return (
    <motion.button
      whileTap={{ scale: 1.12 }}
      transition={spring}
      className={`ios-glass inline-flex shrink-0 items-center justify-center rounded-full text-label ${className ?? ""}`}
      style={{ width: size, height: size }}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ Toggle */

export interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Track colour when on. Defaults to system green. */
  color?: string;
}

/** iOS 26 switch: wider track, pill knob that stretches while pressed. */
export function Toggle({ checked, defaultChecked, onChange, disabled, color = "var(--ios-green)" }: ToggleProps) {
  const [inner, setInner] = useState(defaultChecked ?? false);
  const on = checked ?? inner;
  const [pressed, setPressed] = useState(false);
  const toggle = () => {
    if (disabled) return;
    setInner(!on);
    onChange?.(!on);
  };
  return (
    <button
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={toggle}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="relative h-[28px] w-[64px] shrink-0 rounded-full p-[2px] transition-colors duration-200 disabled:opacity-40"
      style={{ background: on ? color : "var(--ios-fill)" }}
    >
      <motion.span
        className="block h-[24px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,.15),0_0_0_0.5px_rgba(0,0,0,.04)]"
        initial={false}
        animate={{ x: on ? (pressed ? 18 : 24) : 0, width: pressed ? 42 : 36 }}
        transition={spring}
      />
    </button>
  );
}

/* ------------------------------------------------------- SegmentedControl */

export interface SegmentedControlProps<T extends string> {
  options: readonly T[] | { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Capsule segmented control with a sliding thumb. */
export function SegmentedControl<T extends string>({ options, value, onChange, className }: SegmentedControlProps<T>) {
  const id = useId();
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className={`relative flex h-[36px] rounded-full bg-fill-tertiary p-[2px] ${className ?? ""}`}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={`relative flex-1 rounded-full text-subhead ${selected ? "font-semibold" : "font-medium"} text-label`}
          >
            {selected && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={spring}
                className="absolute inset-0 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,.12)] [[data-theme=dark]_&]:bg-[#636366]"
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- SearchField */

export interface SearchFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Glass capsule (bottom search, iOS 26) vs filled (inline in content). */
  glass?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function SearchField({ value, onChange, placeholder = "Search", glass, autoFocus, className }: SearchFieldProps) {
  const [inner, setInner] = useState("");
  const v = value ?? inner;
  const set = (s: string) => {
    setInner(s);
    onChange?.(s);
  };
  const field = (
    <>
      <Search size={17} strokeWidth={2.4} className="shrink-0 text-label-secondary" />
      <input
        value={v}
        autoFocus={autoFocus}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-body text-label outline-none placeholder:text-label-secondary"
      />
      {v && (
        <button onClick={() => set("")} className="flex size-[17px] items-center justify-center rounded-full bg-label-tertiary text-background">
          <X size={11} strokeWidth={3.5} />
        </button>
      )}
    </>
  );
  if (glass) {
    return <Glass className={`flex h-[48px] items-center gap-2 rounded-full px-4 ${className ?? ""}`}>{field}</Glass>;
  }
  return <div className={`flex h-[36px] items-center gap-1.5 rounded-full bg-fill-tertiary px-3 ${className ?? ""}`}>{field}</div>;
}

/* ----------------------------------------------------------------- Stepper */

export function Stepper({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex h-[32px] items-center rounded-full bg-fill-tertiary text-label">
      <button disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} className="flex h-full w-[46px] items-center justify-center disabled:opacity-30">
        <Minus size={18} strokeWidth={2.5} />
      </button>
      <span className="h-[18px] w-px bg-separator" />
      <button disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} className="flex h-full w-[46px] items-center justify-center disabled:opacity-30">
        <Plus size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
