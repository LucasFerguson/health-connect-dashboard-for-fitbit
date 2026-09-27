import { graphql } from "~/types/__generated__";

/**
 * Stage timelines for a bounded range, fetched separately from the overview's
 * bulk sleep-event list. Selecting `stages` on every sleep event costs 5.5 MB
 * versus 321 KB without (see `overviewQuery.ts`), and only `SleepStagesGraph`
 * reads them, for the one selected day — so it asks for that day alone.
 *
 * Issued from the browser through the `/api/graphql` proxy (see
 * `useSleepStages`), which is why this module and its adapter
 * (`adapters/sleepStagesAdapter.ts`) import nothing server-only.
 *
 * Only `recordings` carry stages here, not `primary`: the primary is one of an
 * event's recordings, and the graph matches timelines to sessions by recording
 * id, so selecting it again would ship the same stages twice.
 *
 * `$range` is a real variable rather than text interpolated into the query, so
 * codegen types both the result and the variables, and the document is one
 * fixed string a persisted-query allowlist could name.
 */
export const SLEEP_STAGES_QUERY = graphql(`
  query SleepStages($range: TimeRange!) {
    viewer {
      analytics {
        sleepEvents(range: $range) {
          id
          recordings {
            id
            stages {
              startAt
              endAt
              kind
            }
          }
        }
      }
    }
  }
`);
