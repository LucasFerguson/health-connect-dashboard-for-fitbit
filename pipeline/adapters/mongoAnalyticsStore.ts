import { MongoClient, type Db, type Document } from "mongodb";
import type { HealthAnalytics } from "../../src/domain/analytics";
import type { AnalyticsStore } from "../ports/analyticsStore";

interface StringIdDocument extends Document {
  _id: string;
}

export class MongoAnalyticsStore implements AnalyticsStore {
  constructor(
    private readonly uri: string,
    private readonly databaseName = "health_analytics",
  ) {}

  async save(analytics: HealthAnalytics): Promise<"saved" | "unchanged"> {
    const client = new MongoClient(this.uri);
    const runId = `${analytics.algorithmVersion}:${analytics.sourceFingerprint}:${analytics.configurationFingerprint}`;
    try {
      await client.connect();
      const database = client.db(this.databaseName);
      await ensureIndexes(database);
      const current = await database
        .collection<StringIdDocument>("analytics_current")
        .findOne({ _id: "current" });
      if (
        current?.sourceFingerprint === analytics.sourceFingerprint &&
        current.configurationFingerprint ===
          analytics.configurationFingerprint &&
        current.algorithmVersion === analytics.algorithmVersion
      ) {
        return "unchanged";
      }

      await database.collection<StringIdDocument>("processing_runs").updateOne(
        { _id: runId },
        {
          $set: {
            status: "started",
            algorithmVersion: analytics.algorithmVersion,
            sourceFingerprint: analytics.sourceFingerprint,
            configurationFingerprint: analytics.configurationFingerprint,
            startedAt: analytics.processedAt,
          },
        },
        { upsert: true },
      );
      await Promise.all([
        writeDailyMetrics(database, runId, analytics),
        writeSleepEvents(database, runId, analytics),
        writeDeviceComparisons(database, runId, analytics),
        writeSleepDebtSummary(database, runId, analytics),
      ]);

      const completedAt = new Date().toISOString();
      await database.collection<StringIdDocument>("processing_runs").updateOne(
        { _id: runId },
        {
          $set: {
            status: "completed",
            completedAt,
            counts: buildCounts(analytics),
          },
        },
      );
      await database
        .collection<StringIdDocument>("analytics_current")
        .updateOne(
          { _id: "current" },
          {
            $set: {
              runId,
              algorithmVersion: analytics.algorithmVersion,
              sourceFingerprint: analytics.sourceFingerprint,
              configurationFingerprint: analytics.configurationFingerprint,
              completedAt,
            },
          },
          { upsert: true },
        );
      return "saved";
    } catch (error) {
      await recordFailure(client, this.databaseName, runId, error);
      throw error;
    } finally {
      await client.close();
    }
  }
}

function buildCounts(analytics: HealthAnalytics) {
  return {
    sleepEvents: analytics.sleepEvents.length,
    dailySleep: analytics.dailySleep.length,
    dailySleepDebt: analytics.sleepDebt.daily.length,
    dailySteps: analytics.steps.daily.length,
    dailyActiveCalories: analytics.activeCalories.daily.length,
    dailyTotalCalories: analytics.totalCalories.daily.length,
    dailyRestingHeartRate: analytics.restingHeartRate.daily.length,
    weightMeasurements: analytics.weight.daily.length,
  };
}

async function recordFailure(
  client: MongoClient,
  databaseName: string,
  runId: string,
  error: unknown,
) {
  try {
    await client
      .db(databaseName)
      .collection<StringIdDocument>("processing_runs")
      .updateOne(
        { _id: runId },
        {
          $set: {
            status: "failed",
            failedAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error),
          },
        },
        { upsert: true },
      );
  } catch {
    // Preserve the original pipeline error if failure reporting also fails.
  }
}

async function ensureIndexes(database: Db) {
  await Promise.all([
    database
      .collection("daily_metrics")
      .createIndex({ runId: 1, date: 1 }, { unique: true }),
    database
      .collection("sleep_events")
      .createIndex({ runId: 1, eventId: 1 }, { unique: true }),
    database
      .collection("device_comparisons")
      .createIndex({ runId: 1, metric: 1, source: 1 }, { unique: true }),
    database
      .collection("processing_runs")
      .createIndex({ status: 1, completedAt: -1 }),
    database
      .collection("sleep_debt_summaries")
      .createIndex({ runId: 1 }, { unique: true }),
  ]);
}

async function writeDailyMetrics(
  database: Db,
  runId: string,
  analytics: HealthAnalytics,
) {
  const dates = new Set([
    ...analytics.dailySleep.map((item) => item.date),
    ...analytics.sleepDebt.daily.map((item) => item.date),
    ...analytics.steps.daily.map((item) => item.date),
    ...analytics.activeCalories.daily.map((item) => item.date),
    ...analytics.totalCalories.daily.map((item) => item.date),
    ...analytics.restingHeartRate.daily.map((item) => item.date),
    ...analytics.weight.daily.map((item) => item.date),
  ]);
  const byDate = <T extends { date: string }>(values: T[]) =>
    new Map(values.map((value) => [value.date, value]));
  const sleep = byDate(analytics.dailySleep);
  const sleepDebt = byDate(analytics.sleepDebt.daily);
  const steps = byDate(analytics.steps.daily);
  const activeCalories = byDate(analytics.activeCalories.daily);
  const totalCalories = byDate(analytics.totalCalories.daily);
  const restingHeartRate = byDate(analytics.restingHeartRate.daily);
  const weight = byDate(analytics.weight.daily);
  const operations = [...dates].map((date) => ({
    updateOne: {
      filter: { runId, date },
      update: {
        $setOnInsert: {
          runId,
          date,
          sleep: sleep.get(date) ?? null,
          sleepDebt: sleepDebt.get(date) ?? null,
          steps: steps.get(date) ?? null,
          activeCalories: activeCalories.get(date) ?? null,
          totalCalories: totalCalories.get(date) ?? null,
          restingHeartRate: restingHeartRate.get(date) ?? null,
          weight: weight.get(date) ?? null,
        },
      },
      upsert: true,
    },
  }));
  if (operations.length) {
    await database.collection("daily_metrics").bulkWrite(operations);
  }
}

async function writeSleepDebtSummary(
  database: Db,
  runId: string,
  analytics: HealthAnalytics,
) {
  const { daily: _, ...summary } = analytics.sleepDebt;
  await database.collection("sleep_debt_summaries").updateOne(
    { runId },
    {
      $setOnInsert: {
        runId,
        algorithmVersion: analytics.algorithmVersion,
        configurationFingerprint: analytics.configurationFingerprint,
        ...summary,
      },
    },
    { upsert: true },
  );
}

async function writeSleepEvents(
  database: Db,
  runId: string,
  analytics: HealthAnalytics,
) {
  const operations = analytics.sleepEvents.map((event) => ({
    updateOne: {
      filter: { runId, eventId: event.id },
      update: { $setOnInsert: { runId, eventId: event.id, ...event } },
      upsert: true,
    },
  }));
  if (operations.length) {
    await database.collection("sleep_events").bulkWrite(operations);
  }
}

async function writeDeviceComparisons(
  database: Db,
  runId: string,
  analytics: HealthAnalytics,
) {
  const operations = analytics.deviceSleep.map((summary) => ({
    updateOne: {
      filter: { runId, metric: "sleep", source: summary.source },
      update: { $setOnInsert: { runId, metric: "sleep", ...summary } },
      upsert: true,
    },
  }));
  if (operations.length) {
    await database.collection("device_comparisons").bulkWrite(operations);
  }
}
