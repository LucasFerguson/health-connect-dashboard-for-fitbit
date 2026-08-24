"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Chip } from "~/components/ui/Chip";
import { DropdownTrigger } from "~/components/ui/DropdownTrigger";
import { notchStyle } from "~/components/ui/notch";
import { Spinner } from "~/components/ui/Spinner";
import { dateKeyOf } from "~/domain/dayViewTime";

const RANGE_SEGMENTS = ["24H", "7D", "30D", "90D", "1Y", "CUSTOM…"];

function shiftDate(date: string, days: number): string {
  const instant = Date.parse(`${date}T00:00:00Z`);
  return new Date(instant + days * 86_400_000).toISOString().slice(0, 10);
}

function todayKey(timeZone: string): string {
  return dateKeyOf(new Date().toISOString(), timeZone);
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function dayOfYear(date: string): number {
  const instant = Date.parse(`${date}T00:00:00Z`);
  const yearStart = Date.parse(`${date.slice(0, 4)}-01-01T00:00:00Z`);
  return Math.round((instant - yearStart) / 86_400_000) + 1;
}

/**
 * Band 2 — the 40px context bar: date stepper, TODAY chip, DAY START and
 * COMPARE dropdown triggers (visual only — see TODO below), and the
 * (disabled, per spec) range selector locked to DAY.
 *
 * `dayStartHour` and `compareDate` are accepted so the shell renders the
 * correct chrome, but wiring their menus up is out of scope here — noted
 * as a known gap rather than faked interactivity.
 */
export function ContextBar({
  selectedDate,
  timeZone,
}: {
  selectedDate: string;
  timeZone: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isToday = selectedDate === todayKey(timeZone);

  const goTo = (date: string) => {
    startTransition(() => {
      router.push(`/day/${date}`);
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
      }
      if (event.key === "ArrowLeft") goTo(shiftDate(selectedDate, -1));
      if (event.key === "ArrowRight") goTo(shiftDate(selectedDate, 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const { weekday, day, month, year, doy } = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00Z`);
    return {
      weekday: WEEKDAYS[date.getUTCDay()],
      day: date.getUTCDate(),
      month: MONTHS[date.getUTCMonth()],
      year: date.getUTCFullYear(),
      doy: dayOfYear(selectedDate),
    };
  }, [selectedDate]);

  return (
    <div className="border-ink-600 bg-ink-900 flex h-10 shrink-0 items-center gap-3 border-b px-4">
      <div
        className={clsx(
          "flex items-center gap-px transition-opacity duration-[120ms] ease-out",
          isPending && "opacity-50",
        )}
      >
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => goTo(shiftDate(selectedDate, -1))}
          disabled={isPending}
          className="border-ink-500 text-ink-100 hover:bg-ink-800 hover:text-ink-0 flex size-6 items-center justify-center border font-mono text-[11px] transition-colors duration-[120ms] ease-out disabled:pointer-events-none"
        >
          ‹
        </button>
        <div className="border-ink-500 bg-ink-800 flex h-6 items-center gap-[9px] border-y px-3">
          <span className="font-display text-ink-0 text-lg tracking-[.1em]">
            {weekday} {day} {month}
          </span>
          <span className="text-ink-200 font-mono text-[9px] tracking-[.08em]">
            {year} · DAY {doy}
          </span>
          {isPending ? <Spinner size={10} /> : null}
        </div>
        <button
          type="button"
          aria-label="Next day"
          onClick={() => goTo(shiftDate(selectedDate, 1))}
          disabled={isPending}
          className="border-ink-500 text-ink-100 hover:bg-ink-800 hover:text-ink-0 flex size-6 items-center justify-center border font-mono text-[11px] transition-colors duration-[120ms] ease-out disabled:pointer-events-none"
        >
          ›
        </button>
      </div>

      <button
        type="button"
        onClick={() => goTo(todayKey(timeZone))}
        disabled={isToday || isPending}
      >
        <Chip
          className={clsx(
            "cursor-pointer transition-opacity duration-[120ms] ease-out",
            (isToday || isPending) && "cursor-not-allowed opacity-40",
          )}
        >
          TODAY
        </Chip>
      </button>

      <div className="bg-ink-500 h-4 w-px" aria-hidden />

      <DropdownTrigger title="Pivots the axis origin — not wired up yet">
        DAY START 00:00 <span className="text-ink-200">▾</span>
      </DropdownTrigger>
      <DropdownTrigger title="Overlays another day as a ghost series — not wired up yet">
        COMPARE <span className="text-ink-200">▾</span>
      </DropdownTrigger>

      <div className="ml-auto flex items-center gap-2.5">
        <span className="text-ink-200 font-mono text-[9px] tracking-[.14em]">
          RANGE
        </span>
        <div
          className="border-ink-500 flex border opacity-55"
          style={notchStyle(8)}
        >
          {RANGE_SEGMENTS.map((segment) => (
            <span
              key={segment}
              className={clsx(
                "flex h-6 items-center gap-1 px-[11px] font-mono text-[9.5px] tracking-[.06em]",
                segment === "24H"
                  ? "bg-brand-500 text-ink-0 font-medium"
                  : "text-ink-200",
              )}
            >
              {segment}
              {segment === "24H" ? <span className="text-[8px]">▮</span> : null}
            </span>
          ))}
        </div>
        <span className="text-ink-200 font-mono text-[8px]">LOCKED ON DAY</span>
      </div>
    </div>
  );
}
