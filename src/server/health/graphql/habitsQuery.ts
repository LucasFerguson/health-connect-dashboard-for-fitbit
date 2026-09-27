import { graphql } from "~/types/__generated__";

/**
 * `/habits` query: every journal question with its answers in `$range`.
 *
 * `viewer.habits` returns every question even when the range holds none of
 * its answers, and `firstSeenDate`/`lastSeenDate`/`entryCount` are all-time
 * whatever the range, so the page can always say where the answers are.
 * `$range: null` is all history (the "all" view).
 *
 * `source`, `cycleStartAt`/`cycleEndAt` and `sourceUtcOffsetMinutes` are left
 * out: the local cycle times are what the tooltip shows, and every question
 * is WHOOP's today. Payload (live, 2026-09-27, 8 questions / 122 entries):
 * 23 KB for all history, 14 KB for January 2026 (the busiest month), 1.5 KB
 * for an empty month.
 */
export const HABITS_QUERY = graphql(`
  query HabitsPage($range: TimeRange) {
    viewer {
      habits(range: $range) {
        id
        source
        question
        firstSeenDate
        lastSeenDate
        entryCount
        entries {
          id
          date
          cycleStartLocal
          cycleEndLocal
          answeredYes
          notes
        }
      }
    }
  }
`);

/**
 * Just the all-time bounds, to find the period holding the latest answer
 * when the URL names no date. 0.7 KB; cheaper than fetching all history
 * to pick a month out of it.
 */
export const HABITS_LATEST_QUERY = graphql(`
  query HabitsLatest {
    viewer {
      habits {
        id
        lastSeenDate
        entryCount
      }
    }
  }
`);
