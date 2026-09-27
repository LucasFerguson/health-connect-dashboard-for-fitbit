"use client";

import { useMemo } from "react";
import { LazyECharts } from "~/components/ui/LazyECharts";
import { indexByDate, shiftDate, type DailyValue } from "~/domain/correlation";
import type { DateKey } from "~/domain/health";
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

/** Every date from `from` to `to`, inclusive. */
function dateSpan(from: DateKey, to: DateKey): DateKey[] {
  const dates: DateKey[] = [];
  for (let date = from; date <= to; date = shiftDate(date, 1)) dates.push(date);
  return dates;
}

/**
 * Both series on one date axis, each against its own y-axis and unit. With a
 * lag, Y is drawn shifted: the Y point above date d is Y's reading from
 * d + lag, so the two lines line up exactly as the scatter pairs them.
 * Missing days are gaps, not zeros.
 */
export function ExploreLineChart({
  x,
  y,
  xSeries,
  ySeries,
  lag,
  window,
}: {
  x: MetricDefinition;
  y: MetricDefinition;
  xSeries: DailyValue[];
  ySeries: DailyValue[];
  lag: number;
  window: { from: DateKey | null; to: DateKey };
}) {
  const option = useMemo(() => {
    const xByDate = indexByDate(xSeries);
    const yByDate = indexByDate(ySeries);
    // Unbounded ("all"): start at the first day either series has.
    const earliest = [
      xSeries[0]?.date,
      ySeries[0] ? shiftDate(ySeries[0].date, -lag) : undefined,
    ]
      .filter((date): date is DateKey => date !== undefined)
      .sort()[0];
    const from = window.from ?? earliest ?? window.to;
    const dates = dateSpan(from, window.to);
    const xData = dates.map((date) => xByDate.get(date) ?? null);
    const yData = dates.map(
      (date) => yByDate.get(shiftDate(date, lag)) ?? null,
    );
    // Axis names would collide at phone width, so the legend carries each
    // series' name, unit and side instead; the axes are tinted to match.
    const xName = `← ${metricAxisName(x)}`;
    const yName = `${metricAxisName(y)}${
      lag === 0 ? "" : ` · ${lag > 0 ? "+" : "−"}${Math.abs(lag)}d`
    } →`;

    return {
      animation: false,
      textStyle: { fontFamily: CHART_FONT },
      grid: { top: 52, right: 8, bottom: 64, left: 8, containLabel: true },
      legend: {
        top: 0,
        left: 0,
        itemWidth: 14,
        itemHeight: 3,
        textStyle: {
          color: EXPLORE_COLORS.tooltipText,
          fontFamily: CHART_FONT,
          fontSize: 10,
        },
      },
      tooltip: {
        ...tooltipBase,
        trigger: "axis",
        axisPointer: {
          type: "line",
          lineStyle: { color: EXPLORE_COLORS.axisText, type: "dashed" },
        },
        formatter: (
          params: { dataIndex: number; seriesIndex: number; color: string }[],
        ) => {
          const index = params[0]?.dataIndex;
          if (index === undefined) return "";
          const date = dates[index]!;
          const dim = `color:${EXPLORE_COLORS.tooltipDim}`;
          const row = (
            color: string,
            metric: MetricDefinition,
            value: number | null,
            note?: string,
          ) =>
            `<div><span style="display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;background:${color}"></span>` +
            `<span style="${dim}">${escapeHtml(metric.label)}:</span> ` +
            `${value === null ? `<span style="${dim}">no data</span>` : escapeHtml(formatMetricValue(metric, value))}` +
            `${note ? ` <span style="${dim}">(${escapeHtml(note)})</span>` : ""}</div>`;
          return [
            `<div style="margin-bottom:4px">${escapeHtml(formatDateKey(date))}</div>`,
            row(EXPLORE_COLORS.x, x, xData[index] ?? null),
            row(
              EXPLORE_COLORS.y,
              y,
              yData[index] ?? null,
              lag === 0 ? undefined : formatDateKey(shiftDate(date, lag)),
            ),
          ].join("");
        },
      },
      dataZoom: [
        { type: "inside" },
        {
          type: "slider",
          height: 18,
          bottom: 8,
          borderColor: EXPLORE_COLORS.axisLine,
          fillerColor: "rgba(169, 123, 255, 0.15)",
          handleStyle: { color: EXPLORE_COLORS.point },
          textStyle: { color: EXPLORE_COLORS.axisText, fontSize: 9 },
          dataBackground: {
            lineStyle: { color: EXPLORE_COLORS.axisLine },
            areaStyle: { color: "rgba(48, 40, 66, 0.4)" },
          },
        },
      ],
      xAxis: {
        type: "category",
        data: dates,
        boundaryGap: false,
        ...axisStyle(),
        splitLine: { show: false },
        axisLabel: {
          ...axisStyle().axisLabel,
          formatter: (date: string) => date.slice(5),
        },
      },
      yAxis: [
        {
          type: "value",
          scale: true,
          position: "left",
          ...axisStyle(EXPLORE_COLORS.x),
          ...minuteAxisBounds(x, xData),
          axisLine: { show: true, lineStyle: { color: EXPLORE_COLORS.x } },
          axisLabel: {
            ...axisStyle().axisLabel,
            color: EXPLORE_COLORS.x,
            formatter: (value: number) => formatMetricAxis(x, value),
          },
        },
        {
          type: "value",
          scale: true,
          position: "right",
          ...axisStyle(EXPLORE_COLORS.y),
          ...minuteAxisBounds(y, yData),
          splitLine: { show: false },
          axisLine: { show: true, lineStyle: { color: EXPLORE_COLORS.y } },
          axisLabel: {
            ...axisStyle().axisLabel,
            color: EXPLORE_COLORS.y,
            formatter: (value: number) => formatMetricAxis(y, value),
          },
        },
      ],
      series: [
        {
          type: "line",
          name: xName,
          yAxisIndex: 0,
          data: xData,
          connectNulls: false,
          showSymbol: true,
          symbolSize: 4,
          itemStyle: { color: EXPLORE_COLORS.x },
          lineStyle: { color: EXPLORE_COLORS.x, width: 2 },
        },
        {
          type: "line",
          name: yName,
          yAxisIndex: 1,
          data: yData,
          connectNulls: false,
          showSymbol: true,
          symbolSize: 4,
          itemStyle: { color: EXPLORE_COLORS.y },
          lineStyle: { color: EXPLORE_COLORS.y, width: 2 },
        },
      ],
    };
  }, [x, y, xSeries, ySeries, lag, window]);

  return (
    <div
      className="h-[380px] w-full sm:h-[480px]"
      role="img"
      aria-label={`Line chart of ${x.label} and ${y.label} over time, each on its own axis`}
    >
      <LazyECharts
        option={option}
        notMerge
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
