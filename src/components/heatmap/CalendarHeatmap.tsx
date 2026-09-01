"use client";

import { useMemo, useState } from "react";

export interface HeatmapDatum {
  date: string;
  value: number;
}

const CELL = 14;
const BOX = 11;
const LEFT = 30;
const TOP = 22;
const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function CalendarHeatmap({
  data,
  title = "Year at a glance",
  description = "Each square is one day; darker squares represent higher values.",
  label,
  color,
  formatValue,
  initialDate,
}: {
  data: HeatmapDatum[];
  title?: string;
  description?: string;
  label: string;
  color: string;
  formatValue: (value: number) => string;
  initialDate?: string;
}) {
  const availableYears = useMemo(
    () => [...new Set(data.map((day) => Number(day.date.slice(0, 4))))].sort(),
    [data],
  );
  const initialYear = initialDate
    ? Number(initialDate.slice(0, 4))
    : (availableYears.at(-1) ?? new Date().getUTCFullYear());
  const [year, setYear] = useState(initialYear);
  const values = useMemo(
    () => new Map(data.map((day) => [day.date, day.value])),
    [data],
  );
  const days = useMemo(() => daysInYear(year), [year]);
  const yearValues = days
    .map((day) => values.get(day.date))
    .filter((value): value is number => value !== undefined);
  const maximum = Math.max(...yearValues, 0);
  const weeks = Math.max(...days.map((day) => day.week), 0) + 1;

  return (
    <section className="rounded-xl border border-white/10 bg-white/10 p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-white/55">{description}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-white/60">
          Year
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="rounded-lg border border-white/15 bg-[#21154b] px-3 py-2 text-white"
          >
            {(availableYears.length ? availableYears : [year]).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="overflow-x-auto pb-2">
        <svg
          width={LEFT + weeks * CELL + 8}
          height={TOP + 7 * CELL + 8}
          role="img"
          aria-label={`${label} daily heatmap for ${year}`}
        >
          {WEEKDAYS.map((weekday, row) => (
            <text
              key={row}
              x={0}
              y={TOP + row * CELL + 9}
              fill="rgba(255,255,255,0.48)"
              fontSize="9"
            >
              {weekday}
            </text>
          ))}
          {monthPositions(year).map((month) => (
            <text
              key={month.label}
              x={LEFT + month.week * CELL}
              y={10}
              fill="rgba(255,255,255,0.48)"
              fontSize="10"
            >
              {month.label}
            </text>
          ))}
          {days.map((day) => {
            const value = values.get(day.date);
            return (
              <rect
                key={day.date}
                x={LEFT + day.week * CELL}
                y={TOP + day.weekday * CELL}
                width={BOX}
                height={BOX}
                rx={2}
                fill={value === undefined ? "rgba(255,255,255,0.06)" : color}
                fillOpacity={
                  value === undefined ? 1 : heatOpacity(value, maximum)
                }
              >
                <title>
                  {`${day.date}: ${value === undefined ? "No reading" : formatValue(value)}`}
                </title>
              </rect>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-xs text-white/45">
        <span className="mr-1">Less</span>
        {[0.18, 0.38, 0.58, 0.78, 1].map((opacity) => (
          <span
            key={opacity}
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: color, opacity }}
          />
        ))}
        <span className="ml-1">More</span>
      </div>
    </section>
  );
}

function daysInYear(year: number) {
  const first = Date.UTC(year, 0, 1);
  const last = Date.UTC(year + 1, 0, 1);
  const firstWeekday = new Date(first).getUTCDay();
  const days: Array<{ date: string; week: number; weekday: number }> = [];
  for (let instant = first; instant < last; instant += 86_400_000) {
    const date = new Date(instant);
    const offset = Math.round((instant - first) / 86_400_000);
    days.push({
      date: date.toISOString().slice(0, 10),
      week: Math.floor((offset + firstWeekday) / 7),
      weekday: date.getUTCDay(),
    });
  }
  return days;
}

function monthPositions(year: number) {
  const firstWeekday = new Date(Date.UTC(year, 0, 1)).getUTCDay();
  return Array.from({ length: 12 }, (_, month) => {
    const start = Date.UTC(year, month, 1);
    const offset = Math.round((start - Date.UTC(year, 0, 1)) / 86_400_000);
    return {
      label: MONTHS[month]!,
      week: Math.floor((offset + firstWeekday) / 7),
    };
  });
}

function heatOpacity(value: number, maximum: number): number {
  if (maximum <= 0) return 0.18;
  const ratio = value / maximum;
  if (ratio <= 0.2) return 0.18;
  if (ratio <= 0.4) return 0.38;
  if (ratio <= 0.6) return 0.58;
  if (ratio <= 0.8) return 0.78;
  return 1;
}
