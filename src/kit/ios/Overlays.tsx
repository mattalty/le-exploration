import { AnimatePresence, motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { Glass } from "./Glass";
import { Portal } from "./Portal";

export interface AlertAction {
  label: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

const pop = { type: "spring", stiffness: 520, damping: 34 } as const;

function Dim({ onClick }: { onClick?: () => void }) {
  return (
    <motion.div
      className="pointer-events-auto absolute inset-0 bg-[var(--ios-dim)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
    />
  );
}

/* ------------------------------------------------------------------- Alert */

export interface AlertProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  message?: ReactNode;
  /** Two actions sit side by side, three or more stack vertically. */
  actions?: AlertAction[];
}

/** iOS 26 alert: glass card with capsule buttons. */
export function Alert({ open, onClose, title, message, actions = [{ label: "OK" }] }: AlertProps) {
  const stacked = actions.length > 2;
  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div key="alert" className="absolute inset-0 flex items-center justify-center" exit={{ opacity: 0 }}>
            <Dim />
            <motion.div
              className="pointer-events-auto relative w-[300px]"
              initial={{ scale: 1.15, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.15 } }}
              transition={pop}
            >
              <Glass strong className="rounded-[var(--ios-radius-alert)] p-[14px] pt-[22px]">
                <div className="px-2 text-center">
                  <div className="text-headline text-label">{title}</div>
                  {message && <div className="mt-1 text-subhead text-label">{message}</div>}
                </div>
                <div className={`mt-5 flex gap-2 ${stacked ? "flex-col" : ""}`}>
                  {actions.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => {
                        a.onPress?.();
                        onClose();
                      }}
                      className={`h-[48px] flex-1 rounded-full text-headline active:opacity-70 ${
                        a.style === "cancel" ? "bg-fill-secondary text-label" : a.style === "destructive" ? "bg-fill-secondary text-ios-red" : "bg-tint text-white"
                      }`}
                      style={{ fontWeight: a.style === "cancel" ? 500 : 600 }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </Glass>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/* ------------------------------------------------------------- ActionSheet */

export interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  message?: ReactNode;
  actions: (AlertAction & { icon?: ReactNode })[];
}

/** Bottom glass menu of actions. A "cancel" action is shown separately below. */
export function ActionSheet({ open, onClose, title, message, actions }: ActionSheetProps) {
  const cancel = actions.find((a) => a.style === "cancel");
  const rest = actions.filter((a) => a.style !== "cancel");
  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div key="as" className="absolute inset-0" exit={{ opacity: 0, transition: { delay: 0.1 } }}>
            <Dim onClick={onClose} />
            <motion.div
              className="pointer-events-auto absolute inset-x-[8px] flex flex-col gap-2"
              style={{ bottom: "max(8px, calc(var(--safe-bottom) - 8px))" }}
              initial={{ y: 400 }}
              animate={{ y: 0 }}
              exit={{ y: 400 }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
            >
              <Glass strong className="overflow-hidden rounded-[var(--ios-radius-sheet)] py-2">
                {(title || message) && (
                  <div className="px-6 pb-2 pt-2 text-center">
                    {title && <div className="text-footnote font-semibold text-label-secondary">{title}</div>}
                    {message && <div className="text-footnote text-label-secondary">{message}</div>}
                  </div>
                )}
                {rest.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => {
                      a.onPress?.();
                      onClose();
                    }}
                    className={`flex h-[52px] w-full items-center gap-3 px-6 text-body active:bg-fill-tertiary ${a.style === "destructive" ? "text-ios-red" : "text-label"}`}
                  >
                    {a.icon && <span className="flex w-6 justify-center">{a.icon}</span>}
                    {a.label}
                  </button>
                ))}
              </Glass>
              {cancel && (
                <button
                  onClick={() => {
                    cancel.onPress?.();
                    onClose();
                  }}
                  className="ios-glass h-[56px] rounded-full text-headline text-label"
                  data-strong
                >
                  {cancel.label}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/* ------------------------------------------------------------------- Toast */

export interface ToastProps {
  open: boolean;
  onClose: () => void;
  icon?: ReactNode;
  message: ReactNode;
  /** Auto-dismiss after ms. 0 to keep open. Default 2500. */
  duration?: number;
}

/** Glass pill that drops from under the Dynamic Island. */
export function Toast({ open, onClose, icon, message, duration = 2500 }: ToastProps) {
  useEffect(() => {
    if (!open || !duration) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            key="toast"
            className="pointer-events-auto absolute inset-x-0 flex justify-center"
            style={{ top: "calc(var(--safe-top) - 6px)" }}
            initial={{ y: -80, scale: 0.6, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -60, scale: 0.7, opacity: 0 }}
            transition={pop}
            onClick={onClose}
          >
            <Glass strong className="flex h-[48px] items-center gap-2.5 rounded-full px-5 text-subhead font-semibold text-label">
              {icon}
              {message}
            </Glass>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
