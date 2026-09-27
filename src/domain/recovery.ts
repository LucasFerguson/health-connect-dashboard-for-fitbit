/**
 * Display rules for Recovery scores, from the backend's handoff: a number is
 * shown only when the estimate basis allows one, a null score is never turned
 * into zero, and each basis carries its own label.
 */
import type { RecoveryEstimateBasis } from "~/types/__generated__/graphql";

interface RecoveryDayLike {
  score: number | null;
  quality: { estimateBasis: RecoveryEstimateBasis };
}

/**
 * Label per estimate basis, as the backend specifies. A total Record over the
 * generated enum, so a new basis fails the build instead of rendering blank.
 */
const BASIS_LABEL: Record<RecoveryEstimateBasis, string> = {
  COMPLETE: "",
  PHYSIOLOGY_PARTIAL: "Provisional · Partial",
  SLEEP_CONSISTENCY_PARTIAL:
    "Sleep-based recovery estimate — physiological data unavailable.",
  INSUFFICIENT_DATA: "Not enough physiological data",
};

/** The score to display, or null: INSUFFICIENT_DATA never shows a number. */
export function displayScore(day: RecoveryDayLike): number | null {
  return day.quality.estimateBasis === "INSUFFICIENT_DATA" ? null : day.score;
}

export function recoveryStatusLabel(day: RecoveryDayLike): string {
  if (displayScore(day) === null) return BASIS_LABEL.INSUFFICIENT_DATA;
  return BASIS_LABEL[day.quality.estimateBasis];
}
