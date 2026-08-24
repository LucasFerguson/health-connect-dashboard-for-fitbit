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
export interface PipelineContext {
  homeTimeZone: string;
  sleepTargetMinutes: number;
  birthDate: string | null;
}

export function createPipelineContext(
  homeTimeZone = process.env.HEALTH_HOME_TIME_ZONE ?? "UTC",
  sleepTargetMinutes = Number(process.env.SLEEP_TARGET_MINUTES ?? 480),
  birthDate = process.env.HEALTH_BIRTH_DATE ?? null,
): PipelineContext {
  new Intl.DateTimeFormat("en-US", { timeZone: homeTimeZone }).format();
  if (
    !Number.isInteger(sleepTargetMinutes) ||
    sleepTargetMinutes < 240 ||
    sleepTargetMinutes > 720
  ) {
    throw new Error("SLEEP_TARGET_MINUTES must be an integer from 240 to 720");
  }
  if (birthDate && !isValidBirthDate(birthDate)) {
    throw new Error(
      "HEALTH_BIRTH_DATE must be a past date in YYYY-MM-DD format",
    );
  }
  return { homeTimeZone, sleepTargetMinutes, birthDate };
}

function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const instant = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(instant) && instant < Date.now();
}
