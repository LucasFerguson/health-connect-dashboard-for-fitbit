import { graphql } from "~/types/__generated__";

/**
 * `/recovery` query: the recovery model summary plus every daily score.
 * No `range` is passed, so `daily` is all history.
 */
export const RECOVERY_QUERY = graphql(`
  query RecoveryPage {
    viewer {
      analytics {
        id
        timeZone
        recovery {
          algorithmVersion
          status
          provisional
          methodology
          limitations
          weights {
            sleep
            hrv
            restingHeartRate
            sleepConsistency
          }
          availability {
            available
            publishableDayCount
            completeDayCount
            reasons
          }
          daily {
            id
            date
            score
            band
            status
            provisional
            components {
              sleep {
                score
                value
                baseline
                unit
                baselineDays
              }
              restingHeartRate {
                score
                value
                baseline
                unit
                baselineDays
              }
              hrv {
                score
                value
                baseline
                unit
                baselineDays
              }
              sleepConsistency {
                score
                value
                baseline
                unit
                baselineDays
              }
            }
            quality {
              publishable
              complete
              availableWeight
              baselineWindowDays
              minimumBaselineDays
              reasons
            }
          }
        }
      }
    }
  }
`);
