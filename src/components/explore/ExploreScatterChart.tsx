"use client";

import { useMemo } from "react";
import { LazyECharts } from "~/components/ui/LazyECharts";
import type { CorrelationSummary, Pair } from "~/domain/correlation";
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

interface ScatterDatum {
  value: [number, number];
  date: string;
  yDate: string;
}

export function ExploreScatterChart({
  x,
  y,
  pairs,
  summary,
}: {
  x: MetricDefinition;
  y: MetricDefinition;
  pairs: Pair[];
  summary: CorrelationSummary;
}) {
  const option = useMemo(() => {
    const data: ScatterDatum[] = pairs.map((pair) => ({
      value: [pair.x, pair.y],
      date: pair.date,
      yDate: pair.yDate,
    }));
    const { regression, xExtent } = summary;
    const trend =
      regression && xExtent
        ? [
            [
              xExtent.min,
              regression.intercept + regression.slope * xExtent.min,
            ],
            [
              xExtent.max,
              regression.intercept + regression.slope * xExtent.max,
            ],
          ]
        : [];

    return {
      animation: false,
      textStyle: { fontFamily: CHART_FONT },
      grid: { top: 36, right: 20, bottom: 44, left: 16, containLabel: true },
      tooltip: {
        ...tooltipBase,
        trigger: "item",
        formatter: (params: { seriesType: string; data: ScatterDatum }) => {
          if (params.seriesType !== "scatter") return "";
          const { value, date, yDate } = params.data;
          const lagged = date !== yDate;
          const dim = `color:${EXPLORE_COLORS.tooltipDim}`;
          return [
            `<div style="margin-bottom:4px">${escapeHtml(formatDateKey(date))}</div>`,
            `<div><span style="${dim}">${escapeHtml(x.label)}:</span> ${escapeHtml(formatMetricValue(x, value[0]))}</div>`,
            `<div><span style="${dim}">${escapeHtml(y.label)}:</span> ${escapeHtml(formatMetricValue(y, value[1]))}${
              lagged
                ? ` <span style="${dim}">(${escapeHtml(formatDateKey(yDate))})</span>`
                : ""
            }</div>`,
          ].join("");
        },
      },
      xAxis: {
        type: "value",
        scale: true,
        name: metricAxisName(x),
        nameLocation: "middle",
        nameGap: 28,
        ...axisStyle(),
        ...minuteAxisBounds(
          x,
          pairs.map((pair) => pair.x),
        ),
        axisLabel: {
          ...axisStyle().axisLabel,
          formatter: (value: number) => formatMetricAxis(x, value),
        },
      },
      yAxis: {
        type: "value",
        scale: true,
        name: metricAxisName(y),
        nameLocation: "end",
        nameGap: 14,
        ...axisStyle(),
        ...minuteAxisBounds(
          y,
          pairs.map((pair) => pair.y),
        ),
        nameTextStyle: {
          ...axisStyle().nameTextStyle,
          align: "left",
        },
        axisLabel: {
          ...axisStyle().axisLabel,
          formatter: (value: number) => formatMetricAxis(y, value),
        },
      },
      series: [
        {
          type: "scatter",
          name: "Days",
          data,
          symbolSize: 8,
          itemStyle: {
            color: EXPLORE_COLORS.point,
            opacity: 0.7,
            borderColor: "#15121c",
            borderWidth: 1,
          },
          emphasis: {
            scale: 1.5,
            itemStyle: { opacity: 1, borderColor: EXPLORE_COLORS.trend },
          },
        },
        {
          type: "line",
          name: "Least-squares trend",
          data: trend,
          symbol: "none",
          silent: true,
          lineStyle: { color: EXPLORE_COLORS.trend, width: 2, opacity: 0.85 },
          z: 3,
        },
      ],
    };
  }, [x, y, pairs, summary]);

  return (
    <div
      className="h-[360px] w-full sm:h-[480px]"
      role="img"
      aria-label={`Scatter plot of ${y.label} against ${x.label}, ${pairs.length} days, with a least-squares trend line`}
    >
      <LazyECharts
        option={option}
        notMerge
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}
