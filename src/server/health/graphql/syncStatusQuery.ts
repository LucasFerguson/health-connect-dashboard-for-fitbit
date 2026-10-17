import { graphql } from "~/types/__generated__";

/**
 * Phone-upload heartbeat for the nav's sync indicator and the Docker
 * HEALTHCHECK (both via `/api/sync-status`), plus the analytics job and the
 * current run's completion time for the nav's "analyzing" indicator. Lives under `viewer.ingestion`,
 * not `viewer.analytics`, so it runs through `withViewer` rather than
 * `withAnalytics`.
 */
export const SYNC_STATUS_QUERY = graphql(`
  query SyncStatus {
    viewer {
      ingestion {
        phoneSync {
          observedActive
          state
          lastUploadAt
          activeUntil
          secondsSinceLastUpload
          lastRecordType
          lastRecordCount
          totalUploadRequests
          totalRecordsReceived
          activityWindowSeconds
          note
        }
        analyticsJob {
          status
          reason
          requestedAt
          startedAt
          completedAt
          error
        }
        current {
          completedAt
        }
      }
    }
  }
`);
