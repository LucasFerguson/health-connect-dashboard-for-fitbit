"use client";

import { clsx } from "clsx";
import { useMemo } from "react";
import { Card } from "~/components/ui/Card";
import { Label } from "~/components/ui/Label";
import { Spinner } from "~/components/ui/Spinner";
import { notchStyle } from "~/components/ui/notch";
import {
  MIN_GROUP,
  compareGroups,
  crossTabulate,
  type CorrelationSummary,
  type GroupStats,
  type Pair,
} from "~/domain/correlation";
import {
  describeDifference,
  formatMetricDelta,
  formatMetricValue,
  type MetricDefinition,
} from "~/domain/exploreMetrics";
import { EXPLORE_RANGES, type ExploreRange } from "~/domain/exploreParams";
import { formatDateSpan } from "~/domain/habits";
import { EXPLORE_COLORS } from "./chartTheme";
import { Stat, formatR, yPhrase } from "./ExploreStat";

const capitalize = (text: string) =>
  text ? text[0]!.toUpperCase() + text.slice(1) : text;

const days = (n: number) => (n === 1 ? "the day" : `${n} days`);

/**
 * Which axis holds the habit, and phrases for "when you answered yes"
 * that keep the lag's meaning. The lag always reads Y on day d + lag, so:
 *
 * - habit on X: the other metric is Y, read `lag` days after the answer
 *   ("sleep duration the next day … when you answered yes").
 * - habit on Y: the answer is read `lag` days after the other metric
 *   ("steps … the day before you answered yes").
 */
function habitFraming(x: MetricDefinition, y: MetricDefinition, lag: number) {
  const habitOnX = x.kind === "binary";
  const habit = habitOnX ? x : y;
  const other = habitOnX ? y : x;
  const quote = `“${habit.label}”`;
  const subject = habitOnX ? capitalize(yPhrase(y, lag)) : x.label;
  /** `short` drops the question, for the second half of a sentence that
   * has already named it. */
  const when = (answer: "yes" | "no", short = false) => {
    const to = short ? "" : ` to ${quote}`;
    if (habitOnX) return `when you answered ${answer}${to}`;
    if (lag === 0) return `on days you answered ${answer}${to}`;
    return lag > 0
      ? `${days(lag)} before you answered ${answer}${to}`
      : `${days(-lag)} after you answered ${answer}${to}`;
  };
  return {
    habitAxis: habitOnX ? ("x" as const) : ("y" as const),
    habit,
    other,
    subject,
    when,
  };
}

function SmallSampleWarning({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="note"
      className="border-caution bg-caution-fill text-caution-text font-prose mt-3 border-l-2 px-3 py-2 text-sm"
    >
      <strong className="font-semibold">Very few days. </strong>
      {children}
    </div>
  );
}

function chanceNote(summary: CorrelationSummary) {
  const interval = summary.pearsonInterval;
  if (!interval) return "";
  return interval.low < 0 && interval.high > 0
    ? ` The 95% interval for r (${formatR(interval.low)} … ${formatR(interval.high)}) includes zero, so this difference is consistent with chance.`
    : "";
}

/**
 * The headline for a habit against a number: the other metric's mean and
 * median on yes days vs no days, and the difference in its own units. The
 * point-biserial r (Pearson's r with one side 0/1) stays as a secondary
 * tile; the difference in real units is what reads.
 */
