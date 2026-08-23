export interface PipelineContext {
  homeTimeZone: string;
}

export function createPipelineContext(
  homeTimeZone = process.env.HEALTH_HOME_TIME_ZONE ?? "UTC",
): PipelineContext {
  new Intl.DateTimeFormat("en-US", { timeZone: homeTimeZone }).format();
  return { homeTimeZone };
}
