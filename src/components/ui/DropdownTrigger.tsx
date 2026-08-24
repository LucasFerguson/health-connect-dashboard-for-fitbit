import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { notchStyle } from "./notch";

export interface DropdownTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Notch size in px. Defaults to 7px (context-bar dropdown buttons);
   * pass 8 for the range-selector strip look. */
  notchSize?: number;
  className?: string;
}

/**
 * The outlined dropdown-trigger button used in the context bar (e.g.
 * "DAY START 00:00 ▾", "COMPARE ▾"): 1px border, notch, small mono label.
 * Callers are responsible for the trailing caret glyph and any open menu —
 * this component only supplies the trigger's chrome.
 */
export function DropdownTrigger({
  children,
  notchSize = 7,
  className,
  style,
  disabled,
  ...rest
}: DropdownTriggerProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={clsx(
        "border-ink-500 text-ink-100 inline-flex h-6 items-center gap-1 border px-[10px] font-mono text-[9.5px] tracking-[.06em] transition-colors duration-[120ms] ease-out",
        !disabled && "hover:border-ink-400 hover:bg-ink-700 hover:text-ink-0",
        disabled && "cursor-not-allowed opacity-55",
        className,
      )}
      style={{ ...notchStyle(notchSize), ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
