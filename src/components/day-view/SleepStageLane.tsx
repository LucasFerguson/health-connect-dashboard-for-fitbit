import type { SleepStageSegment } from "~/server/health/dayAnalyticsSchema";
import {
  axisStartMs,
  minutesToPercentWidth,
  timeToPercent,
} from "~/domain/dayViewTime";
import { SLEEP_STAGE_GEOMETRY } from "./timelineConstants";

const LEGEND_ORDER: Array<keyof typeof SLEEP_STAGE_GEOMETRY> = [
  "deep",
  "light",
  "rem",
  "awake",
];
const LEGEND_LABEL: Record<keyof typeof SLEEP_STAGE_GEOMETRY, string> = {
  deep: "DEEP",
  light: "LIGHT",
  rem: "REM",
  awake: "AWAKE",
};

const RENDERED_STAGE_KINDS = new Set(["awake", "rem", "light", "deep"]);

/**
 * Sleep-stage lane (30px) — a step chart of stage segments straight from
 * `timeline.sleepStages`, positioned by real start/end timestamps using
 * the shared time-axis math (per requirement #6: the API already shapes
 * the segments, the lane only needs to place them on the axis). Segments
 * from a session other than the primary one for this date (i.e. a nap)
 * would need session-comparison metadata this contract doesn't carry, so
 * every returned segment renders at full opacity — the API is the source
 * of truth for which segments belong to this date.
 */
export function SleepStageLane({
  segments,
  date,
  dayStartHour,
  timeZone,
}: {
  segments: SleepStageSegment[];
  date: string;
  dayStartHour: number;
  timeZone: string;
}) {
  const start = axisStartMs(date, dayStartHour, timeZone);
  const end = start + 24 * 60 * 60 * 1000;

  const positioned = segments
    .filter((segment) => RENDERED_STAGE_KINDS.has(segment.kind))
    .flatMap((segment) => {
      const segStart = Date.parse(segment.startAt);
      const segEnd = Date.parse(segment.endAt);
      if (segEnd <= start || segStart >= end) return [];
      const clippedStartIso = new Date(Math.max(segStart, start)).toISOString();
      const clippedEndMs = Math.min(segEnd, end);
      const leftPercent = timeToPercent(
        clippedStartIso,
        date,
        dayStartHour,
        timeZone,
      );
      const widthPercent = minutesToPercentWidth(
        (clippedEndMs - Math.max(segStart, start)) / 60_000,
      );
      if (widthPercent <= 0) return [];
      return [{ ...segment, leftPercent, widthPercent }];
    })
    .sort((a, b) => a.leftPercent - b.leftPercent);

  return (
    <div className="border-ink-500 bg-ink-850 relative h-[30px] shrink-0 border-l">
      {positioned.map((segment, index) => {
        const geometry =
          SLEEP_STAGE_GEOMETRY[
            segment.kind as keyof typeof SLEEP_STAGE_GEOMETRY
          ];
        return (
          <div
            key={`${segment.sessionId}-${index}`}
            className="absolute"
            style={{
              left: `${segment.leftPercent}%`,
              width: `${segment.widthPercent}%`,
              top: geometry.topPx,
              height: geometry.heightPx,
              backgroundColor: geometry.color,
            }}
          />
        );
      })}
      {positioned.length === 0 ? (
        <div className="text-ink-200 absolute inset-0 flex items-center justify-center font-mono text-[9px] tracking-[.04em]">
          No sleep recorded for this day
        </div>
      ) : null}
      <div className="pointer-events-none absolute top-[11px] right-1.5 z-[6] flex gap-[9px] font-mono text-[7.5px] tracking-[.06em]">
        {LEGEND_ORDER.map((kind) => (
          <span key={kind} style={{ color: SLEEP_STAGE_GEOMETRY[kind].color }}>
            {LEGEND_LABEL[kind]}
          </span>
        ))}
      </div>
    </div>
  );
}
