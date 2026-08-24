import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { notchStyle } from "./notch";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Notch size in px applied to the bottom-right corner. Defaults to the
   * 15px used by pillar/panel cards; pass 16 for the timeline card, etc. */
  notchSize?: number;
  /** Hex/CSS color for a 2px accent border across the top edge, e.g. the
   * pillar hue on SLEEP/RECOVERY/STRAIN cards. Omit for no top accent. */
  topAccent?: string;
  /** Padding utility classes. Defaults to the standard card padding
   * (13px vertical, 17px horizontal, per the pillar/panel card spec). */
  padding?: string;
}

/**
 * The base panel surface shared by pillar cards, panel-row cards, and the
 * timeline card: dark surface, hairline border, notched bottom-right
 * corner, and an optional hue-coded top accent border.
 */
export function Card({
  children,
  notchSize = 15,
  topAccent,
  padding = "px-[17px] py-[13px]",
  className,
  style,
  ...rest
}: CardProps) {
  const mergedStyle: CSSProperties = {
    ...notchStyle(notchSize),
    ...(topAccent ? { borderTopColor: topAccent } : undefined),
    ...style,
  };

  return (
    <div
      className={clsx(
        "border-ink-500 bg-ink-800 border",
        topAccent && "border-t-2",
        padding,
        className,
      )}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </div>
  );
}
