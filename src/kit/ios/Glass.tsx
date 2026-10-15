import { forwardRef, type HTMLAttributes } from "react";

export interface GlassProps extends HTMLAttributes<HTMLDivElement> {
  /** More opaque variant, for small text-heavy surfaces (menus, alerts). */
  strong?: boolean;
  /** Tint the glass, e.g. "rgba(0,122,255,.5)" or "var(--ios-tint)". */
  tint?: string;
}

/**
 * Liquid Glass material: translucent, blurred, saturated, with a specular rim.
 * The base for tab bars, toolbar buttons, sheets, menus and alerts.
 */
export const Glass = forwardRef<HTMLDivElement, GlassProps>(function Glass(
  { strong, tint, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      data-strong={strong || undefined}
      className={`ios-glass ${className ?? ""}`}
      style={tint ? ({ "--glass-tint": tint, ...style } as React.CSSProperties) : style}
      {...rest}
    />
  );
});
