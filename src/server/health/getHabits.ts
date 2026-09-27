/**
 * GraphQL-backed read for `/habits`: the journal questions with their
 * answers in the selected period, through `withViewer` (habits hang off
 * `viewer`, not `viewer.analytics`).
 */
import {
  isValidDateKey,
  latestResponseDate,
  periodFor,
  periodQueryRange,
  type HabitsSelection,
} from "~/domain/habits";
import { adaptHabits } from "./adapters/habitsAdapter";
import { withViewer } from "./graphql/fetchAnalytics";
import { HABITS_LATEST_QUERY, HABITS_QUERY } from "./graphql/habitsQuery";

/**
 * With no date in the URL, the period is the one holding the most recent
 * answer, found with a small bounds-only query first. Answers stop at
 * 2026-04-08 in the live data, so "this week" would be an empty grid that
 * reads as "nothing recorded". Falls back to today (UTC) when there are no
 * answers at all.
 *
 * Throws `BackendRequestError`; see `withViewer`.
 */
export async function getHabits(selection: HabitsSelection, now = new Date()) {
  const anchor =
    selection.date ??
    (await withViewer("habits-latest", HABITS_LATEST_QUERY, (viewer) =>
      latestResponseDate(
        viewer.habits.filter((habit) => isValidDateKey(habit.lastSeenDate)),
      ),
    )) ??
    now.toISOString().slice(0, 10);
  const period = periodFor(selection.view, anchor);
  const habits = await withViewer(
    "habits",
    HABITS_QUERY,
    (viewer) => adaptHabits(viewer.habits),
    { range: periodQueryRange(period) },
  );
  return { habits, anchor, period };
}
