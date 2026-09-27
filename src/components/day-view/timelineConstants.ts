/** Shared geometry/color constants for the 24-hour timeline lanes, lifted
 * out of the design spec so every lane agrees on the same numbers. */

/** HR lane y-scale, bpm. Top of the lane is `HR_SCALE_MAX`. */
export const HR_SCALE_MIN = 40;
export const HR_SCALE_MAX = 180;

/** The six-stop HR intensity ramp, low to high. The cut points in the
 * design mock (`<60`, `60-95`, ...) are explicitly flagged as placeholders
 * that should come from the user's LT2 zone thresholds — since that config
 * doesn't exist yet, this app doesn't render candles at all (see
 * HeartRateLane), but the ramp itself is still used for the legend swatch. */
export const HR_RAMP = [
  "var(--color-hr-1)",
  "var(--color-hr-2)",
  "var(--color-hr-3)",
  "var(--color-hr-4)",
  "var(--color-hr-5)",
  "var(--color-hr-6)",
];

/** Converts a bpm value to a top-offset percentage within the HR lane
 * (0% = top = HR_SCALE_MAX, 100% = bottom = HR_SCALE_MIN). */
export function bpmToLanePercent(bpm: number): number {
  const clamped = Math.min(HR_SCALE_MAX, Math.max(HR_SCALE_MIN, bpm));
  return 100 - ((clamped - HR_SCALE_MIN) / (HR_SCALE_MAX - HR_SCALE_MIN)) * 100;
}

export type RenderedSleepStage = "awake" | "rem" | "light" | "deep";

/** Sleep-stage lane geometry: one horizontal row per stage, top to bottom
 * in `SLEEP_STAGE_ROWS` order, so depth reads downward like a hypnogram.
 * The gutter uses the same numbers to line its row labels up. */
export const SLEEP_STAGE_ROW_HEIGHT_PX = 24;
/** Vertical inset of a stage bar inside its row, px (top and bottom). */
export const SLEEP_STAGE_BAR_INSET_PX = 3;
export const SLEEP_STAGE_ROWS: RenderedSleepStage[] = [
  "awake",
  "rem",
  "light",
  "deep",
];
export const SLEEP_LANE_HEIGHT_PX =
  SLEEP_STAGE_ROW_HEIGHT_PX * SLEEP_STAGE_ROWS.length;

export const SLEEP_STAGE_STYLE: Record<
  RenderedSleepStage,
  { label: string; color: string }
> = {
  awake: { label: "AWAKE", color: "var(--color-ink-300)" },
  rem: { label: "REM", color: "var(--color-sleep)" },
  light: { label: "LIGHT", color: "var(--color-sleep-light)" },
  deep: { label: "DEEP", color: "var(--color-sleep-deep)" },
};

/** Top offset (px) of `stage`'s row within the sleep lane. */
export function sleepStageRowTopPx(stage: RenderedSleepStage): number {
  return SLEEP_STAGE_ROWS.indexOf(stage) * SLEEP_STAGE_ROW_HEIGHT_PX;
}

/** Axis slots (hours from the axis start) that get an x-axis label: every
 * second hour, 0-22. The label text comes from `slotHourLabel`. */
export const X_AXIS_LABEL_SLOTS = Array.from(
  { length: 12 },
  (_, index) => index * 2,
);
