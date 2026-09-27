"use client";

import { useMemo } from "react";
import { LazyECharts } from "~/components/ui/LazyECharts";
import {
  compareGroups,
  type GroupStats,
  type Pair,
} from "~/domain/correlation";
import {
  formatMetricAxis,
  formatMetricValue,
  metricAxisName,
  type MetricDefinition,
} from "~/domain/exploreMetrics";
import {
  CHART_FONT,
  EXPLORE_COLORS,
  axisStyle,
  escapeHtml,
  formatDateKey,
  minuteAxisBounds,
  tooltipBase,
} from "./chartTheme";

/** The grid's neutral answer inks (`--color-ink-50` / `--color-ink-100`):
 * yes is a filled dot, no a hollow ring, the same shape language as
 * `/habits`, and neither reads as good or bad. */
const YES_INK = "#dcd7e7";
const NO_INK = "#b6b0c7";

/** Stable jitter in [-0.18, 0.18] from the date, so points don't dance
 * between renders and the same day sits in the same place across lags. */
function jitter(date: string) {
  let hash = 2166136261;
  for (let i = 0; i < date.length; i++) {
    hash ^= date.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (((hash >>> 0) % 1000) / 1000 - 0.5) * 0.36;
}

const STAT_ROWS: [string, Exclude<keyof GroupStats, "n">][] = [
  ["mean", "mean"],
  ["median", "median"],
  ["25th pct", "q1"],
  ["75th pct", "q3"],
  ["min", "min"],
  ["max", "max"],
];

interface PointDatum {
  value: [number, number];
  date: string;
  yDate: string;
  answer: "yes" | "no";
  itemStyle: Record<string, unknown>;
}

/**
 * A habit against a number: the number on the vertical axis, one column
 * per answer. Each day is a jittered dot, the box spans the quartiles with
 * the median line and whiskers to min/max, and a diamond marks the mean.
 *
 * Two x-axes share the plot: a category axis for the boxes, and a hidden
 * value axis from −0.5 to 1.5 whose 0 and 1 land exactly on the two
 * category centres, so the jittered dots can sit around them.
 */
export function ExploreGroupChart({
  x,
  y,
  pairs,
  lag,
}: {
  x: MetricDefinition;
  y: MetricDefinition;
  pairs: Pair[];
  lag: number;
}) {
  const habitOnX = x.kind === "binary";
  const habit = habitOnX ? x : y;
  const other = habitOnX ? y : x;

  const option = useMemo(() => {
    const { yes, no } = compareGroups(pairs, habitOnX ? "x" : "y");
    const points: PointDatum[] = pairs.map((pair) => {
      const answer = (habitOnX ? pair.x : pair.y) === 1 ? "yes" : "no";
      const value = habitOnX ? pair.y : pair.x;
      return {
        value: [(answer === "yes" ? 1 : 0) + jitter(pair.date), value],
        date: pair.date,
        yDate: pair.yDate,
        answer,
        itemStyle:
          answer === "yes"
            ? { color: YES_INK, borderColor: "#15121c", borderWidth: 1 }
            : { color: "transparent", borderColor: NO_INK, borderWidth: 1.5 },
      };
    });
    const box = (stats: GroupStats | null) =>
      stats ? [stats.min, stats.q1, stats.median, stats.q3, stats.max] : [];
    const lagNote =
      lag === 0 ? "" : ` · ${lag > 0 ? "+" : "−"}${Math.abs(lag)}d`;
    const answerLabel = (answer: "yes" | "no", stats: GroupStats | null) =>
      `${answer.toUpperCase()} · n ${stats?.n ?? 0}`;
    const dim = `color:${EXPLORE_COLORS.tooltipDim}`;
    const statsTip = (answer: "yes" | "no", stats: GroupStats | null) =>
      stats
        ? [
            `<div style="margin-bottom:4px">${answer === "yes" ? "Yes" : "No"} days · ${stats.n}</div>`,
            STAT_ROWS.map(
              ([label, key]) =>
                `<div><span style="${dim}">${label}:</span> ${escapeHtml(
                  formatMetricValue(other, stats[key]),
                )}</div>`,
            ).join(""),
          ].join("")
        : "";

    return {
      animation: false,
      textStyle: { fontFamily: CHART_FONT },
      grid: { top: 36, right: 16, bottom: 44, left: 16, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: "item",
        formatter: (params: {
          seriesName: string;
          dataIndex: number;
          data: PointDatum;
        }) => {
          if (params.seriesName === "Days") {
            const { date, yDate, answer, value } = params.data;
            const answerDate = habitOnX ? date : yDate;
            const otherDate = habitOnX ? yDate : date;
            return [
              `<div style="margin-bottom:4px">${escapeHtml(formatDateKey(otherDate))}</div>`,
              `<div><span style="${dim}">${escapeHtml(other.label)}:</span> ${escapeHtml(formatMetricValue(other, value[1]))}</div>`,
              `<div><span style="${dim}">${escapeHtml(habit.label)}</span> ${answer === "yes" ? "Yes" : "No"}${
                answerDate !== otherDate
                  ? ` <span style="${dim}">(${escapeHtml(formatDateKey(answerDate))})</span>`
                  : ""
              }</div>`,
            ].join("");
          }
          const answer = params.dataIndex === 1 ? "yes" : "no";
          return statsTip(answer, answer === "yes" ? yes : no);
        },
      },
      xAxis: [
        {
          type: "category",
          data: [answerLabel("no", no), answerLabel("yes", yes)],
          name: `${habit.label}${habitOnX ? "" : lagNote}`,
          nameLocation: "middle",
          nameGap: 28,
          ...axisStyle(),
          splitLine: { show: false },
          axisTick: { show: false },
        },
        { type: "value", min: -0.5, max: 1.5, show: false },
      ],
      yAxis: {
        type: "value",
        scale: true,
        name: `${metricAxisName(other)}${habitOnX ? lagNote : ""}`,
        nameLocation: "end",
        nameGap: 14,
        ...axisStyle(),
        ...minuteAxisBounds(
          other,
          points.map((point) => point.value[1]),
        ),
        nameTextStyle: { ...axisStyle().nameTextStyle, align: "left" },
        // Otherwise the axis line snaps to the hidden jitter axis's zero,
        // which is the "No" column's centre.
        axisLine: { ...axisStyle().axisLine, onZero: false },
        axisLabel: {
          ...axisStyle().axisLabel,
          formatter: (value: number) => formatMetricAxis(other, value),
        },
      },
      series: [
        {
          type: "boxplot",
          name: "Quartiles",
          xAxisIndex: 0,
          data: [box(no), box(yes)],
          boxWidth: ["18%", "26%"],
          itemStyle: {
            color: "rgba(169, 123, 255, 0.07)",
            borderColor: EXPLORE_COLORS.axisText,
            borderWidth: 1.5,
          },
          emphasis: { disabled: true },
          z: 1,
        },
        {
          type: "scatter",
          name: "Days",
          xAxisIndex: 1,
          data: points,
          symbolSize: 8,
          emphasis: { scale: 1.5 },
          z: 3,
        },
        {
          type: "scatter",
          name: "Mean",
          xAxisIndex: 1,
          silent: true,
          symbol: "diamond",
          symbolSize: 15,
          data: [
            ...(no ? [[0, no.mean]] : []),
            ...(yes ? [[1, yes.mean]] : []),
          ],
          itemStyle: {
            color: EXPLORE_COLORS.point,
            borderColor: "#15121c",
            borderWidth: 1.5,
          },
          z: 4,
        },
      ],
    };
  }, [pairs, habitOnX, habit, other, lag]);

  return (
    <div>
      <div
        className="h-[360px] w-full sm:h-[440px]"
        role="img"
        aria-label={`${other.label} on days answered yes versus no to ${habit.label}, one dot per day, with quartile boxes and means`}
      >
        <LazyECharts
          option={option}
          notMerge
          style={{ height: "100%", width: "100%" }}
        />
      </div>
      <div className="text-ink-100 mt-2 flex flex-wrap gap-x-5 gap-y-1 px-1 font-mono text-[10px] tracking-[.06em]">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="block size-2 rounded-full"
            style={{ background: YES_INK }}
          />
          YES DAY
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="block size-2 rounded-full border-[1.5px]"
            style={{ borderColor: NO_INK }}
          />
          NO DAY
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="block size-2 rotate-45"
            style={{ background: EXPLORE_COLORS.point }}
          />
          MEAN
        </span>
        <span>BOX: MEDIAN AND MIDDLE HALF · WHISKERS: MIN–MAX</span>
      </div>
    </div>
  );
}
