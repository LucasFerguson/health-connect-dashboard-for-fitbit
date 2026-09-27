/**
 * The `/explore` metric catalog: every daily series the correlation explorer
 * can put on an axis, with its label, unit and formatters.
 *
 * Values arrive already prepared by HCGateway (see
 * `server/health/adapters/exploreAdapter.ts`); nothing here derives a health
 * metric. The one reshaping is for bedtime, which the adapter "unwraps" past
 * midnight (00:30 becomes 24:30) so 23:30 and 00:30 sit an hour apart on an
 * axis instead of 23 hours. `formatClock` folds it back for display.
 */
import type { DailyValue } from "./correlation";

export type DailyPoint = DailyValue;

export const METRIC_IDS = [
  "steps",
  "activeCalories",
  "totalCalories",
  "zone3Minutes",
  "strain",
  "restingHeartRate",
  "heartRateVariability",
  "respiratoryRate",
  "oxygenSaturation",
  "sleepDuration",
  "sleepDebt",
  "sleepConsistency",
  "bedtime",
  "wakeTime",
  "recovery",
  "weight",
  "skinTemperature",
  "healthAge",
  "ageDelta",
  "paceOfAging",
] as const;

export type MetricId = (typeof METRIC_IDS)[number];

export type ExploreSeries = Record<MetricId, DailyPoint[]>;

export function isMetricId(value: unknown): value is MetricId {
  return (
    typeof value === "string" &&
    (METRIC_IDS as readonly string[]).includes(value)
  );
}

/**
 * How a value is written:
 * - `number`: a plain quantity with `unit` and `decimals`
 * - `duration`: minutes, written "7h 12m"
 * - `clock`: minutes after local midnight, written "11:30 PM"
 */
export type MetricKind = "number" | "duration" | "clock";

export interface MetricDefinition {
  id: MetricId;
  label: string;
  group: string;
  kind: MetricKind;
  /** Unit shown next to values and on the axis name ("" for none). */
  unit: string;
  decimals: number;
  /** The x-increment the regression slope is quoted per, e.g. "per 1,000
   * steps", so the slope reads as a real-world amount, not per single step. */
  slopeStep: number;
  /** One line on where the value comes from, shown under the picker. */
  note: string;
}

const define = (definition: MetricDefinition) => definition;

export const METRICS: Record<MetricId, MetricDefinition> = {
  steps: define({
    id: "steps",
    label: "Steps",
    group: "Activity",
    kind: "number",
    unit: "steps",
    decimals: 0,
    slopeStep: 1000,
    note: "Daily step total.",
  }),
  activeCalories: define({
    id: "activeCalories",
    label: "Active calories",
    group: "Activity",
    kind: "number",
    unit: "kcal",
    decimals: 0,
    slopeStep: 100,
    note: "Calories burned through activity.",
  }),
  totalCalories: define({
    id: "totalCalories",
    label: "Total calories",
    group: "Activity",
    kind: "number",
    unit: "kcal",
    decimals: 0,
    slopeStep: 100,
    note: "Resting plus active calories.",
  }),
  zone3Minutes: define({
    id: "zone3Minutes",
    label: "Zone 3+ minutes",
    group: "Activity",
    kind: "number",
    unit: "min",
    decimals: 0,
    slopeStep: 10,
    note: "Minutes in heart-rate zone 3 or above. Zero is a real value here.",
  }),
  strain: define({
    id: "strain",
    label: "Strain",
    group: "Activity",
    kind: "number",
    unit: "",
    decimals: 1,
    slopeStep: 1,
    note: "Daily strain score, only on days the backend marks publishable.",
  }),
  restingHeartRate: define({
    id: "restingHeartRate",
    label: "Resting heart rate",
    group: "Heart",
    kind: "number",
    unit: "bpm",
    decimals: 0,
    slopeStep: 1,
    note: "Daily resting heart rate.",
  }),
  heartRateVariability: define({
    id: "heartRateVariability",
    label: "Heart rate variability",
    group: "Heart",
    kind: "number",
    unit: "ms",
    decimals: 0,
    slopeStep: 10,
    note: "Daily HRV.",
  }),
  respiratoryRate: define({
    id: "respiratoryRate",
    label: "Respiratory rate",
    group: "Heart",
    kind: "number",
    unit: "br/min",
    decimals: 1,
    slopeStep: 1,
    note: "Breaths per minute, on days its status is available.",
  }),
  oxygenSaturation: define({
    id: "oxygenSaturation",
    label: "Blood oxygen (SpO₂)",
    group: "Heart",
    kind: "number",
    unit: "%",
    decimals: 0,
    slopeStep: 1,
    note: "Oxygen saturation, on days its status is available.",
  }),
  sleepDuration: define({
    id: "sleepDuration",
    label: "Sleep duration",
    group: "Sleep",
    kind: "duration",
    unit: "",
    decimals: 0,
    slopeStep: 60,
    note: "Time asleep, dated by the morning you woke up.",
  }),
  sleepDebt: define({
    id: "sleepDebt",
    label: "Sleep debt",
    group: "Sleep",
    kind: "duration",
    unit: "",
    decimals: 0,
    slopeStep: 60,
    note: "Shortfall against the sleep target for that night.",
  }),
  sleepConsistency: define({
    id: "sleepConsistency",
    label: "Sleep consistency",
    group: "Sleep",
    kind: "number",
    unit: "",
    decimals: 0,
    slopeStep: 10,
    note: "0–100 score for how close bed and wake times were to your baseline.",
  }),
  bedtime: define({
    id: "bedtime",
    label: "Bedtime",
    group: "Sleep",
    kind: "clock",
    unit: "",
    decimals: 0,
    slopeStep: 60,
    note: "Local clock time you fell asleep. After-midnight bedtimes count as later, not earlier.",
  }),
  wakeTime: define({
    id: "wakeTime",
    label: "Wake time",
    group: "Sleep",
    kind: "clock",
    unit: "",
    decimals: 0,
    slopeStep: 60,
    note: "Local clock time you woke up.",
  }),
  recovery: define({
    id: "recovery",
    label: "Recovery",
    group: "Recovery",
    kind: "number",
    unit: "",
    decimals: 0,
    slopeStep: 10,
    note: "0–100 recovery score. Every published value is still provisional (status “partial”).",
  }),
  weight: define({
    id: "weight",
    label: "Weight",
    group: "Body",
    kind: "number",
    unit: "kg",
    decimals: 1,
    slopeStep: 1,
    note: "Daily weight reading.",
  }),
  skinTemperature: define({
    id: "skinTemperature",
    label: "Skin temperature deviation",
    group: "Body",
    kind: "number",
    unit: "°C",
    decimals: 2,
    slopeStep: 0.1,
    note: "Deviation from your skin-temperature baseline.",
  }),
  healthAge: define({
    id: "healthAge",
    label: "Health age",
    group: "Healthspan",
    kind: "number",
    unit: "yr",
    decimals: 1,
    slopeStep: 1,
    note: "Experimental health-age estimate.",
  }),
  ageDelta: define({
    id: "ageDelta",
    label: "Health age − actual age",
    group: "Healthspan",
    kind: "number",
    unit: "yr",
    decimals: 2,
    slopeStep: 1,
    note: "Health age minus chronological age. Negative is younger.",
  }),
  paceOfAging: define({
    id: "paceOfAging",
    label: "Pace of aging",
    group: "Healthspan",
    kind: "number",
    unit: "×",
    decimals: 2,
    slopeStep: 0.1,
    note: "Health-age change per calendar year. 1× is typical.",
  }),
};

