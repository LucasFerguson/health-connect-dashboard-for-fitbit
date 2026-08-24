import { clsx } from "clsx";

export interface BarSegment {
  /** Flex-grow ratio for this segment relative to its siblings, e.g. the
   * 2.2 / 1.5 / 3.1 / .6 stage-duration ratios on the sleep pillar card. */
  flex: number;
  color: string;
  /** Optional accessible label for the segment (not rendered visibly). */
  label?: string;
}

export interface SegmentedBarProps {
  segments: BarSegment[];
  /** Bar height. Defaults to 7px, the pillar-card bar height. */
  heightPx?: number;
  /** Gap between segments. Defaults to 2px per the spec. */
  gapPx?: number;
  className?: string;
}

/**
 * A multi-segment flex bar where each segment's width is proportional to a
 * flex ratio — used for the sleep-stage footer bar (deep/light/REM/awake)
 * and any other proportional-duration strip.
 */
export function SegmentedBar({
  segments,
  heightPx = 7,
  gapPx = 2,
  className,
}: SegmentedBarProps) {
  return (
    <div
      className={clsx("flex w-full", className)}
      style={{ height: heightPx, gap: gapPx }}
    >
      {segments.map((segment, index) => (
        <div
          key={index}
          aria-label={segment.label}
          style={{ flex: segment.flex, backgroundColor: segment.color }}
        />
      ))}
    </div>
  );
}
