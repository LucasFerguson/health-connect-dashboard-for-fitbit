import { graphql } from "~/types/__generated__";
import { OverviewPageDocument } from "~/types/__generated__/graphql";

/**
 * Overview (home) page query — the widest page query, because the dashboard
 * shows every analytics section at once.
 *
 * **Stage timelines are deliberately excluded.** Selecting `stages` on all 590
 * sleep events costs 5.5 MB (32,224 individual stages) — only ~2x better than
 * the ~10 MB whole-history snapshot the app once loaded locally. Without them
 * the same full history is 321 KB, a 17x reduction, which is what the sleep
 * calendar and every summary card actually need: only `SleepStagesGraph` reads
 * `.stages`, and only for the one selected day.
 *
 * `overviewSleepStagesQuery()` below fetches stages for a bounded date range
 * on demand, so navigating the calendar pulls one month (~128 KB) at a time.
 *
 * The five metric series repeat their field selection instead of sharing a
 * fragment: `client-preset` masks fragment data behind `$fragmentRefs`, which
 * requires the `useFragment` React hook to read — unusable in this server-side
 * mapper. The repetition keeps the result plainly typed.
 *
 * The selection is trimmed to what this page renders. Omitted deliberately:
 *
 * - `bySource` (170 KB across the five series): only `MetricDetailPage` reads
 *   it, and the metric detail routes have their own query that includes it.
 * - `rolling7Day` and `monthly` (~70 KB): no overview component reads either;
 *   those trend charts live on the detail pages.
 * - `healthspan.trend` (~280 KB, ~590 KB once ids are selected): the overview
 *   card shows only the latest estimate and the pace, so it selects
 *   `healthspan.latest`. The full trend is on /healthspan.
 *
 * `daily`, `days` and `sleepEvents` are kept in full, with no `range`, because
 * every date is selectable — the sleep calendar navigates all history and
 * `DailyHealthSummary` looks the chosen day up by date in each series, so a
 * bounded range would blank the cards for older days.
 */
const OVERVIEW_QUERY_SOURCE = graphql(`
  query OverviewPage {
    viewer {
      analytics {
        id
        timeZone
        processedAt
        sleepEvents {
          id
          date
          primary {
            id
            source
            startAt
            endAt
            title
            notes
          }
          recordings {
            id
            source
            startAt
            endAt
            title
            notes
          }
        }
        deviceSleepComparisons {
          source
          recordingCount
          averageSleepMinutes
          comparisonCount
          averageDifferenceMinutes
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
        sleepDebt {
          targetMinutes
          methodology
          average7DayMinutes
          average30DayMinutes
          previous30DayAverageMinutes
          breakdown30Day {
            recordedDays
            none
            low
            moderate
            high
          }
          daily {
            id
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
        sleepConsistency {
          baselineWindowDays
          minimumBaselineNights
          methodology
          average7DayScore
          average30DayScore
          previous30DayAverageScore
          breakdown30Day {
            scoredDays
            optimal
            sufficient
            poor
          }
          daily {
            id
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
        healthspan {
          modelVersion
          status
          birthDateConfigured
          methodology
          calibrationReasons
          paceOfAging
          paceWindowDays
          latest {
            id
            date
            chronologicalAgeYears
            healthAgeYears
            ageDeltaYears
            paceOfAging
            qualityFlags
            factors {
              id
              key
              label
              value
              unit
              referenceValue
              ageImpactYears
              coverageDays
            }
          }
        }
        steps {
          unit
          overview {
            average7Day
            average30Day
            changeFromPrevious
            sampleCount
            latest {
              id
              date
              value
              source
              qualityFlags
            }
            previous {
              id
              date
              value
              source
              qualityFlags
            }
          }
          daily {
            id
            date
            value
            source
            qualityFlags
          }
        }
        activeCalories {
          unit
          overview {
            average7Day
            average30Day
            changeFromPrevious
            sampleCount
            latest {
              id
              date
              value
              source
              qualityFlags
            }
            previous {
              id
              date
              value
              source
              qualityFlags
            }
          }
          daily {
            id
            date
            value
            source
            qualityFlags
          }
        }
        totalCalories {
          unit
          overview {
            average7Day
            average30Day
            changeFromPrevious
            sampleCount
            latest {
              id
              date
              value
              source
              qualityFlags
            }
            previous {
              id
              date
              value
              source
              qualityFlags
            }
          }
          daily {
            id
            date
            value
            source
            qualityFlags
          }
        }
        restingHeartRate {
          unit
          overview {
            average7Day
            average30Day
            changeFromPrevious
            sampleCount
            latest {
              id
              date
              value
              source
              qualityFlags
            }
            previous {
              id
              date
              value
              source
              qualityFlags
            }
          }
          daily {
            id
            date
            value
            source
            qualityFlags
          }
        }
        weight {
          unit
          overview {
            average7Day
            average30Day
            changeFromPrevious
            sampleCount
            latest {
              id
              date
              value
              source
              qualityFlags
            }
            previous {
              id
              date
              value
              source
              qualityFlags
            }
          }
          daily {
            id
            date
            value
            source
            qualityFlags
          }
        }
      }
    }
  }
`);

/**
 * Stage timelines for a bounded range, fetched separately from the overview's
 * bulk sleep-event list (see above). One month is ~128 KB versus 5.5 MB for all
 * history, so the calendar can load stage detail as the user navigates.
 *
 * The range is interpolated into the query text rather than passed as a GraphQL
 * variable because **the server currently ignores the request's `variables`
 * field**: any operation declaring `$vars` fails with
 * `Variable "$x" of required type "T!" was not provided`, while the identical
 * query with inline arguments succeeds. Verified against a trivial
 * `day(date: $d)` query too, so it is not specific to this operation. See
 * GRAPHQL_BACKEND_REQUESTS.md — switch back to variables once it is fixed,
 * since interpolation means this operation can't be a persisted query.
 *
 * `start`/`endExclusive` are built from a validated `YYYY-MM-DD` date by the
 * only caller (`getSleepStages`), so no user input reaches the query text.
 */
export function overviewSleepStagesQuery(
  start: string,
  endExclusive: string,
): string {
  return `
    query OverviewSleepStages {
      viewer {
        analytics {
          runId
          sleepEvents(range: { start: "${start}", endExclusive: "${endExclusive}" }) {
            id
            date
            primary {
              id
              stages {
                startAt
                endAt
                kind
              }
            }
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
  `;
}

/**
 * Re-exported from the generated module rather than using the `graphql()`
 * return value directly.
 *
 * `client-preset` types `graphql()` as a set of string-literal overloads, and
 * TypeScript stops matching them for a query this large (the overview query is
 * ~5,300 characters versus ~700 for the focused pages), silently falling back
 * to the `graphql(source: string): unknown` overload. That erases the result
 * type and every consumer degrades to `any`. The generated documents carry the
 * same types without depending on literal matching.
 *
 * The `graphql()` calls above are kept so codegen still discovers these
 * operations; only the exported handles differ.
 */
export const OVERVIEW_QUERY = OverviewPageDocument;

// Referenced so the unused-variable rule doesn't flag the codegen anchors.
void OVERVIEW_QUERY_SOURCE;