export function GroupComparisonView({
  x,
  y,
  pairs,
  summary,
  lag,
  className,
}: {
  x: MetricDefinition;
  y: MetricDefinition;
  pairs: Pair[];
  summary: CorrelationSummary;
  lag: number;
  className?: string;
}) {
  const framing = habitFraming(x, y, lag);
  const comparison = useMemo(
    () => compareGroups(pairs, framing.habitAxis),
    [pairs, framing.habitAxis],
  );
  const { yes, no, meanDifference, medianDifference } = comparison;
  const { other, subject, when } = framing;
  const value = (stats: GroupStats | null, key: "mean" | "median") =>
    stats ? formatMetricValue(other, stats[key]) : "—";
  const smallest = Math.min(yes?.n ?? 0, no?.n ?? 0);
  const fewer = (yes?.n ?? 0) <= (no?.n ?? 0) ? "yes" : "no";

  let headline: React.ReactNode;
  if (!yes && !no) {
    headline = (
      <>
        No days have both metrics in this range, so there is nothing to compare.
      </>
    );
  } else if (!yes || !no) {
    headline = (
      <>
        Every paired day was a {yes ? "yes" : "no"}, so there are no{" "}
        {yes ? "“no”" : "“yes”"} days to compare against.
      </>
    );
  } else {
    const { amount, word } = describeDifference(other, meanDifference ?? 0);
    headline = (
      <>
        <strong className="text-ink-0 font-semibold">
          {subject} was {word ? `${amount} ${word}` : "the same on average"}
        </strong>{" "}
        {when("yes")} (average {value(yes, "mean")}, {yes.n} day
        {yes.n === 1 ? "" : "s"}) than {when("no", true)} (average{" "}
        {value(no, "mean")}, {no.n} day{no.n === 1 ? "" : "s"}).
      </>
    );
  }

  return (
    <section aria-label="Group comparison" className={className}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={`YES DAYS · n ${yes?.n ?? 0}`}
          value={value(yes, "mean")}
          caption={yes ? `MEAN · MEDIAN ${value(yes, "median")}` : "NONE"}
        />
        <Stat
          label={`NO DAYS · n ${no?.n ?? 0}`}
          value={value(no, "mean")}
          caption={no ? `MEAN · MEDIAN ${value(no, "median")}` : "NONE"}
        />
        <Stat
          label="DIFFERENCE · YES − NO"
          accent={EXPLORE_COLORS.point}
          value={
            meanDifference === null
              ? "—"
              : formatMetricDelta(other, meanDifference)
          }
          caption={
            medianDifference === null
              ? undefined
              : `MEDIANS ${formatMetricDelta(other, medianDifference)}`
          }
        />
        <Stat
          label="POINT-BISERIAL r"
          value={formatR(summary.pearson)}
          caption={
            summary.pearsonInterval
              ? `95% CI ${formatR(summary.pearsonInterval.low)} … ${formatR(summary.pearsonInterval.high)}`
              : "PEARSON ON 0/1"
          }
        />
      </div>
      <p className="text-ink-50 font-prose mt-3 text-sm">{headline}</p>
      {yes && no && smallest < MIN_GROUP ? (
        <SmallSampleWarning>
          Only {smallest} “{fewer}” day{smallest === 1 ? "" : "s"}. With this
          few, one unusual day can move an average a long way: treat this as an
          anecdote, not a pattern.
        </SmallSampleWarning>
      ) : null}
      <p className="text-ink-100 font-prose mt-2 text-xs leading-5">
        This compares averages across the days you happened to answer; it
        doesn’t show that one causes the other, and the days you journal may not
        be typical days.{chanceNote(summary)} Days with no answer are left out,
        never counted as “no”.
      </p>
    </section>
  );
}

/** Habit vs habit: a 2×2 count table, with row percentages and φ (Pearson
 * on two 0/1 series). */
