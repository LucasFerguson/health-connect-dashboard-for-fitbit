import { graphql } from "~/types/__generated__";

/**
 * Data-sources page query.
 *
 * The page only needs to know *whether* each feed has any data, so this selects
 * counts rather than the series themselves: `overview.sampleCount` per metric,
 * and `sleepDebt.latest` (non-null only when sleep exists) for the sleep feed.
 *
 * Deliberately avoids two heavier alternatives: selecting each series' `daily`
 * array just to read its length would transfer thousands of rows to compute six
 * booleans, and `viewer.sources.inventory` takes ~2s because it aggregates the
 * raw collections live. This query is ~1 KB.
 */
export const DATA_SOURCES_QUERY = graphql(`
  query DataSourcesPage {
    viewer {
      analytics {
        runId
        algorithmVersion
        timeZone
        processedAt
        sleepDebt {
          latest {
            date
          }
        }
        steps {
          overview {
            sampleCount
          }
        }
        activeCalories {
          overview {
            sampleCount
          }
        }
        totalCalories {
          overview {
            sampleCount
          }
        }
        restingHeartRate {
          overview {
            sampleCount
          }
        }
        weight {
          overview {
            sampleCount
          }
        }
      }
    }
  }
`);
