import type { StepsHour } from "~/domain/dayView";
import { formatSteps } from "~/features/health/metricFormatters";
import { formatHourLabel, slotHourLabel } from "~/domain/dayViewTime";

/**
 * Movement lane (22px) — hourly step bars straight from `timeline.steps`
 * (requirement #6: no local bucketing). Bar height is a fraction of the
 * day's peak steps/hour; opacity is a second magnitude cue. An hour with
 * `status !== "available"` renders as a flattened tick rather than a
 * fabricated zero-height bar, distinguishing "no data for this hour" from
 * "zero steps recorded".
 */
export function MovementLane({
  hours,
  dayStartHour,
}: {
  hours: StepsHour[];
  dayStartHour: number;
}) {
  const byHour = new Map(hours.map((h) => [h.hour, h]));
  const buckets = Array.from({ length: 24 }, (_, hour) => byHour.get(hour));

  const availableCounts = hours
    .filter((h) => h.status === "available")
    .map((h) => h.count);
  const hasAnyData = availableCounts.some((count) => count > 0);
  const peak = Math.max(...availableCounts, 0);
  const peakHourEntry = hours.find(
    (h) => h.status === "available" && h.count === peak,
  );

  return (
    <div className="border-ink-500 bg-ink-850 relative mt-1 flex h-[22px] shrink-0 items-end gap-0.5 border-l">
      {buckets.map((bucket, index) => {
        if (!bucket || bucket.status !== "available") {
          return <div key={index} className="bg-ink-500 h-px flex-1" />;
        }
        const heightPercent = peak > 0 ? (bucket.count / peak) * 100 : 0;
        const opacity = peak > 0 ? 0.35 + (bucket.count / peak) * 0.65 : 0.35;
        return (
          <div
            key={index}
            className="bg-brand-400 flex-1"
            style={{
              height: `${Math.max(heightPercent, bucket.count > 0 ? 2 : 0)}%`,
              opacity,
            }}
            title={`${slotHourLabel(index, dayStartHour)} · ${formatSteps(bucket.count)} steps`}
          />
        );
      })}
      <div className="text-ink-200 pointer-events-none absolute top-[3px] right-1.5 z-[6] font-mono text-[7.5px] tracking-[.06em]">
        {hasAnyData && peakHourEntry
          ? `STEPS/H · PEAK ${formatSteps(peak)} AT ${formatHourLabel(
              peakHourEntry.hour,
            )}`
          : "STEPS/H · NO DATA"}
      </div>
    </div>
  );
}
