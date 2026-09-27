"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { clsx } from "clsx";
import { Card } from "~/components/ui/Card";
import { Label } from "~/components/ui/Label";
import { shiftDate } from "~/domain/correlation";
import type { DateKey } from "~/domain/health";
import {
  answersByDay,
  datesBetween,
  formatDateSpan,
  habitRangeStats,
  notesByDay,
  type Habit,
  type HabitColumn,
  type HabitDay,
  type HabitView,
} from "~/domain/habits";
import { AnswerMark, NoteTick } from "./AnswerMark";

const weekdayShort = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});
const longDate = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const utc = (date: DateKey) => new Date(`${date}T00:00:00Z`);

/** "Jan 12, 2:45 AM" from WHOOP's source-local "2026-01-12T02:45:47". The
 * string is wall time already, so it is read as-is, not converted. */
function formatLocal(value: string) {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return value;
  const [, date, hh, mm] = match;
  const hours = Number(hh);
  const clock = `${hours % 12 === 0 ? 12 : hours % 12}:${mm} ${hours < 12 ? "AM" : "PM"}`;
  return `${formatDateSpan(date!, date!).replace(/, \d{4}$/, "")}, ${clock}`;
}

const answerText = (day: HabitDay | undefined) =>
  day ? (day.answer === "yes" ? "Yes" : "No") : "No answer";

interface Tip {
  key: string;
  rect: DOMRect;
  content: ReactNode;
  pinned: boolean;
}

/**
 * Questions × days. The question column is sticky so it stays put while a
 * month (or the all-time weeks) scrolls sideways on a phone.
 *
 * Every cell is a button: hovering or focusing shows its details, and a
 * tap/click pins them (the only way on touch). Escape, a click elsewhere, or
 * scrolling closes a pinned card.
 */
