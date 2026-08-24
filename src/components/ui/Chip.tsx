import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { notchStyle } from "./notch";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  /** Background color. Defaults to the brand purple used by the TODAY
   * chip; pass a zone/hue color for zone-label chips. */
  background?: string;
  /** Text color. Defaults to primary text (white). */
  color?: string;
  /** Notch size in px. Defaults to 6px (TODAY chip, logo mark). */
  notchSize?: number;
  className?: string;
}

/**
 * A small pill/tag with the notch motif: background, text, and clip-path
 * as props. Used for the TODAY chip, zone labels, and similar small tags.
 */
export function Chip({
  children,
  background = "var(--color-brand-500)",
  color = "var(--color-ink-0)",
  notchSize = 6,
  className,
  style,
  ...rest
}: ChipProps) {
  return (
    <span
      className={clsx(
        "inline-flex h-6 items-center px-[9px] font-mono text-[9px] font-medium tracking-[.1em]",
        className,
      )}
      style={{
        backgroundColor: background,
        color,
        ...notchStyle(notchSize),
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
