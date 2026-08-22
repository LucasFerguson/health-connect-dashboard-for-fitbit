import type { HealthSnapshot } from "~/domain/health";
import { FixtureHealthRepository } from "./fixtureRepository";
import { HealthConnectRepository } from "./healthConnectRepository";
import type { HealthRepository } from "./healthRepository";

function createRepository(): {
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

export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const { repository, source } = createRepository();

  return {
    generatedAt: new Date().toISOString(),
    source,
    sleepSessions: await repository.getSleepSessions(),
  };
}
