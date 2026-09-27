import { graphql } from "~/types/__generated__";

/**
 * Healthspan page query. One query per page, per Apollo's guidance.
 *
 * `runId` and friends are selected so the UI can show which prepared analytics
 * run the numbers came from, and so a run change is visible rather than silent.
 *
 * `latest` is deliberately NOT selected: it is the last entry of `trend`, and
 * the adapter derives it from there. Selecting both would double the factor
 * payload for the busiest day and let the two drift apart in the cache (neither
 * `HealthspanDay` nor its factors carry an `id`, so Apollo cannot merge them).
 *
 * `trend` takes an optional `range`, left unset: the page charts the full
 * history and the whole series is only ~500 days.
 *
 * Written with the codegen `graphql()` function rather than `gql`, so the
 * returned document carries its own result and variable types.
 */
export const HEALTHSPAN_QUERY = graphql(`
  query HealthspanPage {
    viewer {
      analytics {
        id
        runId
        algorithmVersion
        timeZone
        processedAt
        healthspan {
          modelVersion
          status
          birthDateConfigured
          methodology
          calibrationReasons
          paceOfAging
          paceWindowDays
          trend {
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
      }
    }
  }
`);
