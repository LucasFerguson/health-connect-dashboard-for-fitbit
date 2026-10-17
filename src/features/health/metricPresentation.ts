/**
 * Per-metric copy, colors, chart type and value formatter for the metric
 * detail pages (steps, calories, resting heart rate, HRV, skin temperature,
 * weight), keyed by `MetricKind`.
 */
import {
  formatCalories,
  formatHeartRate,
  formatHrv,
  formatSteps,
  formatTemperatureDeviation,
  formatTemperatureDeviationTick,
  formatWeight,
} from "./metricFormatters";

export type MetricKind =
  | "steps"
  | "calories"
  | "heart-rate"
  | "hrv"
  | "skin-temperature"
  | "weight";

/**
 * A metric whose values are a signed deviation around zero (skin
 * temperature). Charts draw a zero baseline and color each day by sign, and
 * the heatmap shades by distance from zero instead of by magnitude.
 */
interface DivergingScale {
  /** Color for values below zero; `color` is used above it. */
  negativeColor: string;
  /** Finer-grained formatter for chart axis ticks. */
  formatTick: (value: number) => string;
  negativeLabel: string;
  positiveLabel: string;
}

interface MetricPresentation {
  title: string;
  eyebrow: string;
  description: string;
  color: string;
  chartType: "bar" | "line";
  formatValue: (value: number) => string;
  /** Shown in place of the charts when the series has no days at all. */
  emptyMessage: string;
  diverging?: DivergingScale;
}

const DEFAULT_EMPTY =
  "These visualizations will appear after measurements are available.";

const presentations: Record<MetricKind, MetricPresentation> = {
  steps: {
    title: "Steps",
    eyebrow: "Daily movement",
    description:
      "See your daily movement pattern, consistency, and longer-term direction.",
    color: "#a78bfa",
    chartType: "bar",
    formatValue: formatSteps,
    emptyMessage: DEFAULT_EMPTY,
  },
  calories: {
    title: "Calories",
    eyebrow: "Daily energy",
    description:
      "Compare active energy with total energy and see how expenditure changes over time.",
    color: "#fb923c",
    chartType: "bar",
    formatValue: formatCalories,
    emptyMessage: DEFAULT_EMPTY,
  },
  "heart-rate": {
    title: "Resting heart rate",
    eyebrow: "Cardiovascular baseline",
    description:
      "Follow your resting baseline and use longer trends to distinguish signal from daily noise.",
    color: "#fb7185",
    chartType: "line",
    formatValue: formatHeartRate,
    emptyMessage: DEFAULT_EMPTY,
  },
  hrv: {
    title: "Heart rate variability",
    eyebrow: "Overnight recovery signal",
    description:
      "Nightly HRV (RMSSD) in milliseconds. It varies a lot between people, so compare it with your own trend rather than a fixed number.",
    color: "#34d399",
    chartType: "line",
    formatValue: formatHrv,
    emptyMessage:
      "No HRV readings yet — they start arriving after the phone app v2.3.0 syncs.",
  },
  "skin-temperature": {
    title: "Skin temperature",
    eyebrow: "Nightly deviation from baseline",
    description:
      "How far each night's skin temperature sat from your own baseline, dated by the morning you woke. This is a deviation, not a body temperature: 0 is your usual, positive is warmer, negative is cooler.",
    color: "#fb923c",
    chartType: "bar",
    formatValue: formatTemperatureDeviation,
    emptyMessage:
      "No skin-temperature readings yet — they start arriving after the phone app v2.3.0 syncs.",
    diverging: {
      negativeColor: "#38bdf8",
      formatTick: formatTemperatureDeviationTick,
      negativeLabel: "Cooler",
      positiveLabel: "Warmer",
    },
  },
  weight: {
    title: "Weight",
    eyebrow: "Body measurement",
    description:
      "Track weight in kilograms and pounds while focusing on gradual change over time.",
    color: "#2dd4bf",
    chartType: "line",
    formatValue: formatWeight,
    emptyMessage: DEFAULT_EMPTY,
  },
};

export function metricPresentation(kind: MetricKind): MetricPresentation {
  return presentations[kind];
}
