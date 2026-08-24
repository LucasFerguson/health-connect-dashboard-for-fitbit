const HR_AXIS_LABELS = ["180", "145", "110", "75", "40"];

/** The 30px left gutter: HR axis labels distributed over the HR lane's
 * height, a 14px spacer matching the x-axis strip, then lane names
 * vertically centered against their lanes. */
export function TimelineGutter() {
  return (
    <div className="text-ink-200 flex w-[30px] shrink-0 flex-col text-right font-mono text-[8.5px]">
      <div className="flex flex-1 flex-col justify-between py-px">
        {HR_AXIS_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="h-[14px]" />
      <div className="mt-1 flex h-[30px] items-center justify-end text-[7.5px] tracking-[.08em]">
        SLEEP
      </div>
      <div className="mt-1 flex h-[22px] items-center justify-end text-[7.5px] tracking-[.08em]">
        MOVE
      </div>
      <div className="mt-2 flex h-[46px] items-center justify-end text-[7.5px] tracking-[.08em]">
        PLAN
      </div>
    </div>
  );
}