export function HabitCrossTab({
  x,
  y,
  pairs,
  summary,
  lag,
}: {
  x: MetricDefinition;
  y: MetricDefinition;
  pairs: Pair[];
  summary: CorrelationSummary;
  lag: number;
}) {
  const table = useMemo(() => crossTabulate(pairs), [pairs]);
  const yesRow = table.yesYes + table.yesNo;
  const noRow = table.noYes + table.noNo;
  const percent = (count: number, total: number) =>
    total === 0 ? "—" : `${Math.round((count / total) * 100)}%`;
  const smallest = Math.min(yesRow, noRow);
  const yLabel = yPhrase(y, lag);

  const cell = (count: number, total: number) => (
    <td className="border-ink-500 border p-3 text-center">
      <div className="text-ink-0 font-mono text-[26px] leading-none font-bold">
        {count}
      </div>
      <div className="text-ink-200 mt-1 font-mono text-[10px]">
        {percent(count, total)} OF ROW
      </div>
    </td>
  );
  const head =
    "text-ink-100 border-ink-500 border p-2 font-mono text-[10px] tracking-[.06em]";

  return (
    <section aria-label="Two-by-two table" className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse">
          <caption className="text-ink-100 font-prose mb-2 text-left text-xs">
            Rows: {`“${x.label}”`}. Columns: {yLabel}. {table.n} paired day
            {table.n === 1 ? "" : "s"}.
          </caption>
          <thead>
            <tr>
              <th className={head} />
              <th scope="col" className={head}>
                Y YES
              </th>
              <th scope="col" className={head}>
                Y NO
              </th>
              <th scope="col" className={head}>
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className={clsx(head, "text-left")}>
                X YES
              </th>
              {cell(table.yesYes, yesRow)}
              {cell(table.yesNo, yesRow)}
              <td className={clsx(head, "text-center")}>{yesRow}</td>
            </tr>
            <tr>
              <th scope="row" className={clsx(head, "text-left")}>
                X NO
              </th>
              {cell(table.noYes, noRow)}
              {cell(table.noNo, noRow)}
              <td className={clsx(head, "text-center")}>{noRow}</td>
            </tr>
            <tr>
              <th scope="row" className={clsx(head, "text-left")}>
                TOTAL
              </th>
              <td className={clsx(head, "text-center")}>
                {table.yesYes + table.noYes}
              </td>
              <td className={clsx(head, "text-center")}>
                {table.yesNo + table.noNo}
              </td>
              <td className={clsx(head, "text-center")}>{table.n}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-ink-50 font-prose text-sm">
        When you answered yes to “{x.label}”, you answered yes to {yLabel} on{" "}
        <strong className="text-ink-0 font-semibold">
          {table.yesYes} of {yesRow}
        </strong>{" "}
        days ({percent(table.yesYes, yesRow)}); when you answered no,{" "}
        <strong className="text-ink-0 font-semibold">
          {table.noYes} of {noRow}
        </strong>{" "}
        ({percent(table.noYes, noRow)}). φ (Pearson on the two yes/no series) ={" "}
        {formatR(summary.pearson)}.
      </p>
      {smallest < MIN_GROUP ? (
        <SmallSampleWarning>
          One row has only {smallest} day{smallest === 1 ? "" : "s"}, so its
          percentage can swing by{" "}
          {smallest > 0 ? Math.round(100 / smallest) : 100} points on a single
          answer.
        </SmallSampleWarning>
      ) : null}
      <p className="text-ink-100 font-prose text-xs leading-5">
        Counts of days where both questions were answered.{chanceNote(summary)}{" "}
        Days missing either answer are left out.
      </p>
    </section>
  );
}

/**
 * A habit with no answers in the selected window. Habits span a short
 * stretch (Jan 9 – Apr 8, 2026 in the live data), so the default 90-day
 * window holds none of them. Rather than silently widening the range (which
 * would change a shared link's meaning and refetch without being asked),
 * say where the answers are and offer the one-click fix.
 */
export function HabitOutOfRange({
  habit,
  range,
  loading,
  onShowAll,
}: {
  habit: MetricDefinition;
  range: ExploreRange;
  loading: boolean;
  onShowAll: () => void;
}) {
  const span = habit.answerSpan;
  const rangeLabel =
    EXPLORE_RANGES.find((option) => option.key === range)?.label ?? range;
  return (
    <Card className="mt-0" padding="p-5" topAccent="var(--color-caution)">
      <Label className="text-caution-text">
        NO HABIT ANSWERS IN THIS RANGE
      </Label>
      <p className="text-ink-0 font-prose mt-2 text-base">
        No answers to “{habit.label}”{" "}
        {range === "all" ? "at all" : `in the ${rangeLabel} range`}
        {span ? ` (answers span ${formatDateSpan(span.from, span.to)})` : ""}.
      </p>
      <p className="text-ink-100 font-prose mt-1 text-sm">
        Nothing to compare yet: an empty chart here would only mean the range
        misses the answers.
      </p>
      {range !== "all" && span ? (
        <button
          type="button"
          onClick={onShowAll}
          className="bg-brand-500 text-ink-0 hover:bg-brand-400 mt-4 inline-flex h-9 items-center gap-2 px-4 font-mono text-[11px] tracking-[.06em]"
          style={notchStyle(8)}
        >
          SHOW ALL
          {loading ? <Spinner size={11} color="currentColor" /> : null}
        </button>
      ) : null}
    </Card>
  );
}
