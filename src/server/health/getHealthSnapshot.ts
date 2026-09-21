/**
 * LEGACY — part of the old plan where this repo computed its own health
 * analytics locally. That plan has changed: a separate backend (HCGateway)
 * now owns analytics computation, and this repo is moving toward being
 * frontend-only. As of 2026-09-20 every page reads GraphQL, so this now runs
 * ONLY as the fallback when the GraphQL API can't serve a request — see the
 * `?? await getHealthSnapshot()` in each page. It is scheduled for deletion;
 * see GRAPHQL_MIGRATION_REDUNDANCY.md for what goes with it.
 *
 * Do not extend this file with new metrics, new computations, or new
 * data-processing logic. If a page needs something this doesn't already
 * provide, ask the user whether it should come from a new HCGateway API
 * endpoint instead of being built here.
 */
import type { HealthSnapshot } from "~/domain/health";
import { runPipeline } from "../../../pipeline/runPipeline";
import { createHealthRepository } from "./createHealthRepository";

export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const { repository, source } = createHealthRepository();
  const healthData = await repository.getHealthData();
  const { analytics } = await runPipeline(healthData);

  return {
    generatedAt: new Date().toISOString(),
    source,
    sleepSessions: healthData.sleepSessions,
    analytics,
  };
}
