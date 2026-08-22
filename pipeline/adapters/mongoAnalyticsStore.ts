import { MongoClient } from "mongodb";
import type { HealthAnalytics } from "../../src/domain/analytics";
import type { AnalyticsStore } from "../ports/analyticsStore";

interface AnalyticsSnapshotDocument extends HealthAnalytics {
  _id: string;
}

interface ProcessingRunDocument {
  _id: string;
  algorithmVersion: string;
  sourceFingerprint: string;
  processedAt: string;
  sleepEventCount: number;
}

export class MongoAnalyticsStore implements AnalyticsStore {
  constructor(
    private readonly uri: string,
    private readonly databaseName = "health_analytics",
  ) {}

  async save(analytics: HealthAnalytics): Promise<"saved" | "unchanged"> {
    const client = new MongoClient(this.uri);
    try {
      await client.connect();
      const database = client.db(this.databaseName);
      const current = await database
        .collection<AnalyticsSnapshotDocument>("analytics_snapshots")
        .findOne(
          { algorithmVersion: analytics.algorithmVersion },
          { sort: { processedAt: -1 } },
        );

      if (current?.sourceFingerprint === analytics.sourceFingerprint) {
        return "unchanged";
      }

      const runId = `${analytics.algorithmVersion}:${analytics.sourceFingerprint}`;
      await Promise.all([
        database
          .collection<AnalyticsSnapshotDocument>("analytics_snapshots")
          .updateOne(
            { _id: runId },
            { $setOnInsert: { _id: runId, ...analytics } },
            { upsert: true },
          ),
        database.collection<ProcessingRunDocument>("processing_runs").updateOne(
          { _id: runId },
          {
            $setOnInsert: {
              _id: runId,
              algorithmVersion: analytics.algorithmVersion,
              sourceFingerprint: analytics.sourceFingerprint,
              processedAt: analytics.processedAt,
              sleepEventCount: analytics.sleepEvents.length,
            },
          },
          { upsert: true },
        ),
        ...analytics.sleepEvents.map((event) =>
          database
            .collection("sleep_events")
            .updateOne(
              { runId, eventId: event.id },
              { $setOnInsert: { runId, eventId: event.id, ...event } },
              { upsert: true },
            ),
        ),
        ...analytics.dailySleep.map((summary) =>
          database
            .collection("daily_sleep_summaries")
            .updateOne(
              { runId, date: summary.date },
              { $setOnInsert: { runId, ...summary } },
              { upsert: true },
            ),
        ),
        ...analytics.deviceSleep.map((summary) =>
          database
            .collection("device_sleep_comparisons")
            .updateOne(
              { runId, source: summary.source },
              { $setOnInsert: { runId, ...summary } },
              { upsert: true },
            ),
        ),
      ]);
      return "saved";
    } finally {
      await client.close();
    }
  }
}
