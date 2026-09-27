import {
  SLEEP_STAGE_ROWS,
  SLEEP_STAGE_ROW_HEIGHT_PX,
  SLEEP_STAGE_STYLE,
} from "./timelineConstants";

const HR_AXIS_LABELS = ["180", "145", "110", "75", "40"];

/** The left gutter: HR axis labels distributed over the HR lane's height, a
 * 14px spacer matching the x-axis strip, one label per sleep-stage row
 * (same row height as `SleepStageLane`, so they line up exactly), then lane
 * names vertically centered against the remaining lanes. Each stage label
 * carries a small swatch in the stage's bar color, doubling as the legend. */
export function TimelineGutter() {
  return (
    <div className="text-ink-200 flex w-[36px] shrink-0 flex-col text-right font-mono text-[8.5px]">
      <div className="flex flex-1 flex-col justify-between py-px">
        {HR_AXIS_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="h-[14px]" />
      {SLEEP_STAGE_ROWS.map((kind) => (
        <div
          key={kind}
          className="text-ink-100 flex items-center justify-end gap-[3px] text-[7.5px] tracking-[.06em]"
          style={{ height: SLEEP_STAGE_ROW_HEIGHT_PX }}
        >
          {SLEEP_STAGE_STYLE[kind].label}
          <span
            aria-hidden
            className="inline-block h-[8px] w-[2px]"
            style={{ backgroundColor: SLEEP_STAGE_STYLE[kind].color }}
          />
        </div>
      ))}
      <div className="mt-1 flex h-[22px] items-center justify-end text-[7.5px] tracking-[.08em]">
        MOVE
      </div>
      <div className="mt-2 flex h-[46px] items-center justify-end text-[7.5px] tracking-[.08em]">
        PLAN
      </div>
    </div>
  );
}
