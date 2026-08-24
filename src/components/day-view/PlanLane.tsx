import { absenceReason } from "~/domain/dayViewPresentation";
import type { StringMetric } from "~/server/health/dayAnalyticsSchema";

/**
 * Plan lane (46px) — `timeline.schedule` has no schedule-block source
 * connected on the backend today (status is `not_implemented`), so this
 * renders the honest empty lane using the API's own note (requirement #4)
 * rather than a hand-authored explanation.
 */
export function PlanLane({ schedule }: { schedule: StringMetric }) {
  return (
    <div className="border-ink-500 bg-ink-850 relative mt-2 flex h-[46px] shrink-0 items-center justify-center border-l">
      <span className="text-ink-200 px-4 text-center font-mono text-[9px] tracking-[.04em]">
        {absenceReason(schedule.status, schedule.note)}
      </span>
    </div>
  );
}
