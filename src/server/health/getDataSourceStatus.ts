/**
 * Live inventory for the data-sources page: every Health Connect record type
 * joined with what is stored, from which sources, and when it last arrived.
 */
import {
  buildRecordRows,
  buildSourceRows,
  type RecordRow,
  type SourceRow,
} from "~/domain/dataSources";
import { withViewer } from "./graphql/fetchAnalytics";
import { DATA_SOURCES_QUERY } from "./graphql/dataSourcesQuery";

export interface DataSourceStatus {
  timeZone: string;
  totalRecords: number;
  earliest: string | null;
  latest: string | null;
  lastPhoneUpload: string | null;
  rows: RecordRow[];
  sources: SourceRow[];
  /** Imported outside Health Connect (the WHOOP journal), by collection. */
  habitRecords: number;
}

/** Throws when GraphQL can't serve this page; see `withViewer`. */
export function getDataSourceStatus() {
  return withViewer(
    "data-sources",
    DATA_SOURCES_QUERY,
    (viewer): DataSourceStatus => {
      const { inventory, devices } = viewer.sources;
      const now = new Date();
      return {
        timeZone: viewer.config.homeTimeZone,
        totalRecords: inventory.totalRecords,
        earliest: inventory.earliest,
        latest: inventory.latest,
        lastPhoneUpload: viewer.ingestion.phoneSync.lastUploadAt,
        rows: buildRecordRows(inventory.signals, inventory.sources, now),
        sources: buildSourceRows(devices.devices, now),
        habitRecords: inventory.signals
          .filter((signal) => signal.collection.startsWith("habit"))
          .reduce((sum, signal) => sum + signal.records, 0),
      };
    },
  );
}
