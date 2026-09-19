/**
 * TEMPORARY — remove once every page is migrated off the legacy pipeline.
 *
 * Shows, at the top of each page, which data path it is on: the new
 * HCGateway GraphQL API or the legacy in-repo analytics pipeline. This exists
 * so the migration's progress is visible in the running app rather than only
 * in GRAPHQL_MIGRATION_REDUNDANCY.md.
 *
 * When the migration is done: delete this component, its usages, and the
 * matching section in GRAPHQL_MIGRATION_REDUNDANCY.md.
 */

export type DataPath = "graphql" | "legacy-pipeline";

const styles: Record<
  DataPath,
  { dot: string; border: string; label: string; detail: string }
> = {
  graphql: {
    dot: "bg-emerald-400 shadow-[0_0_10px_theme(colors.emerald.400)]",
    border: "border-emerald-400/30 bg-emerald-950/40",
    label: "Migrated · GraphQL",
    detail: "Reads prepared analytics from HCGateway over GraphQL.",
  },
  "legacy-pipeline": {
    dot: "bg-amber-400 shadow-[0_0_10px_theme(colors.amber.400)]",
    border: "border-amber-400/30 bg-amber-950/40",
    label: "Not migrated · legacy pipeline",
    detail:
      "Still fetches raw records and runs the in-repo analytics pipeline per request.",
  },
};

export function MigrationNotice({
  path,
  note,
}: {
  path: DataPath;
  /** Optional page-specific caveat, e.g. a field the new API can't serve yet. */
  note?: string;
}) {
  const style = styles[path];
  return (
    <aside
      className={`mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-3 py-2 ${style.border}`}
      aria-label="Data source migration status"
    >
      <span
        className={`block size-2 shrink-0 rounded-full ${style.dot}`}
        aria-hidden
      />
      <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-white/90 uppercase">
        {style.label}
      </span>
      <span className="text-xs text-white/55">{note ?? style.detail}</span>
    </aside>
  );
}
