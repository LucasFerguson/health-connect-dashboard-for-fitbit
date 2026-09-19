/**
 * LEGACY — guards the `/api/health` refresh payload on the old
 * local-analytics-pipeline path (see analytics.ts). This is intentionally a
 * shallow shape check, not a full schema: it exists to catch a broken
 * response (a proxy error page, a truncated body, a server error shape)
 * before it's cast to `HealthSnapshot`, not to validate every nested
 * analytics field on a path slated for replacement by HCGateway.
 */
import { z } from "zod";
import type { HealthSnapshot } from "~/domain/health";

const healthSnapshotShape = z.object({
  generatedAt: z.string(),
  source: z.enum(["health-connect", "fixture"]),
  sleepSessions: z.array(z.unknown()),
  analytics: z.object({}).passthrough(),
});

export function parseHealthSnapshot(body: unknown): HealthSnapshot {
  return healthSnapshotShape.parse(body) as unknown as HealthSnapshot;
}
