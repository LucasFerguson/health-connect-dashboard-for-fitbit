/**
 * Per-metric copy, colors, chart type and value formatter for the four metric
 * detail pages (steps, calories, resting heart rate, weight), keyed by
 * `MetricKind`.
 */
import {
  formatCalories,
  formatHeartRate,
  formatSteps,
  formatWeight,
} from "./metricFormatters";

export type MetricKind = "steps" | "calories" | "heart-rate" | "weight";

interface MetricPresentation {
  title: string;
  eyebrow: string;
  description: string;
  color: string;
  chartType: "bar" | "line";
  formatValue: (value: number) => string;
}

const presentations: Record<MetricKind, MetricPresentation> = {
  steps: {
    title: "Steps",
    eyebrow: "Daily movement",
    description:
      "See your daily movement pattern, consistency, and longer-term direction.",
    color: "#a78bfa",
    chartType: "bar",
    formatValue: formatSteps,
  },
  calories: {
    title: "Calories",
    eyebrow: "Daily energy",
    description:
      "Compare active energy with total energy and see how expenditure changes over time.",
    color: "#fb923c",
    chartType: "bar",
    formatValue: formatCalories,
  },
  "heart-rate": {
    title: "Resting heart rate",
    eyebrow: "Cardiovascular baseline",
    description:
      "Follow your resting baseline and use longer trends to distinguish signal from daily noise.",
    color: "#fb7185",
    chartType: "line",
    formatValue: formatHeartRate,
  },
  weight: {
    title: "Weight",
    eyebrow: "Body measurement",
    description:
      "Track weight in kilograms and pounds while focusing on gradual change over time.",
    color: "#2dd4bf",
    chartType: "line",
    formatValue: formatWeight,
  },
};

export function metricPresentation(kind: MetricKind): MetricPresentation {
  return presentations[kind];
}
