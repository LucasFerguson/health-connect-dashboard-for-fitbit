export interface PipelineContext {
  homeTimeZone: string;
  sleepTargetMinutes: number;
}

export function createPipelineContext(
  homeTimeZone = process.env.HEALTH_HOME_TIME_ZONE ?? "UTC",
  sleepTargetMinutes = Number(process.env.SLEEP_TARGET_MINUTES ?? 480),
): PipelineContext {
  new Intl.DateTimeFormat("en-US", { timeZone: homeTimeZone }).format();
  if (
    !Number.isInteger(sleepTargetMinutes) ||
    sleepTargetMinutes < 240 ||
    sleepTargetMinutes > 720
  ) {
    throw new Error("SLEEP_TARGET_MINUTES must be an integer from 240 to 720");
  }
  return { homeTimeZone, sleepTargetMinutes };
}