/** Catalog order, grouped, for pickers. */
export const METRIC_GROUPS: { group: string; metrics: MetricDefinition[] }[] =
  (() => {
    const groups = new Map<string, MetricDefinition[]>();
    for (const id of METRIC_IDS) {
      const metric = METRICS[id];
      groups.set(metric.group, [...(groups.get(metric.group) ?? []), metric]);
    }
    return [...groups].map(([group, metrics]) => ({ group, metrics }));
  })();

const numberFormats = new Map<number, Intl.NumberFormat>();
function numberFormat(decimals: number) {
  let format = numberFormats.get(decimals);
  if (!format) {
    format = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
    numberFormats.set(decimals, format);
  }
  return format;
}

const MINUTES_PER_DAY = 1440;

/** Minutes after local midnight as "11:30 PM". Accepts unwrapped values past
 * 24:00 (and negatives), folding them onto the clock. */
export function formatClock(minutes: number): string {
  const folded =
    ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) %
    MINUTES_PER_DAY;
  const hours24 = Math.floor(folded / 60);
  const mins = folded % 60;
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${hours24 < 12 ? "AM" : "PM"}`;
}

/** "7h 12m" / "45m" for a (possibly negative) number of minutes. */
export function formatMinutes(minutes: number): string {
  const rounded = Math.round(Math.abs(minutes));
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  const text = hours ? (mins ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`;
  return minutes < 0 && rounded > 0 ? `−${text}` : text;
}

function withUnit(text: string, unit: string) {
  if (!unit) return text;
  return unit === "%" || unit === "×" || unit === "°C"
    ? `${text}${unit}`
    : `${text} ${unit}`;
}

/** A value as it should read in a tooltip or stat. */
export function formatMetricValue(metric: MetricDefinition, value: number) {
  switch (metric.kind) {
    case "clock":
      return formatClock(value);
    case "duration":
      return formatMinutes(value);
    case "number":
      return withUnit(numberFormat(metric.decimals).format(value), metric.unit);
  }
}

/** Compact axis tick: clock times without minutes when on the hour, durations
 * in hours. */
export function formatMetricAxis(metric: MetricDefinition, value: number) {
  switch (metric.kind) {
    case "clock": {
      const text = formatClock(value);
      return text.replace(":00 ", " ");
    }
    case "duration":
      return `${numberFormat(1).format(value / 60)}h`;
    case "number":
      return numberFormat(Math.min(metric.decimals, 2)).format(value);
  }
}

/** A signed change in this metric's units, e.g. "+12m", "−1.3 bpm". */
export function formatMetricDelta(metric: MetricDefinition, delta: number) {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
  const magnitude = Math.abs(delta);
  switch (metric.kind) {
    case "clock":
    case "duration":
      return `${sign}${formatMinutes(magnitude)}`;
    case "number": {
      // One more decimal than the value itself: slopes are often small.
      const text = numberFormat(metric.decimals + 1).format(magnitude);
      return withUnit(`${sign}${text}`, metric.unit);
    }
  }
}

/** Axis name: the label plus its unit where the unit isn't implied. */
export function metricAxisName(metric: MetricDefinition) {
  if (metric.kind === "duration") return `${metric.label} (h)`;
  return metric.unit && metric.unit !== "steps"
    ? `${metric.label} (${metric.unit})`
    : metric.label;
}

/** "1,000 steps", "1h", "10 min": the x-increment a slope is quoted per. */
export function formatSlopeStep(metric: MetricDefinition) {
  if (metric.kind !== "number") return formatMinutes(metric.slopeStep);
  const unit = metric.unit || (metric.slopeStep === 1 ? "point" : "points");
  return withUnit(numberFormat(2).format(metric.slopeStep), unit);
}
