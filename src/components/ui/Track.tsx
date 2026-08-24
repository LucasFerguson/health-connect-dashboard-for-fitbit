import { clsx } from "clsx";

export interface TrackMarker {
  /** Position along the track, 0-100. */
  atPercent: number;
  /** Marker color. Defaults to the primary-text white used for baseline
   * markers ("your recent baseline") across the app. */
  color?: string;
}

export interface TrackProps {
  /** Fill percentage, 0-100. */
  fillPercent: number;
  /** Fill color (CSS color value, e.g. a token like "var(--color-recovery)"
   * or a plain hex string). */
  fillColor: string;
  /** Track (unfilled background) color. Defaults to the standard well
   * tone used behind pillar-card and zone-row bars. */
  trackColor?: string;
  /** Track height. Defaults to 10px (the zone-row track height); pass 7 for
   * the pillar-card bar height. */
  heightPx?: number;
  /** An overhanging baseline marker — a thin vertical line that pokes
   * 3px above and below the track, denoting a recent-baseline reference
   * point (e.g. the 14-day average recovery score). */
  marker?: TrackMarker;
  className?: string;
}

/**
 * The flexible horizontal bar-fill used for recovery/strain progress bars
 * and time-in-zone rows: a track background, a colored fill percentage,
 * and an optional overhanging baseline marker.
 */
export function Track({
  fillPercent,
  fillColor,
  trackColor = "var(--color-ink-500)",
  heightPx = 10,
  marker,
  className,
}: TrackProps) {
  const clampedFill = Math.min(100, Math.max(0, fillPercent));

  return (
    <div
      className={clsx("relative w-full", className)}
      style={{ height: heightPx, backgroundColor: trackColor }}
    >
      <div
        className="h-full"
        style={{ width: `${clampedFill}%`, backgroundColor: fillColor }}
      />
      {marker ? (
        <div
          className="absolute top-[-3px] bottom-[-3px] w-[2px]"
          style={{
            left: `${Math.min(100, Math.max(0, marker.atPercent))}%`,
            backgroundColor: marker.color ?? "var(--color-ink-0)",
          }}
        />
      ) : null}
    </div>
  );
}
