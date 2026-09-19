import { graphql } from "~/types/__generated__";

/**
 * Sleep-debt page query. One query per page, per Apollo's guidance.
 *
 * `runId` is selected so the UI can show which prepared analytics run the
 * numbers came from, and so a run change is visible rather than silent.
 *
 * Deliberately does NOT select `Day.timeline` or any `day(date:)` detail: this
 * page only needs the daily debt series, and pulling timeline data across a
 * long range is what turns a ~4 KB response into a ~900 KB one.
 *
 * Written with the codegen `graphql()` function rather than `gql`, so the
 * returned document carries its own result and variable types.
 */
export const SLEEP_DEBT_QUERY = graphql(`
  query SleepDebtPage {
    viewer {
      analytics {
        runId
        algorithmVersion
        timeZone
        processedAt
        sleepDebt {
          targetMinutes
          methodology
          average7DayMinutes
          average30DayMinutes
          previous30DayAverageMinutes
          latest {
            date
            debtMinutes
          }
          daily {
            date
            sleepMinutes
            targetMinutes
            debtMinutes
            surplusMinutes
            category
            rolling7DayAverageMinutes
            rolling7DayTotalMinutes
            rolling30DayAverageMinutes
          }
        }
      }
    }
  }
`);
