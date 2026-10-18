import {
  dailyChartWindow,
  shortDateLabel,
  shortMonthLabel,
} from "~/domain/metricChartWindow";

/**
 * The parts of a daily-history ECharts option that change on a phone: a
 * recent-days opening window (full history stays reachable by dragging the
 * range control), short date ticks that don't collide, a slimmer y-axis
 * gutter, and tooltips kept inside the chart.
 */
export function dailyChartViewport(dates: readonly string[], narrow: boolean) {
  const recent = dailyChartWindow(dates, narrow);
  const window = recent ?? {};
  return {
    /** True when the chart opens on a recent window, not the full range. */
    windowed: recent !== null,
    tooltip: { confine: true },
    dataZoom: [
      {
        id: "inside",
        type: "inside",
        // On a touchscreen the inside zoom captures the swipe that should
        // scroll the page; the slider below is the range control there.
        disabled: narrow,
        ...window,
      },
      {
        id: "slider",
        type: "slider",
        height: narrow ? 24 : 18,
        bottom: 4,
        ...window,
        ...(narrow ? { labelFormatter: dateLabelFormatter(dates) } : {}),
      },
    ],
    xAxisLabel: {
      color: "#94a3b8",
      hideOverlap: true,
      ...(narrow ? { formatter: shortDateLabel, fontSize: 11 } : {}),
    },
    yAxisLabelSize: narrow ? { fontSize: 11 } : {},
    gridLeft: narrow ? 44 : undefined,
    gridBottom: narrow ? 50 : undefined,
  };
}

/** Monthly charts: shorter month ticks and confined tooltips on a phone. */
export function monthlyChartViewport(narrow: boolean) {
  return {
    tooltip: { confine: true },
    xAxisLabel: {
      color: "#94a3b8",
      hideOverlap: true,
      ...(narrow ? { formatter: shortMonthLabel, fontSize: 11 } : {}),
    },
    yAxisLabelSize: narrow ? { fontSize: 11 } : {},
    gridLeft: narrow ? 44 : undefined,
  };
}

/** The slider's handle labels get the category index; show a short date. */
function dateLabelFormatter(dates: readonly string[]) {
  return (value: number | string) => {
    const date = typeof value === "number" ? dates[value] : value;
    return date ? shortDateLabel(date) : "";
  };
}
