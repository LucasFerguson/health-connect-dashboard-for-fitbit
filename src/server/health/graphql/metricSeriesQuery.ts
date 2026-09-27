import { graphql } from "~/types/__generated__";

/**
 * Query for the four metric detail pages (/steps, /calories,
 * /resting-heart-rate, /weight). They all render through `HealthMetricPage`,
 * so they share one query rather than four near-identical ones — the selection
 * set is the same shape for every series.
 *
 * All five series are fetched even though a page renders one (two for
 * calories, which charts active against total). That is cheaper than it looks:
 * these are pre-aggregated daily summaries and no `Day.timeline` is selected,
 * so the whole response is tens of KB, and splitting it per page would mean
 * five documents to keep in sync for no measurable gain.
 *
 * The per-series selection is repeated inline rather than factored into a
 * fragment on purpose. `client-preset` masks fragments behind `$fragmentRefs`,
 * which the adapter would then have to unmask with `useFragment` — a React
 * hook API, in a plain server-side mapping function. Repetition is the lesser
 * evil here.
 *
 * `runId`/`algorithmVersion`/`timeZone`/`processedAt` are required by
 * `withAnalytics` so the UI can report which prepared run produced the numbers.
 *
 * Written with the codegen `graphql()` function rather than `gql`, so the
 * returned document carries its own result and variable types.
 */
export const METRIC_SERIES_QUERY = graphql(`
  query MetricSeriesPage {
    viewer {
      analytics {
        id
        runId
        algorithmVersion
        timeZone
        processedAt
        steps {
          unit
          daily {
            id
            date
            value
            source
            qualityFlags
            bySource {
              source
              value
              observationCount
              coverageMinutes
            }
          }
          overview {
            latest {
              id
              date
              value
              source
              qualityFlags
              bySource {
                source
                value
                observationCount
                coverageMinutes
              }
            }
            previous {
              id
              date
              value
              source
              qualityFlags
              bySource {
                source
                value
                observationCount
                coverageMinutes
              }
            }
            average7Day
            average30Day
            changeFromPrevious
            sampleCount
          }
          rolling7Day {
            id
            date
            value
            sampleCount
          }
          monthly {
            id
            month
            value
            sampleCount
          }
        }
        activeCalories {
          unit
          daily {
            id
            date
            value
            source
            qualityFlags
            bySource {
              source
              value
              observationCount
              coverageMinutes
            }
          }
          overview {
            latest {
              id
              date
              value
              source
              qualityFlags
              bySource {
                source
                value
                observationCount
                coverageMinutes
              }
            }
            previous {
              id
              date
              value
              source
              qualityFlags
              bySource {
                source
                value
                observationCount
                coverageMinutes
              }
            }
            average7Day
            average30Day
            changeFromPrevious
            sampleCount
          }
          rolling7Day {
            id
            date
            value
            sampleCount
          }
          monthly {
            id
            month
            value
            sampleCount
          }
        }
        totalCalories {
          unit
          daily {
            id
            date
            value
            source
            qualityFlags
            bySource {
              source
              value
              observationCount
              coverageMinutes
            }
          }
          overview {
            latest {
              id
              date
              value
              source
              qualityFlags
              bySource {
                source
                value
                observationCount
                coverageMinutes
              }
            }
            previous {
              id
              date
              value
              source
              qualityFlags
              bySource {
                source
                value
                observationCount
                coverageMinutes
              }
            }
            average7Day
            average30Day
            changeFromPrevious
            sampleCount
          }
          rolling7Day {
            id
            date
            value
            sampleCount
          }
          monthly {
            id
            month
            value
            sampleCount
          }
        }
        restingHeartRate {
          unit
          daily {
            id
            date
            value
            source
            qualityFlags
            bySource {
              source
              value
              observationCount
              coverageMinutes
            }
          }
          overview {
            latest {
              id
              date
              value
              source
              qualityFlags
              bySource {
                source
                value
                observationCount
                coverageMinutes
              }
            }
            previous {
              id
              date
              value
              source
              qualityFlags
              bySource {
                source
                value
                observationCount
                coverageMinutes
              }
            }
            average7Day
            average30Day
            changeFromPrevious
            sampleCount
          }
          rolling7Day {
            id
            date
            value
            sampleCount
          }
          monthly {
            id
            month
            value
            sampleCount
          }
        }
        weight {
          unit
          daily {
            id
            date
            value
            source
            qualityFlags
            bySource {
              source
              value
              observationCount
              coverageMinutes
            }
          }
          overview {
            latest {
              id
              date
              value
              source
              qualityFlags
              bySource {
                source
                value
                observationCount
                coverageMinutes
              }
            }
            previous {
              id
              date
              value
              source
              qualityFlags
              bySource {
                source
                value
                observationCount
                coverageMinutes
              }
            }
            average7Day
            average30Day
            changeFromPrevious
            sampleCount
          }
          rolling7Day {
            id
            date
            value
            sampleCount
          }
          monthly {
            id
            month
            value
            sampleCount
          }
        }
      }
    }
  }
`);
