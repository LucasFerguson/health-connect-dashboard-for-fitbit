/**
 * Human-readable labels for the raw `source` strings on sessions and metric
 * values: any source mentioning "fitbit" reads as "Fitbit", and so on.
 * Unrecognized sources pass through unchanged.
 */
export function healthSourceLabel(source: string): string {
  const normalized = source.toLowerCase();
  if (normalized.includes("whoop")) return "WHOOP";
  if (normalized.includes("fitbit")) return "Fitbit";
  if (normalized.includes("google")) return "Google Fit";
  return source;
}
