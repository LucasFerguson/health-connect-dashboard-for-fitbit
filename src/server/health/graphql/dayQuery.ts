import { graphql } from "~/types/__generated__";

/**
 * Day-view query: the focused day in full, plus a low-resolution summary of
 * the surrounding days for the day strip.
 *
 * `day(date:)` is left at its default `radius` of 0. The argument only
 * validates 0..7 server-side and never changes `day`'s payload (verified
 * live), so passing 7 would just be a misleading hint that it does.
 *
 * The strip comes from `days(range:)` instead, which is NOT a drop-in for
 * REST's `nearbyDays`: it returns only days with stored analytics, silently
 * omitting both empty past dates and future dates. The adapter
 * (`adapters/dayAdapter.ts`) fills in the full 15-cell window itself. Its
 * range test compares each day's date at UTC midnight against
 * `[start, endExclusive)`, so the caller passes UTC-midnight bounds.
 *
 * Selects only what `components/day-view` reads, plus every `status`/`note`
 * pair `availabilityNotes` is derived from. In particular it skips
 * `heartRateZones.value`, which GraphQL types as a single `Float` and returns
 * null (REST sent six bpm thresholds), and the `value` of the plan metrics
 * (`schedule`, `targetWakeTime`, `targetBedTime`), which are `Float` here but
 * local-time strings in the day contract and unused by the UI either way.
 */
export const DAY_QUERY = graphql(`
  query DayPage($date: Date!, $range: TimeRange!) {
    viewer {
      analytics {
        timeZone
        day(date: $date) {
          date
          timeZone
          dayState
          headlineScores {
            sleepDuration {
              status
              value
              note
              window {
                startAt
                endAt
              }
              stageMinutes {
                deep
                light
                rem
                asleep
                awake
                unknown
              }
            }
            sleepNeed {
              status
              value
              note
            }
            recovery {
              status
              value
              note
            }
            strain {
              status
              value
              note
            }
            strainTarget {
              status
              value
              note
            }
          }
          supportingMetrics {
            hrv {
              status
              value
              note
            }
            restingHeartRate {
              status
              value
              note
            }
            respiratoryRate {
              status
              value
              note
            }
            oxygenSaturation {
              status
              value
              note
            }
            skinTemperatureDeviation {
              status
              value
              note
            }
            steps {
              status
              value
              note
            }
            calories {
              status
              value
              note
            }
            zone3AndAbove {
              status
              value
              note
            }
          }
          heartRateZones {
            status
            note
          }
          timeline {
            heartRate {
              status
              note
              hours {
                hour
                status
                sampleCount
                min
                p25
                mean
                p75
                max
              }
            }
            sleepStages {
              startAt
              endAt
              kind
            }
            steps {
              hour
              count
              status
            }
            schedule {
              status
              note
            }
            targetWakeTime {
              status
              note
            }
            targetBedTime {
              status
              note
            }
          }
        }
        days(range: $range) {
          date
          dayState
          headlineScores {
            sleepDuration {
              status
              value
            }
            strain {
              status
              value
            }
          }
        }
      }
    }
  }
`);

/**
 * `/day`'s redirect only needs the account's home time zone to work out which
 * date is "today"; one scalar, so it doesn't pay for a whole day payload.
 */
export const DAY_TIME_ZONE_QUERY = graphql(`
  query DayIndexTimeZone {
    viewer {
      analytics {
        timeZone
      }
    }
  }
`);
