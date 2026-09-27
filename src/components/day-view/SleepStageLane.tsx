import type { SleepStageSegment } from "~/domain/dayView";
import {
  axisStartMs,
  minutesToPercentWidth,
  timeToPercent,
} from "~/domain/dayViewTime";
import {
  SLEEP_LANE_HEIGHT_PX,
  SLEEP_STAGE_BAR_INSET_PX,
  SLEEP_STAGE_ROWS,
  SLEEP_STAGE_ROW_HEIGHT_PX,
  SLEEP_STAGE_STYLE,
  sleepStageRowTopPx,
  type RenderedSleepStage,
} from "./timelineConstants";

const RENDERED_STAGE_KINDS = new Set<string>(SLEEP_STAGE_ROWS);

/** Segments closer together than this are drawn as one continuous step. */
const CONNECT_GAP_MS = 60_000;

/**
 * Sleep-stage lane — a hypnogram-style step chart of stage segments straight
 * from `timeline.sleepStages`, positioned by real start/end timestamps using
 * the shared time-axis math (per requirement #6: the API already shapes the
 * segments, the lane only needs to place them on the axis). Each stage gets
 * its own row (awake at the top, deep at the bottom; see
 * `SLEEP_STAGE_ROWS`), separated by hairlines and labelled in the gutter,
 * with thin vertical risers joining back-to-back segments. Segments from a
 * session other than the primary one for this date (i.e. a nap) would need
 * session-comparison metadata this contract doesn't carry, so every
 * returned segment renders at full opacity — the API is the source of truth
 * for which segments belong to this date.
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
      const clippedStartMs = Math.max(segStart, start);
      const clippedEndMs = Math.min(segEnd, end);
      const leftPercent = timeToPercent(
        new Date(clippedStartMs).toISOString(),
        date,
        dayStartHour,
        timeZone,
      );
      const widthPercent = minutesToPercentWidth(
        (clippedEndMs - clippedStartMs) / 60_000,
      );
      if (widthPercent <= 0) return [];
      return [
        {
          kind: segment.kind as RenderedSleepStage,
          key: segment.startAt,
          startMs: clippedStartMs,
          endMs: clippedEndMs,
          leftPercent,
          widthPercent,
        },
      ];
    })
    .sort((a, b) => a.startMs - b.startMs);

  const risers = positioned.flatMap((segment, index) => {
    const previous = positioned[index - 1];
    if (!previous || previous.kind === segment.kind) return [];
    if (segment.startMs - previous.endMs > CONNECT_GAP_MS) return [];
    const centers = [previous.kind, segment.kind].map(
      (kind) => sleepStageRowTopPx(kind) + SLEEP_STAGE_ROW_HEIGHT_PX / 2,
    );
    return [
      {
        key: `riser-${segment.key}-${index}`,
        leftPercent: segment.leftPercent,
        topPx: Math.min(...centers),
        heightPx: Math.abs(centers[0]! - centers[1]!),
      },
    ];
  });

  return (
    <div
      className="border-ink-500 bg-ink-850 relative shrink-0 border-l"
      style={{ height: SLEEP_LANE_HEIGHT_PX }}
    >
      {SLEEP_STAGE_ROWS.slice(1).map((kind) => (
        <div
          key={`row-${kind}`}
          className="bg-ink-600 absolute inset-x-0 h-px"
          style={{ top: sleepStageRowTopPx(kind) }}
        />
      ))}
      {risers.map((riser) => (
        <div
          key={riser.key}
          className="bg-ink-200 absolute w-px opacity-70"
          style={{
            left: `${riser.leftPercent}%`,
            top: riser.topPx,
            height: riser.heightPx,
          }}
        />
      ))}
      {positioned.map((segment, index) => (
        <div
          key={`${segment.key}-${index}`}
          className="absolute"
          style={{
            left: `${segment.leftPercent}%`,
            width: `${segment.widthPercent}%`,
            top: sleepStageRowTopPx(segment.kind) + SLEEP_STAGE_BAR_INSET_PX,
            height: SLEEP_STAGE_ROW_HEIGHT_PX - SLEEP_STAGE_BAR_INSET_PX * 2,
            backgroundColor: SLEEP_STAGE_STYLE[segment.kind].color,
          }}
        />
      ))}
      {positioned.length === 0 ? (
        <div className="text-ink-200 absolute inset-0 flex items-center justify-center font-mono text-[9px] tracking-[.04em]">
          No sleep recorded for this day
        </div>
      ) : null}
    </div>
  );
}
