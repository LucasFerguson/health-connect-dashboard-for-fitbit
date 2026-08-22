export function healthSourceLabel(source: string): string {
  const normalized = source.toLowerCase();
  if (normalized.includes("whoop")) return "WHOOP";
  if (normalized.includes("fitbit")) return "Fitbit";
  if (normalized.includes("google")) return "Google Fit";
  return source;
}
