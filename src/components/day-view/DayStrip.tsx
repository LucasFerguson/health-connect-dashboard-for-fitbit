"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Spinner } from "~/components/ui/Spinner";

export interface DayStripCell {
  date: string;
  weekdayLabel: string;
  dayLabel: string;
  /** Recorded-day sleep fraction of a ~8h reference, 0-1, or null if there
   * is no sleep data for the day (renders as a flattened bar). */
  sleepFraction: number | null;
  /** Recorded-day step fraction of a rough daily target, 0-1, or null. */
  stepsFraction: number | null;
  isFuture: boolean;
  isSelected: boolean;
}

/**
 * Band 3 — the ±7-day scrubbable strip. Bars are a deliberately
 * low-resolution sparkline built from real recorded daily sleep/steps
 * summaries where available. There is no recovery or strain score in this
 * app yet (see the pillar cards), so the strip only lights up the sleep
 * bar for recorded days and renders the other two bars as flattened
 * "no data" ticks rather than fabricating scores — the design's third
 * (strain) bar and per-day recovery number are left out for the same
 * reason the pillar cards are.
 */
export function DayStrip({ cells }: { cells: DayStripCell[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const goTo = (date: string) => {
    setPendingDate(date);
    startTransition(() => {
      router.push(`/day/${date}`);
    });
  };

  return (
    <div className="border-ink-600 bg-ink-950 flex h-[54px] shrink-0 items-stretch gap-0 border-b px-4">
      <div className="border-ink-600 mr-[10px] flex shrink-0 flex-col justify-center gap-0.5 border-r pr-3">
        <span className="text-ink-200 font-mono text-[8px] tracking-[.12em]">
          RECORDED
        </span>
        <span className="text-brand-500 font-mono text-[8px] tracking-[.12em]">
          PLANNED
        </span>
      </div>
      <div className="flex flex-1 gap-[3px] overflow-x-auto">
        {cells.map((cell) => {
          const isCellPending = isPending && pendingDate === cell.date;
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => goTo(cell.date)}
              disabled={isPending}
              className={clsx(
                "bg-ink-900 flex min-w-[64px] flex-col justify-center gap-1 px-1.5 text-left transition-colors duration-[120ms] ease-out disabled:pointer-events-none",
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
                  "flex justify-between font-mono text-[8.5px]",
                  cell.isSelected ? "text-ink-0 font-medium" : "text-ink-200",
                )}
              >
                <span>
                  {cell.weekdayLabel} {cell.dayLabel}
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
                  title="Recovery score not modeled yet"
                />
                <div
                  className="flex-1"
                  style={{
                    backgroundColor: cell.isFuture
                      ? "var(--color-ink-300)"
                      : "var(--color-strain)",
                    opacity:
                      cell.stepsFraction === null
                        ? 0.2
                        : cell.isSelected
                          ? 1
                          : 0.4 + cell.stepsFraction * 0.4,
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
