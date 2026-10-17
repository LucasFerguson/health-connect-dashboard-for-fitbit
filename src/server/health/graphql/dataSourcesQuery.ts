import { graphql } from "~/types/__generated__";
import { DataSourcesPageDocument } from "~/types/__generated__/graphql";

/**
 * Data-sources page query: the live per-collection inventory and the source
 * devices behind it, plus the phone's last upload.
 *
 * `sources.inventory` aggregates the raw collections live, so this is slow
 * (seconds, mostly counting heart-rate records). That's acceptable for a
 * reference page nobody polls; don't reuse it on a hot path.
 */
graphql(`
  query DataSourcesPage {
    viewer {
      config {
        homeTimeZone
      }
      ingestion {
        phoneSync {
          lastUploadAt
        }
      }
      sources {
        inventory {
          totalRecords
          earliest
          latest
          signals {
            collection
            records
            earliest
            latest
            bySource {
              source
              count
            }
          }
          sources {
            source
            label
            records
          }
        }
        devices {
          devices {
            id
            sourceLabel
            records
            latest
          }
        }
      }
    }
  }
`);

/** The generated document rather than `graphql()`'s return value, as
 * `overviewQuery.ts` does: the string-literal lookup failed for this query at
 * runtime. The call above stays so codegen still discovers the operation. */
export const DATA_SOURCES_QUERY = DataSourcesPageDocument;
