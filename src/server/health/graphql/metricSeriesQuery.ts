import { graphql } from "~/types/__generated__";
import { MetricSeriesPageDocument } from "~/types/__generated__/graphql";

/**
 * Query for the metric detail pages (/steps, /calories, /resting-heart-rate,
 * /hrv, /skin-temperature, /weight). They all render through
 * `HealthMetricPage`, so they share one query rather than six near-identical
 * ones — the selection set is the same shape for every series.
 *
 * Each series is behind an `@include(if: $<series>)` variable, and
 * `getMetricSeries(kind)` turns on only the ones that page renders: one, or
 * two for calories (active against total). One document still serves every
 * page, but a page no longer downloads the other series. With entity ids
 * selected, the first five came to ~790 KB; /steps now fetches ~90 KB. Within a
 * series nothing is trimmed: the history chart, year heatmap and monthly chart
 * all span the full history, and `?date=` can select any day's `bySource`.
 *
 * The per-series selection is repeated inline rather than factored into a
 * fragment on purpose. `client-preset` masks fragments behind `$fragmentRefs`,
 * which the adapter would then have to unmask with `useFragment` — a React
 * hook API, in a plain server-side mapping function. Repetition is the lesser
 * evil here.
 *
 * Written with the codegen `graphql()` function rather than `gql`, so the
 * returned document carries its own result and variable types.
 */
const METRIC_SERIES_QUERY_SOURCE = graphql(`
  query MetricSeriesPage(
    $steps: Boolean!
    $activeCalories: Boolean!
    $totalCalories: Boolean!
    $restingHeartRate: Boolean!
    $weight: Boolean!
    $heartRateVariability: Boolean!
    $skinTemperature: Boolean!
  ) {
    viewer {
      analytics {
        id
        timeZone
        steps @include(if: $steps) {
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
        activeCalories @include(if: $activeCalories) {
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
        totalCalories @include(if: $totalCalories) {
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
        restingHeartRate @include(if: $restingHeartRate) {
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
        weight @include(if: $weight) {
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
        heartRateVariability @include(if: $heartRateVariability) {
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
        skinTemperature @include(if: $skinTemperature) {
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

export const METRIC_SERIES_QUERY = MetricSeriesPageDocument;

// Referenced so the source stays live for codegen and lint.
void METRIC_SERIES_QUERY_SOURCE;
