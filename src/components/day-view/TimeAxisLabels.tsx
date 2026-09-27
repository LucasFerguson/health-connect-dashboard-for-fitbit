import { slotHourLabel } from "~/domain/dayViewTime";
import { X_AXIS_LABEL_SLOTS } from "./timelineConstants";

/** The 14px x-axis strip beneath the HR lane: twelve 2-hour labels in
 * 12-hour clock form (`12 AM`, `2 AM`, ... `10 PM`), with the axis end
 * anchored to the right edge of the final cell. */
export function TimeAxisLabels({ dayStartHour }: { dayStartHour: number }) {
  return (
    <div className="text-ink-200 flex h-[14px] shrink-0 font-mono text-[8px] leading-[14px] whitespace-nowrap">
      {X_AXIS_LABEL_SLOTS.map((slot, index) => (
        <div key={slot} className="relative flex-1">
          {slotHourLabel(slot, dayStartHour)}
          {index === X_AXIS_LABEL_SLOTS.length - 1 ? (
            <span className="absolute right-0">
              {slotHourLabel(24, dayStartHour)}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
