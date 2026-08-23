import type { SleepEvent } from "../../src/domain/analytics";
import type { SleepSession } from "../../src/domain/health";
import { SAME_SLEEP_EVENT_OVERLAP_RATIO } from "../config";
import type { PipelineContext } from "../context";
import { dateKeyInTimeZone } from "../shared/dateKey";
import { groupBy } from "../shared/groupBy";

export function sessionDurationMs(session: SleepSession): number {
  return Math.max(0, Date.parse(session.endAt) - Date.parse(session.startAt));
}

function overlapRatio(left: SleepSession, right: SleepSession): number {
  const overlap = Math.max(
    0,
    Math.min(Date.parse(left.endAt), Date.parse(right.endAt)) -
      Math.max(Date.parse(left.startAt), Date.parse(right.startAt)),
  );
  const shorter = Math.min(sessionDurationMs(left), sessionDurationMs(right));
  return shorter === 0 ? 0 : overlap / shorter;
}

export function reconcileSleepEvents(
  sessions: SleepSession[],
  context: PipelineContext,
): SleepEvent[] {
  const sessionsByDate = groupBy(sessions, (session) =>
    dateKeyInTimeZone(session.startAt, context.homeTimeZone),
  );

  return [...sessionsByDate.entries()]
    .flatMap(([date, dailySessions]) => groupDailySessions(date, dailySessions))
    .sort(
      (left, right) =>
        Date.parse(left.primary.startAt) - Date.parse(right.primary.startAt),
    );
}

function groupDailySessions(
  date: string,
  sessions: SleepSession[],
): SleepEvent[] {
  const parent = sessions.map((_, index) => index);
  const find = (index: number): number =>
    parent[index] === index
      ? index
      : (parent[index] = find(parent[index] ?? index));
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };

  sessions.forEach((left, leftIndex) => {
    sessions.slice(leftIndex + 1).forEach((right, offset) => {
      if (overlapRatio(left, right) >= SAME_SLEEP_EVENT_OVERLAP_RATIO) {
        union(leftIndex, leftIndex + offset + 1);
      }
    });
  });

  const groups = new Map<number, SleepSession[]>();
  sessions.forEach((session, index) => {
    const root = find(index);
    groups.set(root, [...(groups.get(root) ?? []), session]);
  });

  return [...groups.values()].map((recordings) => {
    const ranked = recordings.sort(
      (left, right) => sessionDurationMs(right) - sessionDurationMs(left),
    );
    const primary = ranked[0];
    if (!primary) throw new Error("Sleep event has no recordings");
    return { id: primary.id, date, primary, recordings: ranked };
  });
}
