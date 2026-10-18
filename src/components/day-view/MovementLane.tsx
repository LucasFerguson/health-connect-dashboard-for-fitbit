import type { StepsHour } from "~/domain/dayView";
import { formatSteps } from "~/features/health/metricFormatters";
import {
  formatClockMinutes,
  formatHourLabel,
  slotHourLabel,
} from "~/domain/dayViewTime";
import { stepsPerMinute, type StepSource } from "~/domain/stepDetail";

const MINUTES_PER_DAY = 24 * 60;
/** Narrowest a record is drawn, in minutes of the axis (~0.5px on a laptop),
 * so a sub-second phone record still shows up. */
const MIN_BAR_MINUTES = 0.75;

/**
 * Movement lane (22px). With `source` (the day's raw step records from one
 * app, see `~/domain/stepDetail`) every record is drawn at its own start and
 * end, as fine or coarse as the app wrote it; height is the record's steps
 * per minute against the day's fastest record, so a bar's area is its step
 * count. Without it, falls back to the backend's hourly bars.
 */
export function MovementLane({
  hours,
  source,
  dayStartHour,
}: {
  hours: StepsHour[];
  source: StepSource | null;
  dayStartHour: number;
}) {
  if (source) return <StepRecordsLane source={source} />;
  return <HourlyStepsLane hours={hours} dayStartHour={dayStartHour} />;
}

function StepRecordsLane({ source }: { source: StepSource }) {
  const rates = source.records.map(stepsPerMinute);
  const peak = Math.max(...rates, 0);
  const peakIndex = rates.indexOf(peak);
  const peakRecord = source.records[peakIndex];

  return (
    <div className="border-ink-500 bg-ink-850 relative mt-1 h-[22px] shrink-0 border-l">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${MINUTES_PER_DAY} 100`}
        preserveAspectRatio="none"
        aria-hidden
      >
        {source.records.map((span, index) => {
          const start = Math.max(0, span.startMinute);
          const end = Math.min(MINUTES_PER_DAY, span.endMinute);
          const width = Math.max(end - start, MIN_BAR_MINUTES);
          const fraction = peak > 0 ? rates[index]! / peak : 0;
          const height = span.count > 0 ? Math.max(fraction * 100, 4) : 0;
          return (
            <rect
              key={span.id}
              x={start}
              width={width}
              y={100 - height}
              height={height}
              fill="var(--color-brand-400)"
              // Overlapping records (an app writing the same minute twice)
              // both stay visible through each other.
              fillOpacity={0.45 + fraction * 0.45}
            />
          );
        })}
      </svg>
      <div className="text-ink-50 bg-ink-900/85 pointer-events-none absolute top-[3px] right-1.5 z-[6] px-1 font-mono text-[7.5px] tracking-[.06em] max-sm:top-px max-sm:text-[11px] max-sm:leading-[16px]">
        {peakRecord && peak > 0
          ? `STEPS/MIN · PEAK ${Math.round(peak)} AT ${formatClockMinutes(
              Math.max(0, Math.floor(peakRecord.startMinute)),
            )}`
          : "STEPS · NONE RECORDED"}
      </div>
    </div>
  );
}

/**
 * Hourly step bars straight from `timeline.steps`
 * (requirement #6: no local bucketing). Bar height is a fraction of the
 * day's peak steps/hour; opacity is a second magnitude cue. An hour with
 * `status !== "available"` renders as a flattened tick rather than a
 * fabricated zero-height bar, distinguishing "no data for this hour" from
 * "zero steps recorded".
 */
function HourlyStepsLane({
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
      <div className="text-ink-50 bg-ink-900/85 pointer-events-none absolute top-[3px] right-1.5 z-[6] px-1 font-mono text-[7.5px] tracking-[.06em] max-sm:top-px max-sm:text-[11px] max-sm:leading-[16px]">
        {hasAnyData && peakHourEntry
          ? `STEPS/H · PEAK ${formatSteps(peak)} AT ${formatHourLabel(
              peakHourEntry.hour,
            )}`
          : "STEPS/H · NO DATA"}
      </div>
    </div>
  );
}
