/**
 * LEGACY — part of the old plan where this repo computed its own health
 * analytics locally. That plan has changed: a separate backend (HCGateway)
 * now owns analytics computation, and this repo is moving toward being
 * frontend-only. This file still runs for pages that haven't been migrated
 * yet (see README.md's "Architecture and data flow" section).
 *
 * Do not extend this file with new metrics, new computations, or new
 * data-processing logic. If a page needs something this doesn't already
 * provide, ask the user whether it should come from a new HCGateway API
 * endpoint instead of being built here.
 */
export function healthSourceLabel(source: string): string {
  const normalized = source.toLowerCase();
  if (normalized.includes("whoop")) return "WHOOP";
  if (normalized.includes("fitbit")) return "Fitbit";
  if (normalized.includes("google")) return "Google Fit";
  return source;
}
