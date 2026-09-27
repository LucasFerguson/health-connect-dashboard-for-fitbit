import { graphql } from "~/types/__generated__";

/**
 * `/explore` query: every daily series the correlation explorer can plot,
 * trimmed to `date` + value (+ the `id` every entity needs for the shared
 * type policies, and the status/quality flag where a value is only
 * trustworthy under one).
 *
 * `$range` bounds every list, so the 30/90/365-day views fetch only their
 * window (plus the lag padding the adapter adds). `null` means "all history",
 * which the backend treats the same as omitting the argument.
 *
 * Payload, measured against the live backend (2026-09-27, ~625 days of
 * history): 102 KB for 30 days, 234 KB for 90, 775 KB for 365, 1.23 MB for all
 * of it. About two thirds of that is the ~180-byte entity ids, which the cache
 * needs; the backend doesn't gzip.
 *
 * `days` is selected only for the supporting metrics that have no series of
 * their own (respiratory rate, SpO₂, skin temperature, zone 3+ minutes).
 * Sleep duration comes from `sleepDebt.daily.sleepMinutes`, which matches
 * `headlineScores.sleepDuration` on every available day and costs nothing
 * extra, since the debt row is needed anyway.
 *
 * `habits` (WHOOP journal questions) sits under `viewer`, beside
 * `analytics`, and takes the same `$range`. Each entry is trimmed to
 * `date` + `answeredYes`; the question's all-time `firstSeenDate` /
 * `lastSeenDate` come back even when the range holds none of its answers,
 * which is what the "no habit answers in this range" message quotes.
 * The habit selection's own payload was not measured separately; with
 * 122 entries it is small next to the analytics lists above.
 */
export const EXPLORE_QUERY = graphql(`
  query ExplorePage($range: TimeRange) {
    viewer {
      habits(range: $range) {
        id
        question
        firstSeenDate
        lastSeenDate
        entryCount
        entries {
          id
          date
          answeredYes
        }
      }
      analytics {
        id
        timeZone
        steps {
          daily(range: $range) {
            id
            date
            value
          }
        }
        activeCalories {
          daily(range: $range) {
            id
            date
            value
          }
        }
        totalCalories {
          daily(range: $range) {
            id
            date
            value
          }
        }
        restingHeartRate {
          daily(range: $range) {
            id
            date
            value
          }
        }
        heartRateVariability {
          daily(range: $range) {
            id
            date
            value
          }
        }
        weight {
          daily(range: $range) {
            id
            date
            value
          }
        }
        sleepDebt {
          daily(range: $range) {
            id
            date
            sleepMinutes
            debtMinutes
          }
        }
        sleepConsistency {
          daily(range: $range) {
            id
            date
            score
            bedtimeMinutesLocal
            wakeMinutesLocal
          }
        }
        healthspan {
          trend(range: $range) {
            id
            date
            healthAgeYears
            ageDeltaYears
            paceOfAging
          }
        }
        strain {
          daily(range: $range) {
            id
            date
            score
            quality {
              publishable
            }
          }
        }
        recovery {
          daily(range: $range) {
            id
            date
            score
            status
            quality {
              publishable
            }
          }
        }
        days(range: $range) {
          id
          date
          supportingMetrics {
            respiratoryRate {
              status
              value
            }
            oxygenSaturation {
              status
              value
            }
            skinTemperatureDeviation {
              status
              value
            }
            zone3AndAbove {
              status
              value
            }
          }
        }
      }
    }
  }
`);