export function HabitGrid({
  habits,
  columns,
  view,
}: {
  habits: Habit[];
  columns: HabitColumn[];
  view: HabitView;
}) {
  const days = useMemo(
    () =>
      new Map(habits.map((habit) => [habit.id, answersByDay(habit.entries)])),
    [habits],
  );
  const notes = useMemo(() => notesByDay(habits), [habits]);
  const [tip, setTip] = useState<Tip | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const answeredColumns = useMemo(() => {
    const answered = new Set<string>();
    for (const column of columns) {
      const dates = datesBetween(column.from, column.to);
      if ([...days.values()].some((map) => dates.some((d) => map.has(d)))) {
        answered.add(column.from);
      }
    }
    return answered;
  }, [columns, days]);

  // Answers are sparse, and on a phone a month's first answered day can sit
  // several screens to the right of the sticky question column. Scroll the
  // grid (never the page) so the first answered column is in view.
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const first = element.querySelector<HTMLElement>("th[data-answered]");
    const stickyColumn = element.querySelector<HTMLElement>("th[scope=col]");
    if (!first || !stickyColumn) return;
    const offset = first.offsetLeft - stickyColumn.offsetWidth - 8;
    element.scrollLeft = Math.max(0, offset);
  }, [columns]);

  const show = useCallback(
    (key: string, target: HTMLElement, content: ReactNode, pin: boolean) =>
      setTip((current) => {
        if (current?.pinned && !pin) return current;
        if (pin && current?.pinned && current.key === key) return null;
        return {
          key,
          rect: target.getBoundingClientRect(),
          content,
          pinned: pin,
        };
      }),
    [],
  );
  const hide = useCallback(
    () => setTip((current) => (current?.pinned ? current : null)),
    [],
  );

  useEffect(() => {
    if (!tip?.pinned) return;
    const close = () => setTip(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointer = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-habit-cell], [data-habit-tip]")
      ) {
        return;
      }
      close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", close, true);
    };
  }, [tip?.pinned]);

  const cellProps = (key: string, content: () => ReactNode) => ({
    "data-habit-cell": "",
    "aria-expanded": tip?.key === key && tip.pinned,
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) =>
      show(key, event.currentTarget, content(), false),
    onMouseLeave: hide,
    onFocus: (event: React.FocusEvent<HTMLElement>) =>
      show(key, event.currentTarget, content(), false),
    onBlur: hide,
    onClick: (event: React.MouseEvent<HTMLElement>) =>
      show(key, event.currentTarget, content(), true),
  });

  const width =
    view === "week"
      ? "min-w-14"
      : view === "month"
        ? "min-w-8"
        : "min-w-[52px]";
  const sticky =
    "bg-ink-800 sticky left-0 z-10 w-[148px] min-w-[148px] border-r border-ink-500 sm:w-[260px] sm:min-w-[260px]";

  return (
    <Card padding="p-0" className="relative">
      <div ref={scroller} className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <caption className="sr-only">
            Journal answers by question and {view === "all" ? "week" : "day"}
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className={clsx(
                  sticky,
                  "border-ink-500 border-b px-3 py-2 text-left align-bottom",
                )}
              >
                <Label className="text-ink-100">QUESTION</Label>
              </th>
              {columns.map((column) => {
                const columnNotes = datesBetween(
                  column.from,
                  column.to,
                ).flatMap((date) =>
                  (notes.get(date) ?? []).map((text) => ({ date, text })),
                );
                const key = `head:${column.from}`;
                return (
                  <th
                    key={column.from}
                    scope="col"
                    data-answered={
                      answeredColumns.has(column.from) ? "" : undefined
                    }
                    className={clsx(
                      width,
                      "border-ink-500 border-b p-0 align-bottom font-normal",
                      isWeekend(column) && "bg-ink-850",
                    )}
                  >
                    <button
                      type="button"
                      {...cellProps(key, () => (
                        <ColumnTip column={column} notes={columnNotes} />
                      ))}
                      className="hover:bg-ink-700 relative flex w-full flex-col items-center gap-0.5 px-1 py-2"
                    >
                      <ColumnHead column={column} view={view} />
                      {columnNotes.length > 0 ? <NoteTick /> : null}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
              const byDate = days.get(habit.id) ?? new Map<DateKey, HabitDay>();
              return (
                <tr key={habit.id}>
                  <th
                    scope="row"
                    className={clsx(
                      sticky,
                      "border-ink-600 border-b px-3 py-2 text-left align-middle font-normal",
                    )}
                  >
                    <span className="text-ink-0 font-prose line-clamp-2 text-[12px] leading-4 sm:text-[13px]">
                      {habit.question}
                    </span>
                    <RowCount habit={habit} columns={columns} />
                  </th>
                  {columns.map((column) => {
                    const key = `${habit.id}:${column.from}`;
                    const isDay = column.kind === "day";
                    const day = isDay ? byDate.get(column.from) : undefined;
                    return (
                      <td
                        key={column.from}
                        className={clsx(
                          "border-ink-600 border-b p-0",
                          isWeekend(column) && "bg-ink-850",
                        )}
                      >
                        <button
                          type="button"
                          {...cellProps(key, () =>
                            isDay ? (
                              <DayTip
                                habit={habit}
                                date={column.from}
                                day={day}
                                notes={notes.get(column.from) ?? []}
                              />
                            ) : (
                              <WeekTip
                                habit={habit}
                                column={column}
                                byDate={byDate}
                              />
                            ),
                          )}
                          aria-label={
                            isDay
                              ? `${habit.question} ${formatDateSpan(column.from, column.from)}: ${answerText(day)}`
                              : `${habit.question} ${formatDateSpan(column.from, column.to)}`
                          }
                          className={clsx(
                            "hover:bg-ink-700 focus-visible:outline-brand-400 flex h-11 w-full items-center justify-center outline-offset-[-2px]",
                            tip?.key === key && "bg-ink-700",
                          )}
                        >
                          {isDay ? (
                            <AnswerMark
                              answer={day?.answer ?? null}
                              mixed={day?.mixed}
                            />
                          ) : (
                            <WeekStrip column={column} byDate={byDate} />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tip ? (
        <Tooltip
          rect={tip.rect}
          pinned={tip.pinned}
          onClose={() => setTip(null)}
        >
          {tip.content}
        </Tooltip>
      ) : null}
    </Card>
  );
}

/** "YES 2/3" under the question: yes days over answered days in the visible
 * columns, so the count stays in view while the grid scrolls sideways. */
function RowCount({
  habit,
  columns,
}: {
  habit: Habit;
  columns: HabitColumn[];
}) {
  const first = columns[0];
  const last = columns.at(-1);
  if (!first || !last) return null;
  const stats = habitRangeStats(habit.entries, first.from, last.to);
  return (
    <Label className="mt-0.5 block">
      {stats.answeredDays === 0
        ? "NO ANSWERS"
        : `YES ${stats.yesDays}/${stats.answeredDays} DAYS`}
    </Label>
  );
}

function isWeekend(column: HabitColumn) {
  if (column.kind !== "day") return false;
  const day = utc(column.from).getUTCDay();
  return day === 0 || day === 6;
}

function ColumnHead({
  column,
  view,
}: {
  column: HabitColumn;
  view: HabitView;
}) {
  const date = utc(column.from);
  if (column.kind === "week") {
    return (
      <>
        <span className="text-ink-200 font-mono text-[9px] tracking-[.06em]">
          {date
            .toLocaleString("en-US", { month: "short", timeZone: "UTC" })
            .toUpperCase()}
        </span>
        <span className="text-ink-50 font-mono text-[11px]">
          {date.getUTCDate()}
        </span>
      </>
    );
  }
  const weekday = weekdayShort.format(date).toUpperCase();
  return (
    <>
      <span className="text-ink-200 font-mono text-[9px] tracking-[.06em]">
        {view === "week" ? weekday : weekday.slice(0, 1)}
      </span>
      <span className="text-ink-50 font-mono text-[11px]">
        {date.getUTCDate()}
      </span>
    </>
  );
}

/** A week column's seven days as slim bars, in the grid's shape language:
 * filled = yes, hollow = no, a low dash = no answer, blank = outside the
 * range. */
function WeekStrip({
  column,
  byDate,
}: {
  column: HabitColumn;
  byDate: Map<DateKey, HabitDay>;
}) {
  const monday = shiftDate(
    column.from,
    -((utc(column.from).getUTCDay() + 6) % 7),
  );
  return (
    <span aria-hidden className="flex h-4 items-end gap-px">
      {Array.from({ length: 7 }, (_, index) => {
        const date = shiftDate(monday, index);
        if (date < column.from || date > column.to) {
          return <span key={date} className="block w-1" />;
        }
        const day = byDate.get(date);
        if (!day) {
          return <span key={date} className="bg-ink-200/45 block h-px w-1" />;
        }
        return (
          <span
            key={date}
            className={clsx(
              "block h-4 w-1 border",
              day.answer === "yes"
                ? "border-ink-50 bg-ink-50"
                : "border-ink-100",
            )}
          />
        );
      })}
    </span>
  );
}

function TipTitle({ children }: { children: ReactNode }) {
  return (
    <div className="text-ink-0 font-prose mb-1.5 text-[12px] leading-4 font-semibold">
      {children}
    </div>
  );
}

function Notes({ notes }: { notes: { date?: DateKey; text: string }[] }) {
  if (notes.length === 0) return null;
  return (
    <div className="border-ink-500 mt-2 border-t pt-2">
      <Label className="text-brand-text-dim">JOURNAL NOTE</Label>
      {notes.map((note, index) => (
        <p
          key={index}
          className="text-ink-50 font-prose mt-1 text-[12px] leading-4"
        >
          {note.date ? (
            <span className="text-ink-200 font-mono text-[10px]">
              {formatDateSpan(note.date, note.date).replace(/, \d{4}$/, "")}{" "}
              ·{" "}
            </span>
          ) : null}
          {note.text}
        </p>
      ))}
    </div>
  );
}

function DayTip({
  habit,
  date,
  day,
  notes,
}: {
  habit: Habit;
  date: DateKey;
  day: HabitDay | undefined;
  notes: string[];
}) {
  return (
    <>
      <TipTitle>{habit.question}</TipTitle>
      <div className="text-ink-100 font-mono text-[11px]">
        {longDate.format(utc(date))}
      </div>
      <div className="mt-1.5 flex items-center gap-2 font-mono text-[12px]">
        <AnswerMark answer={day?.answer ?? null} mixed={day?.mixed} size={11} />
        <span className="text-ink-0">{answerText(day)}</span>
      </div>
      {day ? (
        <ul className="text-ink-200 mt-1.5 space-y-0.5 font-mono text-[10px] leading-4">
          {day.entries.map((entry) => (
            <li key={entry.id}>
              {day.entries.length > 1
                ? `${entry.answeredYes ? "Yes" : "No"} · `
                : ""}
              cycle {formatLocal(entry.cycleStartLocal)} →{" "}
              {formatLocal(entry.cycleEndLocal)}
            </li>
          ))}
          {day.mixed ? (
            <li className="text-ink-100">
              Two cycles disagree; the day counts as yes.
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="text-ink-200 font-prose mt-1.5 text-[11px] leading-4">
          Nothing recorded. Not the same as “no”.
        </p>
      )}
      <Notes notes={notes.map((text) => ({ text }))} />
    </>
  );
}

function WeekTip({
  habit,
  column,
  byDate,
}: {
  habit: Habit;
  column: HabitColumn;
  byDate: Map<DateKey, HabitDay>;
}) {
  const answered = datesBetween(column.from, column.to)
    .map((date) => byDate.get(date))
    .filter((day): day is HabitDay => day !== undefined);
  const stats = habitRangeStats(
    answered.flatMap((day) => day.entries),
    column.from,
    column.to,
  );
  const notes = answered.flatMap((day) =>
    [...new Set(day.entries.map((entry) => entry.notes).filter(Boolean))].map(
      (text) => ({ date: day.date, text: text ?? "" }),
    ),
  );
  return (
    <>
      <TipTitle>{habit.question}</TipTitle>
      <div className="text-ink-100 font-mono text-[11px]">
        {formatDateSpan(column.from, column.to)}
      </div>
      <div className="text-ink-0 mt-1.5 font-mono text-[12px]">
        {stats.answeredDays === 0
          ? "No answers this week"
          : `Yes on ${stats.yesDays} of ${stats.answeredDays} answered day${stats.answeredDays === 1 ? "" : "s"}`}
      </div>
      {answered.length > 0 ? (
        <ul className="text-ink-200 mt-1.5 space-y-0.5 font-mono text-[10px] leading-4">
          {answered.map((day) => (
            <li key={day.date} className="flex items-center gap-1.5">
              <AnswerMark answer={day.answer} mixed={day.mixed} size={8} />
              {longDate.format(utc(day.date)).replace(/, \d{4}$/, "")} ·{" "}
              {answerText(day)}
            </li>
          ))}
        </ul>
      ) : null}
      <Notes notes={notes} />
    </>
  );
}

function ColumnTip({
  column,
  notes,
}: {
  column: HabitColumn;
  notes: { date: DateKey; text: string }[];
}) {
  return (
    <>
      <TipTitle>
        {column.kind === "day"
          ? longDate.format(utc(column.from))
          : formatDateSpan(column.from, column.to)}
      </TipTitle>
      {notes.length === 0 ? (
        <p className="text-ink-200 font-prose text-[11px]">No journal note.</p>
      ) : (
        <Notes
          notes={
            column.kind === "day" ? notes.map(({ text }) => ({ text })) : notes
          }
        />
      )}
    </>
  );
}

const TIP_WIDTH = 280;
const GAP = 6;

/** Fixed-position card beside the hovered cell, kept inside the viewport:
 * clamped sideways, and flipped above the cell when there's no room
 * below. */
function Tooltip({
  rect,
  pinned,
  onClose,
  children,
}: {
  rect: DOMRect;
  pinned: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const viewportWidth = document.documentElement.clientWidth;
    const width = Math.min(TIP_WIDTH, viewportWidth - 16);
    const height = element.offsetHeight;
    const left = Math.max(
      8,
      Math.min(
        rect.left + rect.width / 2 - width / 2,
        viewportWidth - width - 8,
      ),
    );
    const below = rect.bottom + GAP;
    const top =
      below + height > window.innerHeight - 8 && rect.top - GAP - height > 8
        ? rect.top - GAP - height
        : below;
    setPosition({ left, top });
  }, [rect, children]);

  return (
    <div
      ref={ref}
      data-habit-tip=""
      role="tooltip"
      className="border-ink-400 bg-ink-800 fixed z-50 border p-3 shadow-[0_8px_24px_rgba(0,0,0,.5)]"
      style={{
        width: `min(${TIP_WIDTH}px, calc(100vw - 16px))`,
        left: position?.left ?? -9999,
        top: position?.top ?? -9999,
        pointerEvents: pinned ? "auto" : "none",
      }}
    >
      {pinned ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-200 hover:text-ink-0 absolute top-1.5 right-2 font-mono text-sm"
        >
          ×
        </button>
      ) : null}
      {children}
    </div>
  );
}
