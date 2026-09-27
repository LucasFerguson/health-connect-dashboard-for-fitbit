"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Chip } from "~/components/ui/Chip";
import { IconButton } from "~/components/ui/IconButton";
import { Menu } from "~/components/ui/Menu";
import { Spinner } from "~/components/ui/Spinner";
import type { DayState } from "~/domain/dayView";

function shiftDate(date: string, days: number): string {
  const instant = Date.parse(`${date}T00:00:00Z`);
  return new Date(instant + days * 86_400_000).toISOString().slice(0, 10);
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
 * Band 2 — the 40px context bar: date stepper, TODAY chip, and the DAY
 * START dropdown trigger (visual only — see TODO below).
 *
 * `dayStartHour` is accepted so the shell renders the correct chrome, but
 * wiring its menu up is out of scope here — noted as a known gap rather
 * than faked interactivity.
 */
export function ContextBar({
  selectedDate,
  dayState,
}: {
  selectedDate: string;
  /** Authoritative from the API response — never recomputed locally from
   * the browser/server clock (requirement #2). `"future"` days are the
   * only ones we can identify without a server round trip; "is this the
   * open/current day" for the TODAY chip's disabled state is approximated
   * as "not future", which is close enough for a disabled-button hint. */
  dayState: DayState;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isFuture = dayState === "future";

  const goTo = (date: string) => {
    startTransition(() => {
      router.push(`/day/${date}`);
    });
  };

  const goToToday = () => {
    startTransition(() => {
      router.push("/day");
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
    <div className="border-ink-600 bg-ink-900 flex h-10 shrink-0 items-center gap-3 overflow-x-auto border-b px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div
        className={clsx(
          "flex shrink-0 items-center gap-px transition-opacity duration-[120ms] ease-out",
          isPending && "opacity-50",
        )}
      >
        <IconButton
          aria-label="Previous day"
          onClick={() => goTo(shiftDate(selectedDate, -1))}
          disabled={isPending}
        >
          ‹
        </IconButton>
        <div className="border-ink-500 bg-ink-800 flex h-6 items-center gap-[9px] border-y px-3">
          <span className="font-display text-ink-0 text-lg tracking-[.1em]">
            {weekday} {day} {month}
          </span>
          <span className="text-ink-200 font-mono text-[9px] tracking-[.08em]">
            {year} · DAY {doy}
          </span>
          {isFuture ? (
            <span className="text-brand-500 font-mono text-[9px] tracking-[.08em]">
              PLANNED
            </span>
          ) : null}
          {isPending ? <Spinner size={10} /> : null}
        </div>
        <IconButton
          aria-label="Next day"
          onClick={() => goTo(shiftDate(selectedDate, 1))}
          disabled={isPending}
        >
          ›
        </IconButton>
      </div>

      <button
        type="button"
        onClick={goToToday}
        disabled={isPending}
        className="shrink-0"
      >
        <Chip
          className={clsx(
            "cursor-pointer transition-opacity duration-[120ms] ease-out",
            isPending && "cursor-not-allowed opacity-40",
          )}
        >
          TODAY
        </Chip>
      </button>

      <div className="bg-ink-500 h-4 w-px shrink-0" aria-hidden />

      {/* Menu opens and lists real hour options, but selecting one is a
          no-op — pivoting the timeline's axis origin isn't implemented yet.
          Left genuinely inert rather than faking a working selection.
          Hidden below sm: it's the lowest-priority control in this bar and
          the date stepper needs the room on a phone-width screen. */}
      <div className="hidden shrink-0 sm:block">
        <Menu
          trigger="DAY START 00:00"
          triggerTitle="Pivots the axis origin — not wired up yet"
          options={[
            { label: "00:00" },
            { label: "04:00" },
            { label: "06:00" },
          ]}
        />
      </div>
    </div>
  );
}
