import { graphql } from "~/types/__generated__";

/** Sleep-consistency page query — one query per page, per Apollo's guidance. */
export const SLEEP_CONSISTENCY_QUERY = graphql(`
  query SleepConsistencyPage {
    viewer {
      analytics {
        runId
        algorithmVersion
        timeZone
        processedAt
        sleepConsistency {
          baselineWindowDays
          minimumBaselineNights
          methodology
          average7DayScore
          average30DayScore
          previous30DayAverageScore
          daily {
            date
            source
            bedtimeAt
            wakeAt
            bedtimeMinutesLocal
            wakeMinutesLocal
            baselineBedtimeMinutesLocal
            baselineWakeMinutesLocal
            bedtimeDeviationMinutes
            wakeDeviationMinutes
            baselineNightCount
            score
            category
            rolling7DayAverageScore
            rolling30DayAverageScore
            qualityFlags
          }
        }
      }
    }
  }
`);
