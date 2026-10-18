"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Chip } from "~/components/ui/Chip";
import { IconButton } from "~/components/ui/IconButton";
import type { DayState } from "~/domain/dayView";
import { DayDatePicker } from "./DayDatePicker";

function shiftDate(date: string, days: number): string {
  const instant = Date.parse(`${date}T00:00:00Z`);
  return new Date(instant + days * 86_400_000).toISOString().slice(0, 10);
}

/** The shared 24px IconButton is too small to tap on a phone; below `sm`
 * the stepper buttons grow to 44px and a larger chevron. */
const STEP_BUTTON_PHONE_CLASS = "max-sm:size-11 max-sm:text-lg";

/**
 * Band 2 — the 40px context bar (60px on phones, so the stepper and TODAY
 * are 44px tap targets): the date stepper, whose middle opens a month
 * calendar (`DayDatePicker`), and the TODAY chip. The timeline always
 * starts at midnight.
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

  return (
    <div className="border-ink-600 bg-ink-900 relative z-20 flex h-10 shrink-0 items-center gap-3 border-b px-4 max-sm:h-[60px] max-sm:gap-2">
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
          className={STEP_BUTTON_PHONE_CLASS}
        >
          ‹
        </IconButton>
        <DayDatePicker
          selectedDate={selectedDate}
          isFuture={isFuture}
          isPending={isPending}
          onPick={goTo}
        />
        <IconButton
          aria-label="Next day"
          onClick={() => goTo(shiftDate(selectedDate, 1))}
          disabled={isPending}
          className={STEP_BUTTON_PHONE_CLASS}
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
            "cursor-pointer transition-opacity duration-[120ms] ease-out max-sm:h-11 max-sm:px-3 max-sm:text-[11px]",
            isPending && "cursor-not-allowed opacity-40",
          )}
        >
          TODAY
        </Chip>
      </button>
    </div>
  );
}
