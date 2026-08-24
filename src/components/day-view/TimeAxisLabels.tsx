import { X_AXIS_HOUR_LABELS } from "./timelineConstants";

/** The 14px x-axis strip beneath the HR lane: twelve 2-hour labels, with
 * a trailing "24" anchored to the right edge of the final cell. */
export function TimeAxisLabels() {
  return (
    <div className="text-ink-200 flex h-[14px] shrink-0 font-mono text-[8px] leading-[14px]">
      {X_AXIS_HOUR_LABELS.map((label, index) => (
        <div key={label} className="relative flex-1">
          {label}
          {index === X_AXIS_HOUR_LABELS.length - 1 ? (
            <span className="absolute right-0">24</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
