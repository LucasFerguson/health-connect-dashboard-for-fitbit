"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { clsx } from "clsx";
import { Spinner } from "~/components/ui/Spinner";

/** react-day-picker's own stylesheet, recolored through its CSS variables. */
const PICKER_THEME = {
  colorScheme: "dark",
  "--rdp-accent-color": "var(--color-brand-400)",
  "--rdp-accent-background-color": "var(--color-ink-700)",
  "--rdp-today-color": "var(--color-brand-text)",
  "--rdp-day-height": "38px",
  "--rdp-day-width": "38px",
  "--rdp-day_button-height": "36px",
  "--rdp-day_button-width": "36px",
} as CSSProperties;

function dayOfYear(date: string): number {
  const instant = Date.parse(`${date}T00:00:00Z`);
  const yearStart = Date.parse(`${date.slice(0, 4)}-01-01T00:00:00Z`);
  return Math.round((instant - yearStart) / 86_400_000) + 1;
}

/** `YYYY-MM-DD` as a local-midnight Date, which is what DayPicker works in. */
function toLocalDate(date: string): Date {
  const [year = 1970, month = 1, day = 1] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * The selected date ("September 27, 2026" over "SUNDAY · DAY 270"), as a
 * button that opens a month calendar for jumping to any day. Closes on a
 * pick, Escape, or a click outside.
 */
export function DayDatePicker({
  selectedDate,
  isFuture,
  isPending,
  onPick,
}: {
  selectedDate: string;
  isFuture: boolean;
  isPending: boolean;
  onPick: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = toLocalDate(selectedDate);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Pick a date"
        className="border-ink-500 bg-ink-800 hover:bg-ink-700 flex h-6 cursor-pointer items-center gap-2.5 border-y px-3 text-left max-sm:h-11 max-sm:px-2.5"
      >
        <span className="flex items-baseline gap-2.5 max-sm:flex-col max-sm:gap-0">
          <span className="font-display text-ink-0 text-lg tracking-[.06em] whitespace-nowrap max-sm:leading-tight">
            {format(selected, "MMMM d, yyyy")}
          </span>
          <span className="text-ink-200 flex items-center gap-2 font-mono text-[9px] tracking-[.08em] whitespace-nowrap uppercase max-sm:text-[11px] max-sm:leading-tight">
            {format(selected, "EEEE")} · DAY {dayOfYear(selectedDate)}
            {isFuture ? <span className="text-brand-500">PLANNED</span> : null}
            {isPending ? <Spinner size={10} /> : null}
          </span>
        </span>
        <span
          aria-hidden
          className={clsx(
            "text-ink-200 text-[10px] transition-transform duration-[120ms]",
            open && "rotate-180",
          )}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose a date"
          className="border-ink-500 bg-ink-850 text-ink-0 absolute top-full left-0 z-50 mt-1 border p-2 font-mono text-[12px] shadow-[0_8px_24px_rgba(0,0,0,.5)]"
          style={PICKER_THEME}
        >
          <DayPicker
            mode="single"
            required
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              setOpen(false);
              const key = format(date, "yyyy-MM-dd");
              if (key !== selectedDate) onPick(key);
            }}
            showOutsideDays
            captionLayout="dropdown"
            startMonth={new Date(2015, 0)}
            endMonth={new Date(new Date().getFullYear() + 1, 11)}
          />
        </div>
      ) : null}
    </div>
  );
}
