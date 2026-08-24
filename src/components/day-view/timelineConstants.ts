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

export const SLEEP_STAGE_GEOMETRY: Record<
  "awake" | "rem" | "light" | "deep",
  { topPx: number; heightPx: number; color: string }
> = {
  awake: { topPx: 2, heightPx: 5, color: "var(--color-ink-300)" },
  rem: { topPx: 8, heightPx: 8, color: "var(--color-sleep)" },
  light: { topPx: 13, heightPx: 8, color: "var(--color-sleep-light)" },
  deep: { topPx: 20, heightPx: 8, color: "var(--color-sleep-deep)" },
};

export const X_AXIS_HOUR_LABELS = [
  "00",
  "02",
  "04",
  "06",
  "08",
  "10",
  "12",
  "14",
  "16",
  "18",
  "20",
  "22",
];
