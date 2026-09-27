"use client";

import Link, { useLinkStatus } from "next/link";
import { clsx } from "clsx";
import { useMemo } from "react";
import { Card } from "~/components/ui/Card";
import { Label } from "~/components/ui/Label";
import { PageShell } from "~/components/ui/PageShell";
import { Spinner } from "~/components/ui/Spinner";
import { notchStyle } from "~/components/ui/notch";
import type { DateKey } from "~/domain/health";
import {
  HABIT_VIEWS,
  formatDateSpan,
  formatPeriod,
  habitColumns,
  habitRangeStats,
  habitsSearch,
  latestResponseDate,
  responseSpan,
  stepAnchor,
  type Habit,
  type HabitPeriod,
  type HabitView,
} from "~/domain/habits";
import { AnswerLegend } from "./AnswerMark";
import { HabitGrid } from "./HabitGrid";

const VIEW_LABELS: Record<HabitView, string> = {
  week: "WEEK",
  month: "MONTH",
  all: "ALL",
};

const href = (view: HabitView, date: DateKey | null) =>
  `/habits?${habitsSearch({ view, date })}`;

/**
 * `/habits`: WHOOP journal answers as a questions × days grid. The view and
 * period live in the URL (`?view=month&date=2026-04-08`) and every change
 * is a navigation, because the server fetches only that period's answers.
 */
