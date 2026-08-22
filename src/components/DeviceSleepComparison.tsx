"use client";

import { useHealthData } from "~/features/health/HealthDataProvider";
import { selectDeviceSleepSummaries } from "~/features/health/selectors";
import { healthSourceLabel } from "~/features/health/sourceLabels";

export function DeviceSleepComparison() {
  const { snapshot } = useHealthData();
  const summaries = selectDeviceSleepSummaries(snapshot);

  return (
    <section aria-labelledby="device-comparison-heading">
      <div className="mb-3">
        <h2 id="device-comparison-heading" className="text-2xl font-bold">
          Device sleep comparison
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-white/60">
          Average sleep reported by each source. Paired differences compare
          devices only when they recorded the same sleep event.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaries.map((summary) => (
          <article
            key={summary.source}
            className="rounded-xl border border-white/10 bg-white/10 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">
                  {healthSourceLabel(summary.source)}
                </h3>
                <p className="text-xs text-white/50">
                  {summary.recordingCount} sleep recordings
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
                {formatDuration(summary.averageSleepMinutes)} avg
              </span>
            </div>
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-sm text-white/60">On matching sleep events</p>
              <p className="mt-1 text-xl font-bold">
                {formatDifference(summary.averageDifferenceMinutes)}
              </p>
              <p className="mt-1 text-xs text-white/45">
                Across {summary.comparisonCount} paired comparisons
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  return `${Math.floor(rounded / 60)}h ${rounded % 60}m`;
}

function formatDifference(minutes: number | null): string {
  if (minutes === null) return "No paired data";
  const rounded = Math.round(minutes);
  if (rounded === 0) return "Same as other devices";
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded)} min vs others`;
}
