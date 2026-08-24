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
import type { HealthSnapshot } from "~/domain/health";
import { FixtureHealthRepository } from "./fixtureRepository";
import { HealthConnectRepository } from "./healthConnectRepository";
import type { HealthRepository } from "./healthRepository";

export function createHealthRepository(): {
  repository: HealthRepository;
  source: HealthSnapshot["source"];
} {
  const baseUrl = process.env.API_URL;
  const username = process.env.API_USERNAME;
  const password = process.env.API_PASSWORD;
  const configuredValues = [baseUrl, username, password].filter(Boolean).length;

  if (configuredValues > 0 && configuredValues < 3) {
    throw new Error(
      "API_URL, API_USERNAME, and API_PASSWORD must be configured together",
    );
  }
  if (baseUrl && username && password) {
    return {
      repository: new HealthConnectRepository({ baseUrl, username, password }),
      source: "health-connect",
    };
  }
  return { repository: new FixtureHealthRepository(), source: "fixture" };
}
