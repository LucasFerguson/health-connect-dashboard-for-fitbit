import type { HourlySteps } from "~/domain/dayViewData";
import { formatSteps } from "~/features/health/metricFormatters";
import { hourLabelForSlot } from "~/domain/dayViewTime";

/**
 * Movement lane (22px) — real hourly step bars, bucketed from raw steps
 * interval observations. Bar height is a fraction of the day's peak
 * steps/hour; opacity is a second magnitude cue exactly per spec. There's
 * no workout-type data in this app, so the "workout hour" accent color
 * from the spec is not applied — every bar uses the movement hue.
 */
export function MovementLane({
  buckets,
  dayStartHour,
}: {
  buckets: HourlySteps[];
  dayStartHour: number;
}) {
  const hasAnyData = buckets.some((bucket) => bucket.steps > 0);
  const peak = Math.max(...buckets.map((bucket) => bucket.steps), 0);
  const peakHour = buckets.find((bucket) => bucket.steps === peak);

  return (
    <div className="border-ink-500 bg-ink-850 relative mt-1 flex h-[22px] shrink-0 items-end gap-0.5 border-l">
      {buckets.map((bucket, index) => {
        if (bucket.isFuture) {
          return <div key={index} className="bg-ink-500 h-px flex-1" />;
        }
        const heightPercent = peak > 0 ? (bucket.steps / peak) * 100 : 0;
        const opacity = peak > 0 ? 0.35 + (bucket.steps / peak) * 0.65 : 0.35;
        return (
          <div
            key={index}
            className="bg-brand-400 flex-1"
            style={{
              height: `${Math.max(heightPercent, bucket.steps > 0 ? 2 : 0)}%`,
              opacity,
            }}
            title={`${hourLabelForSlot(index, dayStartHour).toString().padStart(2, "0")}:00 · ${formatSteps(bucket.steps)} steps`}
          />
        );
      })}
      <div className="text-ink-200 pointer-events-none absolute top-[3px] right-1.5 z-[6] font-mono text-[7.5px] tracking-[.06em]">
        {hasAnyData && peakHour
          ? `STEPS/H · PEAK ${formatSteps(peak)} AT ${hourLabelForSlot(
              buckets.indexOf(peakHour),
              dayStartHour,
            )
              .toString()
              .padStart(2, "0")}:00`
          : "STEPS/H · NO DATA"}
      </div>
    </div>
  );
}
