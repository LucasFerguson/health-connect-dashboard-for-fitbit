import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ANALYTICS_ACTIVE_POLL_MS,
  IDLE_POLL_MS,
  analyticsErrorMessage,
  analyticsJobState,
  analyticsRunCompleted,
  describeAnalyticsStatus,
  formatElapsed,
  syncPollInterval,
  type AnalyticsStatus,
} from "./analyticsStatus";

const now = new Date("2026-08-24T12:00:00Z");

function status(overrides: Partial<AnalyticsStatus> = {}): AnalyticsStatus {
  return {
    state: "idle",
    since: null,
    lastCompletedAt: null,
    error: null,
    ...overrides,
  };
}

void describe("analyticsJobState", () => {
  void it("maps HCGateway's job statuses", () => {
    assert.equal(analyticsJobState("running"), "running");
    assert.equal(analyticsJobState("queued"), "queued");
    assert.equal(analyticsJobState("pending"), "queued");
    assert.equal(analyticsJobState("failed"), "failed");
    assert.equal(analyticsJobState("completed"), "idle");
  });

  void it("treats a missing or unknown status as idle", () => {
    assert.equal(analyticsJobState(null), "idle");
    assert.equal(analyticsJobState(undefined), "idle");
    assert.equal(analyticsJobState("paused"), "idle");
  });
});

void describe("analyticsErrorMessage", () => {
  void it("formats HCGateway's { type, message } error", () => {
    assert.equal(
      analyticsErrorMessage({ type: "ValueError", message: "bad day" }),
      "ValueError: bad day",
    );
    assert.equal(analyticsErrorMessage({ message: "bad day" }), "bad day");
    assert.equal(analyticsErrorMessage({ type: "ValueError" }), "ValueError");
  });

  void it("passes strings through and drops anything else", () => {
    assert.equal(analyticsErrorMessage("boom"), "boom");
    assert.equal(analyticsErrorMessage(""), null);
    assert.equal(analyticsErrorMessage(null), null);
    assert.equal(analyticsErrorMessage(42), null);
    assert.equal(analyticsErrorMessage({}), null);
  });
});

void describe("formatElapsed", () => {
  void it("rounds down to whole minutes", () => {
    assert.equal(formatElapsed("2026-08-24T11:59:30Z", now), "<1m");
    assert.equal(formatElapsed("2026-08-24T11:58:59Z", now), "1m");
    assert.equal(formatElapsed("2026-08-24T11:55:00Z", now), "5m");
  });

  void it("switches to hours past an hour", () => {
    assert.equal(formatElapsed("2026-08-24T11:00:00Z", now), "1h");
    assert.equal(formatElapsed("2026-08-24T10:55:00Z", now), "1h 5m");
  });

  void it("treats future or invalid instants as under a minute", () => {
    assert.equal(formatElapsed("2026-08-24T12:05:00Z", now), "<1m");
    assert.equal(formatElapsed("not a date", now), "<1m");
  });
});

void describe("describeAnalyticsStatus", () => {
  void it("shows elapsed time and animates while running", () => {
    const display = describeAnalyticsStatus(
      status({ state: "running", since: "2026-08-24T11:58:00Z" }),
      now,
    );
    assert.equal(display?.label, "ANALYZING · 2m");
    assert.equal(display?.tone, "active");
    assert.equal(display?.animated, true);
    assert.equal(display?.showOnPhone, true);
  });

  void it("omits the elapsed time when the start is unknown", () => {
    const display = describeAnalyticsStatus(status({ state: "running" }), now);
    assert.equal(display?.label, "ANALYZING");
  });

  void it("labels a queued job, mentioning a pending retry", () => {
    const display = describeAnalyticsStatus(status({ state: "queued" }), now);
    assert.equal(display?.label, "ANALYSIS QUEUED");
    assert.equal(display?.animated, false);
    assert.equal(display?.showOnPhone, false);
    const retry = describeAnalyticsStatus(
      status({ state: "queued", error: "ValueError: bad day" }),
      now,
    );
    assert.match(retry?.title ?? "", /retry.*ValueError: bad day/);
  });

  void it("puts a failed job's error in the tooltip", () => {
    const display = describeAnalyticsStatus(
      status({ state: "failed", error: "ValueError: bad day" }),
      now,
    );
    assert.equal(display?.label, "ANALYSIS FAILED");
    assert.equal(display?.tone, "alert");
    assert.equal(display?.title, "Analytics failed: ValueError: bad day");
  });

  void it("briefly confirms a recent run, then shows nothing", () => {
    assert.equal(
      describeAnalyticsStatus(
        status({ lastCompletedAt: "2026-08-24T11:59:40Z" }),
        now,
      )?.label,
      "ANALYZED · just now",
    );
    assert.equal(
      describeAnalyticsStatus(
        status({ lastCompletedAt: "2026-08-24T11:55:00Z" }),
        now,
      )?.label,
      "ANALYZED · 5m ago",
    );
    assert.equal(
      describeAnalyticsStatus(
        status({ lastCompletedAt: "2026-08-24T11:30:00Z" }),
        now,
      ),
      null,
    );
    assert.equal(describeAnalyticsStatus(status(), now), null);
  });
});

void describe("syncPollInterval", () => {
  void it("polls faster while a job is pending", () => {
    assert.equal(
      syncPollInterval(status({ state: "running" })),
      ANALYTICS_ACTIVE_POLL_MS,
    );
    assert.equal(
      syncPollInterval(status({ state: "queued" })),
      ANALYTICS_ACTIVE_POLL_MS,
    );
  });

  void it("backs off when idle, failed or unknown", () => {
    assert.equal(syncPollInterval(status()), IDLE_POLL_MS);
    assert.equal(syncPollInterval(status({ state: "failed" })), IDLE_POLL_MS);
    assert.equal(syncPollInterval(undefined), IDLE_POLL_MS);
  });
});

void describe("analyticsRunCompleted", () => {
  const running = status({
    state: "running",
    lastCompletedAt: "2026-08-24T10:00:00Z",
  });

  void it("detects a new completed run between polls", () => {
    assert.equal(
      analyticsRunCompleted(
        running,
        status({ lastCompletedAt: "2026-08-24T11:59:00Z" }),
      ),
      true,
    );
    assert.equal(
      analyticsRunCompleted(
        status({ state: "running" }),
        status({ lastCompletedAt: "2026-08-24T11:59:00Z" }),
      ),
      true,
    );
  });

  void it("ignores the first poll and unchanged runs", () => {
    assert.equal(analyticsRunCompleted(undefined, running), false);
    assert.equal(analyticsRunCompleted(running, running), false);
    assert.equal(
      analyticsRunCompleted(running, status({ state: "failed" })),
      false,
    );
  });
});
