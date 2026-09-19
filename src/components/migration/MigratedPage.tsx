/**
 * TEMPORARY — remove alongside MigrationNotice once every page is migrated.
 *
 * Wraps a page's content with the migration notice, deriving the status from
 * whether GraphQL actually served the data rather than from a hardcoded flag.
 * That matters: a page can be "migrated" in code but still fall back to the
 * legacy pipeline at runtime (GraphQL down, not configured in the fixture dev
 * container), and the notice should tell the truth about what rendered.
 */
import type { ReactNode } from "react";
import type { RunProvenance } from "~/server/health/graphql/fetchAnalytics";
import { MigrationNotice } from "./MigrationNotice";

export function MigratedPage({
  run,
  source,
  children,
}: {
  /** Run provenance when GraphQL served the page; null when it fell back. */
  run: RunProvenance | null;
  /** The GraphQL field this page reads, e.g. "viewer.analytics.sleepDebt". */
  source: string;
  children: ReactNode;
}) {
  return (
    <>
      <MigrationNotice
        path={run ? "graphql" : "legacy-pipeline"}
        note={
          run
            ? `Reads ${source} from HCGateway GraphQL · ${run.algorithmVersion} · ${run.timeZone}`
            : "GraphQL API unavailable here, so this fell back to the in-repo pipeline."
        }
      />
      {children}
    </>
  );
}
