import { graphql } from "~/types/__generated__";

/**
 * Healthspan page query. One query per page, per Apollo's guidance.
 *
 * `factors` are selected on `latest` only, not on every `trend` day: the page
 * renders factor cards for the latest estimate and charts only age and pace
 * over the trend (`HealthspanTrendCharts`), so per-day factors were ~280 KB
 * of the response that nothing drew. `latest` is the same `HealthspanDay` as
 * the last trend entry (same `id`), so the cache merges them into one entity
 * rather than letting two copies drift apart.
 *
 * `trend` takes an optional `range`, left unset: the page charts the full
 * history.
 *
 * Written with the codegen `graphql()` function rather than `gql`, so the
 * returned document carries its own result and variable types.
 */
export const HEALTHSPAN_QUERY = graphql(`
  query HealthspanPage {
    viewer {
      analytics {
        id
        timeZone
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
          trend {
            id
            date
            chronologicalAgeYears
            healthAgeYears
            ageDeltaYears
            paceOfAging
            qualityFlags
          }
        }
      }
    }
  }
`);
