"use client";

import { clsx } from "clsx";
import { Spinner } from "~/components/ui/Spinner";
import { useDayNavigation } from "./DayNavigation";
import {
  RECOVERY_ZONE_COLOR,
  type DayStripCellData,
} from "~/domain/dayViewPresentation";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function weekdayLabelFor(date: string): string {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]!;
}

function dayLabelFor(date: string): string {
  return String(new Date(`${date}T00:00:00Z`).getUTCDate());
}

/**
 * Each cell needs 64px plus its 3px gap, so showing every day up to `d` away
 * from the selected one takes `(2d + 1) * 67px`. Below that width the
 * strip's container query hides the days at distance `d`. Literal class
 * strings so Tailwind can see them.
 */
const HIDE_AT_DISTANCE: Record<number, string> = {
  2: "@max-[335px]:hidden",
  3: "@max-[469px]:hidden",
  4: "@max-[603px]:hidden",
  5: "@max-[737px]:hidden",
  6: "@max-[871px]:hidden",
  7: "@max-[1005px]:hidden",
};

/**
 * Band 3 — the day strip. Built directly from the view model's
 * `nearbyDays` (via `buildDayStripCells`), which the adapter fills out to
 * ±7 days around the selected one, so the selected day is always the middle
 * cell. Rather than scrolling sideways, the strip shows as many days either
 * side of it as fit: the ones furthest out drop first, so the selected day
 * always stays centered and on screen. Bars show real sleep-duration,
 * recovery and strain fractions when the metric's status is displayable.
 */
export function DayStrip({ cells }: { cells: DayStripCellData[] }) {
  const { goTo, pendingDate } = useDayNavigation();
  // Centering and hiding stay on the loaded day so the strip doesn't jump
  // mid-load; only the highlight moves to the picked day straight away.
  const selectedIndex = cells.findIndex((cell) => cell.isSelected);
  const isHighlighted = (cell: DayStripCellData) =>
    pendingDate ? cell.date === pendingDate : cell.isSelected;

  return (
    <div className="border-ink-600 bg-ink-950 flex h-[54px] shrink-0 items-stretch gap-0 border-b px-4 max-sm:h-[60px]">
      {/* The cells already say PLAN, so on a phone the legend gives its
          width to the dates instead. */}
      <div className="border-ink-600 mr-[10px] flex shrink-0 flex-col justify-center gap-0.5 border-r pr-3 max-sm:hidden">
        <span className="text-ink-200 font-mono text-[8px] tracking-[.12em] max-sm:text-[11px]">
          RECORDED
        </span>
        <span className="text-brand-500 font-mono text-[8px] tracking-[.12em] max-sm:text-[11px]">
          PLANNED
        </span>
      </div>
      <div className="@container flex min-w-0 flex-1 gap-[3px] overflow-hidden">
        {cells.map((cell, index) => {
          const isCellPending = pendingDate === cell.date;
          const highlighted = isHighlighted(cell);
          const distance =
            selectedIndex === -1 ? 0 : Math.abs(index - selectedIndex);
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => goTo(cell.date)}
              aria-current={cell.isSelected ? "date" : undefined}
              className={clsx(
                "bg-ink-900 flex min-w-[64px] flex-col justify-center gap-1 px-1.5 text-left transition-colors duration-[120ms] ease-out",
                HIDE_AT_DISTANCE[distance],
                highlighted
                  ? "border-brand-400 bg-ink-800 flex-[1.35] border px-2"
                  : cell.isFuture
                    ? "border-ink-400 flex-1 border border-dashed"
                    : "hover:bg-ink-800 flex-1",
              )}
            >
              <div
                className={clsx(
                  "flex justify-between gap-1 font-mono text-[8.5px] max-sm:text-[11px]",
                  highlighted ? "text-ink-0 font-medium" : "text-ink-200",
                )}
              >
                <span>
                  {weekdayLabelFor(cell.date)} {dayLabelFor(cell.date)}
                </span>
                {isCellPending ? (
                  <Spinner size={8} />
                ) : (
                  <span
                    className={
                      cell.isFuture
                        ? "text-brand-500"
                        : highlighted
                          ? "text-recovery"
                          : undefined
                    }
                  >
                    {cell.isFuture ? "PLAN" : "—"}
                  </span>
                )}
              </div>
              <div className="flex h-[5px] gap-0.5">
                <div
                  className="flex-1"
                  style={{
                    backgroundColor: cell.isFuture
                      ? "var(--color-ink-400)"
                      : "var(--color-sleep)",
                    opacity:
                      cell.sleepFraction === null
                        ? 0.25
                        : highlighted
                          ? 1
                          : 0.55 + cell.sleepFraction * 0.45,
                  }}
                />
                <div
                  className="flex-1"
                  style={{
                    backgroundColor: cell.isFuture
                      ? "var(--color-ink-400)"
                      : cell.recoveryZone
                        ? RECOVERY_ZONE_COLOR[cell.recoveryZone]
                        : "var(--color-ink-300)",
                    opacity:
                      cell.recoveryFraction === null
                        ? 0.2
                        : highlighted
                          ? 1
                          : 0.4 + cell.recoveryFraction * 0.5,
                  }}
                />
                <div
                  className="flex-1"
                  style={{
                    backgroundColor: cell.isFuture
                      ? "var(--color-ink-300)"
                      : "var(--color-strain)",
                    opacity:
                      cell.strainFraction === null
                        ? 0.2
                        : highlighted
                          ? 1
                          : 0.4 + cell.strainFraction * 0.4,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
