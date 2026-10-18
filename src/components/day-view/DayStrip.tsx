"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Spinner } from "~/components/ui/Spinner";
import type { DayStripCellData } from "~/domain/dayViewPresentation";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function weekdayLabelFor(date: string): string {
  return WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]!;
}

function dayLabelFor(date: string): string {
  return String(new Date(`${date}T00:00:00Z`).getUTCDate());
}

/**
 * Band 3 — the ±7-day scrubbable strip (radius=7: 15 cells total). Built
 * directly from the view model's `nearbyDays` (via `buildDayStripCells`),
 * which the adapter already filled out to the full window. Bars
 * show real sleep-duration and strain fractions when the underlying
 * metric's status is displayable; recovery has no per-day strip bar since
 * that pillar has no numeric value to show (see the pillar cards' own
 * "not available" handling).
 */
export function DayStrip({ cells }: { cells: DayStripCellData[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedDate = cells.find((cell) => cell.isSelected)?.date ?? null;

  // On a phone the 15 cells don't fit, so the strip scrolls sideways;
  // bring the selected day (today, on /day) into the middle of the visible
  // part. The scroller is `relative`, so `offsetLeft` is measured from its
  // own edge. Sets `scrollLeft` directly rather than `scrollIntoView`, which
  // would also scroll the page vertically.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;
    const selected = scroller.querySelector<HTMLElement>(
      '[aria-current="date"]',
    );
    if (!selected) return;
    scroller.scrollLeft =
      selected.offsetLeft - (scroller.clientWidth - selected.offsetWidth) / 2;
  }, [selectedDate]);

  const goTo = (date: string) => {
    setPendingDate(date);
    startTransition(() => {
      router.push(`/day/${date}`);
    });
  };

  return (
    <div className="border-ink-600 bg-ink-950 flex h-[54px] shrink-0 items-stretch gap-0 border-b px-4 max-sm:h-[60px]">
      <div className="border-ink-600 mr-[10px] flex shrink-0 flex-col justify-center gap-0.5 border-r pr-3">
        <span className="text-ink-200 font-mono text-[8px] tracking-[.12em] max-sm:text-[11px]">
          RECORDED
        </span>
        <span className="text-brand-500 font-mono text-[8px] tracking-[.12em] max-sm:text-[11px]">
          PLANNED
        </span>
      </div>
      <div
        ref={scrollerRef}
        className="relative flex min-w-0 flex-1 gap-[3px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cells.map((cell) => {
          const isCellPending = isPending && pendingDate === cell.date;
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => goTo(cell.date)}
              aria-current={cell.isSelected ? "date" : undefined}
              disabled={isPending}
              className={clsx(
                "bg-ink-900 flex min-w-[64px] flex-col justify-center gap-1 px-1.5 text-left transition-colors duration-[120ms] ease-out disabled:pointer-events-none max-sm:min-w-[80px]",
                isPending && !isCellPending && "opacity-50",
                cell.isSelected
                  ? "border-brand-400 bg-ink-800 flex-[1.35] border px-2"
                  : cell.isFuture
                    ? "border-ink-400 flex-1 border border-dashed"
                    : "hover:bg-ink-800 flex-1",
              )}
            >
              <div
                className={clsx(
                  "flex justify-between gap-1 font-mono text-[8.5px] max-sm:text-[11px]",
                  cell.isSelected ? "text-ink-0 font-medium" : "text-ink-200",
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
                        : cell.isSelected
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
                        : cell.isSelected
                          ? 1
                          : 0.55 + cell.sleepFraction * 0.45,
                  }}
                />
                <div
                  className="flex-1"
                  style={{
                    backgroundColor: cell.isFuture
                      ? "var(--color-ink-400)"
                      : "var(--color-ink-300)",
                    opacity: 0.35,
                  }}
                  title="Recovery is not available"
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
                        : cell.isSelected
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
