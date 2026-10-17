import type { ReactNode } from "react";
import type { BackendDiagnostics } from "~/server/health/backendDiagnostics";

/** Frame shared by the raw "Source records" sections on metric pages. */
export function SourceRecordsSection({
  description,
  actions,
  children,
}: {
  description: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className="mt-8 min-w-0 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5"
      aria-labelledby="source-records-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl min-w-0">
          <h2
            id="source-records-heading"
            className="text-xl font-bold tracking-tight"
          >
            Source records
          </h2>
          <div className="mt-1 text-sm text-white/70">{description}</div>
        </div>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** In-section stand-in while the records stream in after the charts. */
export function SourceRecordsLoading() {
  return (
    <SourceRecordsSection description="Loading the raw records…">
      <div className="h-24 animate-pulse rounded-lg bg-white/5" />
    </SourceRecordsSection>
  );
}

/** The records query failed; the charts above are unaffected. */
export function SourceRecordsError({
  diagnostics,
}: {
  diagnostics: BackendDiagnostics;
}) {
  return (
    <SourceRecordsSection description="The raw records couldn't be loaded.">
      <div className="rounded-lg border border-red-300/30 bg-red-500/10 p-4 text-sm">
        <p className="font-semibold text-red-200">{diagnostics.title}</p>
        <p className="mt-1 text-white/75">{diagnostics.explanation}</p>
      </div>
    </SourceRecordsSection>
  );
}

export function SourceRecordsEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-white/60">
      {children}
    </div>
  );
}
