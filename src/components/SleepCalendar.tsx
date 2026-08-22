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
        className={`relative h-16 w-16 cursor-pointer align-top text-slate-900 ${styles?.background ?? ""}`}
        onClick={() => selectDate(modifiers.selected ? null : date)}
      >
        <div className="flex h-full flex-col items-center justify-center">
          <span
            className={`rounded-full px-2 text-sm ${modifiers.selected ? "bg-violet-700 text-white" : ""} ${modifiers.today ? "font-bold text-blue-700" : ""}`}
          >
            {day.date.getDate()}
          </span>
          {summary ? (
            <span
              className={`absolute right-2 bottom-1 text-[0.65rem] font-semibold ${styles?.text ?? ""}`}
            >
              {(summary.sleepMinutes / 60).toFixed(1)}h
            </span>
          ) : null}
          {summary && summary.sessionCount > 1 ? (
            <span
              className="absolute top-1 right-1 rounded-full bg-violet-700 px-1.5 py-0.5 text-[0.6rem] font-bold text-white"
              title={`${summary.sessionCount} sleep sessions`}
            >
              {summary.sessionCount}x
            </span>
          ) : null}
        </div>
      </td>
    );
  };

  return (
    <div className="rounded-lg border border-white/20 bg-white p-4 text-slate-950 shadow-md">
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={(date) =>
          selectDate(date ? format(date, "yyyy-MM-dd") : null)
        }
        components={{ Day }}
        defaultMonth={selected}
        footer={
          <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-500">
            <button
              type="button"
              className="hover:text-slate-800"
              onClick={() => selectDate(null)}
            >
              Clear selection
            </button>
            <span>
              {selectedDate ? `Selected: ${selectedDate}` : "No date selected"}
            </span>
          </div>
        }
      />
    </div>
  );
}
