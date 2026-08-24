import type { SleepStageSegment } from "~/domain/dayViewData";
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

/**
 * Sleep-stage lane (30px) — a real step chart of stage segments positioned
 * by actual start/end timestamps, per the per-stage top/height/color table
 * in the design spec. This is the one lane with genuinely complete
 * backing data.
 */
export function SleepStageLane({
  segments,
}: {
  segments: SleepStageSegment[];
}) {
  return (
    <div className="border-ink-500 bg-ink-850 relative h-[30px] shrink-0 border-l">
      {segments.map((segment, index) => {
        const geometry = SLEEP_STAGE_GEOMETRY[segment.kind];
        return (
          <div
            key={index}
            className="absolute"
            style={{
              left: `${segment.leftPercent}%`,
              width: `${segment.widthPercent}%`,
              top: geometry.topPx,
              height: geometry.heightPx,
              backgroundColor: geometry.color,
              opacity: segment.isNap ? 0.75 : 1,
            }}
          />
        );
      })}
      {segments.length === 0 ? (
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
