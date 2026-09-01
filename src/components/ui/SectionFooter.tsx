import type { ReactNode } from "react";
import { clsx } from "clsx";

export interface SectionFooterProps {
  /** Free-form footer content, e.g. "ZONE 3+ TODAY: 12 MIN". Mutually
   * exclusive with `items` — pass one or the other. */
  children?: ReactNode;
  /** Label/value pairs rendered as a justified row, e.g. the sleep-stage
   * breakdown ["DEEP", "1:32"], ["REM", "0:48"]. Mutually exclusive with
   * `children`. */
  items?: Array<[string, string]>;
  /** Panel-row footers (TIME IN ZONE, REST OF DAY) sit under a hairline
   * border-top with more top padding; pillar-card footers (SLEEP, RECOVERY,
   * STRAIN) don't have a border, just a small top margin. Defaults to
   * `false` (no border), matching the more common pillar-card case. */
  bordered?: boolean;
  className?: string;
}

/**
 * The small dim-mono footer row shared by panel-row cards and pillar cards.
 * Unifies the former locally-scoped `PanelFooter` (PanelRow.tsx — free-form
 * children, bordered) and `PillarFooter` (SleepPillarCard.tsx — a label/value
 * `items` array, unbordered, `justify-between`) behind one component; which
 * shape you get depends on whether you pass `children` or `items`.
 */
export function SectionFooter({
  children,
  items,
  bordered = false,
  className,
}: SectionFooterProps) {
  return (
    <div
      className={clsx(
        "text-ink-200 font-mono text-[8.5px]",
        bordered
          ? "border-ink-500 mt-2 border-t pt-[7px]"
          : "mt-1.5 flex justify-between",
        className,
      )}
    >
      {items
        ? items.map(([label, value]) => (
            <span key={label}>
              {label} {value}
            </span>
          ))
        : children}
    </div>
  );
}
