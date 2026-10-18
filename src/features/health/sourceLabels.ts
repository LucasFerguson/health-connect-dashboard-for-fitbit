/**
 * Human-readable labels for the raw `source` strings on sessions and metric
 * values: any source mentioning "fitbit" reads as "Fitbit", and so on.
 * Unrecognized sources pass through unchanged.
 *
 * Health Connect records written by the phone itself carry a per-install
 * package such as `com.android.healthconnect.phone.ja8cc6ae…` (60+ characters
 * with no break opportunity). Shown raw, that one word widened cards past the
 * screen and made phones zoom the whole page out.
 */
export function healthSourceLabel(source: string): string {
  const normalized = source.toLowerCase();
  if (normalized.includes("whoop")) return "WHOOP";
  if (normalized.includes("fitbit")) return "Fitbit";
  if (normalized.includes("google")) return "Google Fit";
  if (normalized.startsWith("com.android.healthconnect.phone")) {
    return "Phone (Health Connect)";
  }
  if (normalized === "android") return "Android";
  return source;
}
