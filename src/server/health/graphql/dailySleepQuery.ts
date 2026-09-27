import { graphql } from "~/types/__generated__";

/**
 * Sleep-quantity page query.
 *
 * There is no `dailySleep` field on the API, so the per-day sleep totals come
 * from `days { headlineScores { sleepDuration } }`, which carries the same
 * three numbers `DailySleepSummary` needs (minutes, event count, recording
 * count). `sleepDebt.targetMinutes` supplies the target line.
 *
 * `days` is requested without a `range` deliberately: the page renders a
 * full-history calendar heatmap, so it wants every recorded day. Only the
 * headline sleep fields are selected — no `timeline` — which keeps this at
 * ~90 KB rather than the ~900 KB a nested-timeline range query costs.
 */
export const DAILY_SLEEP_QUERY = graphql(`
  query DailySleepPage {
    viewer {
      analytics {
        id
        runId
        algorithmVersion
        timeZone
        processedAt
        sleepDebt {
          targetMinutes
        }
        days {
          id
          date
          headlineScores {
            sleepDuration {
              status
              value
              eventCount
              recordingCount
            }
          }
        }
      }
    }
  }
`);
