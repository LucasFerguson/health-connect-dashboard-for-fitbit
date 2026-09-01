import type { ReactNode } from "react";
import { clsx } from "clsx";

export interface SectionHeaderProps {
  /** Left-aligned title/label text. */
  title: ReactNode;
  /** Right-aligned meta/qualifier text. */
  right: ReactNode;
  /** Tints the title text — used by pillar-card headers (SLEEP, RECOVERY,
   * STRAIN) to carry the metric's hue. Omit for the default primary-text
   * panel-row headers. */
  titleColor?: string;
  /** Tints the right-hand text — e.g. the brand purple used by the REST OF
   * DAY panel's "PLANNED" qualifier. Omit for the default dim tone. */
  rightColor?: string;
  /** Panel-row headers ("sm", 15px, baseline row with the right text pinned
   * via `ml-auto`, 8.5px meta) vs pillar-card headers ("md", 16px, a true
   * `justify-between` row, 9px meta). Defaults to "sm". */
  size?: "sm" | "md";
  className?: string;
}

const titleSizeClasses: Record<"sm" | "md", string> = {
  sm: "text-[15px]",
  md: "text-[16px]",
};

/**
 * The title-left/meta-right header row shared by panel-row cards (TIME IN
 * ZONE, REST OF DAY) and pillar cards (SLEEP, RECOVERY, STRAIN). Unifies the
 * former locally-scoped `PanelHeader` (PanelRow.tsx) and `PillarHeader`
 * (SleepPillarCard.tsx) — same title/meta shape, different size and layout
 * strategy, so both are expressed here as the `size` variant rather than as
 * two components.
 */
export function SectionHeader({
  title,
  right,
  titleColor,
  rightColor,
  size = "sm",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={clsx(
        "flex items-baseline",
        size === "sm" ? "mb-[9px] gap-2.5" : "justify-between",
        className,
      )}
    >
      <span
        className={clsx(
          "font-display tracking-[.12em]",
          titleSizeClasses[size],
        )}
        style={titleColor ? { color: titleColor } : undefined}
      >
        {title}
      </span>
      <span
        className={clsx(
          "font-mono",
          size === "sm"
            ? "text-ink-200 ml-auto text-[8.5px]"
            : "text-ink-200 text-[9px] tracking-[.08em]",
        )}
        style={rightColor ? { color: rightColor } : undefined}
      >
        {right}
      </span>
    </div>
  );
}
