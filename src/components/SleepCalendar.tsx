"use client";

import { format, parseISO } from "date-fns";
import { DayPicker, type DayProps } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useHealthData } from "~/features/health/HealthDataProvider";
import { selectSleepDays } from "~/features/health/selectors";

const stylesForDuration = (minutes: number) =>
  minutes < 180
    ? { background: "bg-red-100", text: "text-red-700" }
    : minutes < 360
      ? { background: "bg-amber-100", text: "text-amber-700" }
      : { background: "bg-emerald-100", text: "text-emerald-700" };

export function SleepCalendar() {
  const { snapshot, selectedDate, selectDate } = useHealthData();
  const days = selectSleepDays(snapshot);
  const selected = selectedDate ? parseISO(selectedDate) : undefined;

  const Day = ({ day, modifiers, ...cellProps }: DayProps) => {
    const date = format(day.date, "yyyy-MM-dd");
    const summary = days[date];
    const styles = summary ? stylesForDuration(summary.sleepMinutes) : null;

    return (
      <td
        {...cellProps}
        className={`relative h-14 w-11 cursor-pointer align-top text-slate-900 sm:h-16 sm:w-16 ${styles?.background ?? ""}`}
        onClick={() => selectDate(modifiers.selected ? null : date)}
      >
        <div className="flex h-full flex-col items-center justify-center">
          <span
            className={`rounded-full px-1.5 text-sm sm:px-2 ${modifiers.selected ? "bg-violet-700 text-white" : ""} ${modifiers.today ? "font-bold text-blue-700" : ""}`}
          >
            {day.date.getDate()}
          </span>
          {summary ? (
            <span
              className={`absolute right-0.5 bottom-0.5 text-[11px] leading-none font-semibold sm:right-2 sm:bottom-1 sm:text-[0.65rem] ${styles?.text ?? ""}`}
            >
              {(summary.sleepMinutes / 60).toFixed(1)}h
            </span>
          ) : null}
          {summary && summary.sessionCount > 1 ? (
            <span
              className="absolute top-0.5 right-0.5 rounded-full bg-violet-700 px-1 text-[11px] leading-4 font-bold text-white sm:top-1 sm:right-1 sm:px-1.5 sm:py-0.5 sm:text-[0.6rem] sm:leading-normal"
              title={`${summary.sessionCount} sleep sessions`}
            >
              {summary.sessionCount}x
            </span>
          ) : null}
          {summary && summary.recordingCount > summary.sessionCount ? (
            <span
              className="absolute top-0.5 left-0.5 text-[11px] leading-4 font-semibold text-violet-700 sm:top-1 sm:left-1 sm:text-[0.55rem] sm:leading-normal"
              title={`${summary.recordingCount} device recordings represented`}
            >
              {summary.recordingCount}
              <span className="sr-only sm:not-sr-only"> devices</span>
              <span aria-hidden className="sm:hidden">
                d
              </span>
            </span>
          ) : null}
        </div>
      </td>
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-white/20 bg-white p-2 text-slate-950 shadow-md sm:p-4">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={(date) =>
          selectDate(date ? format(date, "yyyy-MM-dd") : null)
        }
        components={{ Day }}
        defaultMonth={selected}
        footer={
          <div className="mt-3 flex flex-col gap-2 sm:mt-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-slate-500">
              <button
                type="button"
                className="min-h-11 rounded-lg border border-slate-200 px-3 text-slate-600 hover:border-slate-400 hover:text-slate-800 sm:min-h-9"
                onClick={() => selectDate(null)}
              >
                Clear selection
              </button>
              <span>
                {selectedDate
                  ? `Selected: ${selectedDate}`
                  : "No date selected"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Hours slept per night · <strong>2x</strong> sleep sessions ·{" "}
              <strong className="text-violet-700">
                3<span className="sm:hidden">d</span>
                <span className="hidden sm:inline"> devices</span>
              </strong>{" "}
              device recordings
            </p>
          </div>
        }
      />
    </div>
  );
}
