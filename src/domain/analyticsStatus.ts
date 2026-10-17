import type { ISODateTime } from "./health";

/**
 * The analytics recompute job's state, as shown next to the nav's phone-sync
 * label. Pure (no React, no fetching) so the mapping and the copy are unit
 * tested.
 *
 * HCGateway's `analytics_jobs` documents (api/analytics_engine/jobs.py) move
 * through `queued` -> `running` -> `completed`, and a failed attempt goes
 * back to `queued` (with `error` set) until its fifth attempt, which ends in
 * `failed`. Every phone sync queues a job, delayed by a short `notBefore`
 * debounce, and a full recompute takes about five minutes.
 */
export type AnalyticsJobState = "running" | "queued" | "idle" | "failed";

/** The `analytics` part of `GET /api/sync-status`. */
export interface AnalyticsStatus {
  state: AnalyticsJobState;
  /** When the current state began: `startedAt` while running, `requestedAt`
   * while queued, otherwise null. */
  since: ISODateTime | null;
  /** When the analytics now being served finished computing (the current
   * run's `completedAt`), or null if none has. */
  lastCompletedAt: ISODateTime | null;
  /** The last attempt's error message, if the job recorded one. Set on a
   * failed job, and on a queued job that is waiting to retry. */
  error: string | null;
}

/** Maps HCGateway's job `status` string. `completed` and a missing job both
 * mean nothing is pending; an unrecognised status is treated the same, so a
 * new backend state can't leave a spinner running forever. */
export function analyticsJobState(
  status: string | null | undefined,
): AnalyticsJobState {
  switch (status) {
    case "running":
      return "running";
    case "queued":
    case "pending":
      return "queued";
    case "failed":
      return "failed";
    default:
      return "idle";
  }
}

/** The job's `error` is free-form JSON; HCGateway writes
 * `{ type, message }`. Returns a one-line message, or null. */
export function analyticsErrorMessage(error: unknown): string | null {
  if (error == null) return null;
  if (typeof error === "string") return error || null;
  if (typeof error === "object") {
    const { type, message } = error as { type?: unknown; message?: unknown };
    if (typeof message === "string" && message) {
      return typeof type === "string" && type ? `${type}: ${message}` : message;
    }
    if (typeof type === "string" && type) return type;
  }
  return null;
}

/** Elapsed time since `iso`, compact, for a running job: "<1m", "4m",
 * "1h 5m". */
export function formatElapsed(iso: string, now: Date): string {
  const deltaMs = now.getTime() - Date.parse(iso);
  if (!Number.isFinite(deltaMs) || deltaMs < 60_000) return "<1m";
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/** How long after a run completes the nav keeps a dim "ANALYZED" label, as
 * confirmation that the queued work landed. After that an idle job shows
 * nothing, so the nav stays quiet in the steady state. */
export const RECENTLY_ANALYZED_MS = 10 * 60_000;

export type AnalyticsTone = "active" | "dim" | "alert";

export interface AnalyticsStatusDisplay {
  /** Text label (shown from `md` up). */
  label: string;
  tone: AnalyticsTone;
  /** Show the small animated indicator (running only). */
  animated: boolean;
  /** Show a dot on phones, where the text label is hidden. */
  showOnPhone: boolean;
  /** Tooltip text, and the indicator's accessible name. */
  title: string;
}

/** What the nav shows for the analytics job, or null for nothing. */
export function describeAnalyticsStatus(
  status: AnalyticsStatus,
  now: Date,
): AnalyticsStatusDisplay | null {
  switch (status.state) {
    case "running": {
      const elapsed = status.since ? formatElapsed(status.since, now) : null;
      return {
        label: elapsed ? `ANALYZING · ${elapsed}` : "ANALYZING",
        tone: "active",
        animated: true,
        showOnPhone: true,
        title: "Analytics running: recomputing from the latest synced data",
      };
    }
    case "queued":
      return {
        label: "ANALYSIS QUEUED",
        tone: "dim",
        animated: false,
        showOnPhone: false,
        title: status.error
          ? `Analytics queued to retry after an error: ${status.error}`
          : "Analytics queued: a recompute will start shortly",
      };
    case "failed":
      return {
        label: "ANALYSIS FAILED",
        tone: "alert",
        animated: false,
        showOnPhone: true,
        title: status.error
          ? `Analytics failed: ${status.error}`
          : "Analytics failed",
      };
    case "idle": {
      if (!status.lastCompletedAt) return null;
      const age = now.getTime() - Date.parse(status.lastCompletedAt);
      if (!Number.isFinite(age) || age > RECENTLY_ANALYZED_MS) return null;
      const elapsed = formatElapsed(status.lastCompletedAt, now);
      return {
        label: `ANALYZED · ${elapsed === "<1m" ? "just now" : `${elapsed} ago`}`,
        tone: "dim",
        animated: false,
        showOnPhone: false,
        title: "Analytics are up to date",
      };
    }
  }
}

export const ANALYTICS_ACTIVE_POLL_MS = 10_000;
export const IDLE_POLL_MS = 60_000;

/** Polls faster while a job is pending so the indicator clears promptly. */
export function syncPollInterval(analytics: AnalyticsStatus | undefined) {
  return analytics?.state === "running" || analytics?.state === "queued"
    ? ANALYTICS_ACTIVE_POLL_MS
    : IDLE_POLL_MS;
}

/** True when a run finished between two polls, i.e. the page is showing
 * analytics older than what the server now has. False on the first poll
 * (`previous` undefined), which only establishes the baseline. */
export function analyticsRunCompleted(
  previous: AnalyticsStatus | undefined,
  next: AnalyticsStatus | undefined,
): boolean {
  if (!previous || !next?.lastCompletedAt) return false;
  return next.lastCompletedAt !== previous.lastCompletedAt;
}
