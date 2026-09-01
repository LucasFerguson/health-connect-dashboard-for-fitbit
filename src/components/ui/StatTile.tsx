import type { ReactNode } from "react";
import { clsx } from "clsx";
import { Card } from "./Card";
import { StatValue, type StatValueProps } from "./StatValue";

export interface StatTileProps extends StatValueProps {
  /** The tile's caption, e.g. "RESTING HR" or "VO2 MAX". Rendered above the
   * value in the same dim-mono caption style used across the day view. */
  label: ReactNode;
  /** Accent color for the top border, e.g. a per-metric hue. Omit for a
   * plain, uncolored tile. */
  accent?: string;
  className?: string;
}

/**
 * A standalone KPI tile: `Card` surface + a caption + `StatValue`. Distinct
 * from the pillar-card layout in SleepPillarCard.tsx (which also bundles a
 * SegmentedBar/Track and a SectionFooter breakdown) — this is the simpler
 * building block for pages that just need several independent stats sitting
 * side by side (e.g. a KPI row on the Overview or a metric-detail page),
 * without pillar-card-specific chrome.
 */
export function StatTile({
  label,
  accent,
  className,
  value,
  unit,
  delta,
  deltaTone,
  deltaClassName,
  context,
}: StatTileProps) {
  return (
    <Card topAccent={accent} className={clsx("flex flex-col gap-2", className)}>
      <span className="text-ink-200 font-mono text-[9px] tracking-[.08em]">
        {label}
      </span>
      <StatValue
        value={value}
        unit={unit}
        delta={delta}
        deltaTone={deltaTone}
        deltaClassName={deltaClassName}
        context={context}
      />
    </Card>
  );
}