export function HabitsView({
  habits,
  period,
  anchor,
}: {
  habits: Habit[];
  period: HabitPeriod;
  anchor: DateKey;
}) {
  // All-time bounds: the backend reports them whatever range was fetched.
  const span = useMemo(() => responseSpan(habits), [habits]);
  const latest = useMemo(() => latestResponseDate(habits), [habits]);
  const from = period.from ?? span?.from ?? null;
  const to = period.to ?? span?.to ?? null;
  const columns = useMemo(
    () => (from && to ? habitColumns(period.view, from, to) : []),
    [period.view, from, to],
  );
  const stats = useMemo(
    () =>
      new Map(
        habits.map((habit) => [
          habit.id,
          habitRangeStats(habit.entries, period.from, period.to),
        ]),
      ),
    [habits, period.from, period.to],
  );
  const responses = [...stats.values()].reduce(
    (sum, stat) => sum + stat.responses,
    0,
  );
  const latestInView =
    latest !== null &&
    (period.from === null || latest >= period.from) &&
    (period.to === null || latest <= period.to);

  return (
    <PageShell>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="font-display text-[28px] leading-none tracking-[.12em]">
            HABITS
          </h1>
          <p className="text-ink-100 font-prose mt-2 max-w-2xl text-sm">
            Your WHOOP journal answers, question by question. A mark records
            what you answered, not whether it was good: “yes” to “Experienced a
            headache?” means you had one. A day you didn’t answer is shown as no
            answer, never as “no”.
          </p>
        </div>
        <Label>
          {span
            ? `ANSWERS ${formatDateSpan(span.from, span.to).toUpperCase()}`
            : "NO ANSWERS YET"}
        </Label>
      </header>

      <Card
        className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3"
        padding="p-4"
      >
        <nav aria-label="Period" className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="View" className="flex">
            {HABIT_VIEWS.map((view, index) => {
              const active = view === period.view;
              return (
                <Link
                  key={view}
                  href={href(view, anchor)}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex h-8 items-center gap-1.5 border px-3 font-mono text-[10px] tracking-[.08em] transition-colors duration-[120ms]",
                    index > 0 && "-ml-px",
                    active
                      ? "border-brand-400 bg-brand-950 text-ink-0 relative z-10"
                      : "border-ink-500 text-ink-100 hover:bg-ink-700 hover:text-ink-0",
                  )}
                >
                  {VIEW_LABELS[view]}
                  <Pending />
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <StepLink
              label="Previous period"
              disabled={period.view === "all"}
              to={href(period.view, stepAnchor(period.view, anchor, -1))}
            >
              ‹
            </StepLink>
            <span className="text-ink-0 min-w-[9.5rem] text-center font-mono text-[12px] tracking-[.04em]">
              {formatPeriod(period, span)}
            </span>
            <StepLink
              label="Next period"
              disabled={period.view === "all"}
              to={href(period.view, stepAnchor(period.view, anchor, 1))}
            >
              ›
            </StepLink>
          </div>
          {latest && !latestInView ? (
            <Link
              href={href(period.view, latest)}
              scroll={false}
              className="border-ink-500 text-ink-100 hover:border-ink-400 hover:bg-ink-700 hover:text-ink-0 flex h-8 items-center gap-1.5 border px-3 font-mono text-[10px] tracking-[.08em]"
              style={notchStyle(7)}
            >
              LATEST ANSWERS
              <Pending />
            </Link>
          ) : null}
        </nav>
        <AnswerLegend />
      </Card>

      {responses === 0 ? (
        <Card className="mb-4" padding="p-4" topAccent="var(--color-ink-400)">
          <p className="text-ink-50 font-prose text-sm">
            No journal answers in {formatPeriod(period, span)}.
            {span
              ? ` Your answers span ${formatDateSpan(span.from, span.to)}.`
              : ""}
          </p>
          {latest ? (
            <Link
              href={href(period.view, latest)}
              scroll={false}
              className="bg-brand-500 text-ink-0 hover:bg-brand-400 mt-3 inline-flex h-8 items-center gap-1.5 px-[14px] font-mono text-[10.5px] tracking-[.06em]"
              style={notchStyle(8)}
            >
              JUMP TO LATEST ({formatDateSpan(latest, latest).toUpperCase()})
              <Pending />
            </Link>
          ) : null}
        </Card>
      ) : null}

      {habits.length === 0 ? (
        <Card padding="p-4">
          <p className="text-ink-100 font-prose text-sm">
            HCGateway has no journal questions for this account.
          </p>
        </Card>
      ) : (
        <>
          <HabitGrid habits={habits} columns={columns} view={period.view} />
          <SummaryTable habits={habits} stats={stats} period={period} />
        </>
      )}
    </PageShell>
  );
}

/** A spinner inside a `Link` while that link's navigation is pending. */
function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner size={9} color="currentColor" /> : null;
}

function StepLink({
  to,
  label,
  disabled,
  children,
}: {
  to: string;
  label: string;
  disabled: boolean;
  children: string;
}) {
  const className =
    "border-ink-500 text-ink-100 flex size-8 items-center justify-center border font-mono text-base";
  if (disabled) {
    return (
      <span aria-hidden className={clsx(className, "opacity-35")}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={to}
      scroll={false}
      aria-label={label}
      className={clsx(className, "hover:bg-ink-700 hover:text-ink-0")}
    >
      <PendingOr>{children}</PendingOr>
    </Link>
  );
}

function PendingOr({ children }: { children: string }) {
  const { pending } = useLinkStatus();
  return pending ? <Spinner size={10} color="currentColor" /> : children;
}

/**
 * Per-question numbers for the period. The yes bar is a proportion of
 * *answered* days, in the same neutral ink as the grid's yes mark; it is
 * not a score.
 */
function SummaryTable({
  habits,
  stats,
  period,
}: {
  habits: Habit[];
  stats: Map<string, ReturnType<typeof habitRangeStats>>;
  period: HabitPeriod;
}) {
  const mixed = [...stats.values()].reduce(
    (sum, stat) => sum + stat.mixedDays,
    0,
  );
  const scope = period.view === "all" ? "ALL TIME" : "THIS PERIOD";
  return (
    <Card className="mt-4" padding="p-0">
      <div className="border-ink-500 flex items-baseline justify-between gap-4 border-b px-4 py-3">
        <Label className="text-ink-100">QUESTIONS · {scope}</Label>
        <Label>FIRST / LAST SEEN ARE ALL-TIME</Label>
      </div>
      <ul className="divide-ink-600 divide-y">
        {habits.map((habit) => {
          const stat = stats.get(habit.id);
          if (!stat) return null;
          const share = stat.answeredDays
            ? stat.yesDays / stat.answeredDays
            : 0;
          return (
            <li
              key={habit.id}
              className="grid gap-x-6 gap-y-2 px-4 py-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_auto] md:items-center"
            >
              <span className="text-ink-0 font-prose text-sm">
                {habit.question}
              </span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="text-ink-50 font-mono text-[11px]">
                  {stat.answeredDays === 0
                    ? "No answers"
                    : `Yes on ${stat.yesDays} of ${stat.answeredDays} answered day${stat.answeredDays === 1 ? "" : "s"}`}
                  <span className="text-ink-200">
                    {" "}
                    · {stat.responses} response
                    {stat.responses === 1 ? "" : "s"}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="bg-ink-700 block h-1 w-full max-w-64"
                >
                  <span
                    className="bg-ink-50 block h-full"
                    style={{ width: `${share * 100}%` }}
                  />
                </span>
              </div>
              <span className="text-ink-200 font-mono text-[10px] tracking-[.04em] md:text-right">
                {habit.entryCount > 0
                  ? `${formatDateSpan(habit.firstSeenDate, habit.firstSeenDate)} → ${formatDateSpan(habit.lastSeenDate, habit.lastSeenDate)} · ${habit.entryCount} total`
                  : "never answered"}
              </span>
            </li>
          );
        })}
      </ul>
      {mixed > 0 ? (
        <p className="text-ink-200 font-prose border-ink-500 border-t px-4 py-3 text-[11px] leading-4">
          A day with two WHOOP cycles can hold two answers to one question. When
          they disagree the day counts as yes (it happened at least once that
          day) and its grid mark is split.
        </p>
      ) : null}
    </Card>
  );
}
