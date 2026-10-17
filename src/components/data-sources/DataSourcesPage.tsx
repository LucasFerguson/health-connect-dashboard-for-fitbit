import { clsx } from "clsx";
import { Card } from "~/components/ui/Card";
import { Label } from "~/components/ui/Label";
import { PageShell } from "~/components/ui/PageShell";
import {
  CATEGORY_ORDER,
  STALE_AFTER_DAYS,
  collectionFor,
  type RecordRow,
  type RecordStatus,
} from "~/domain/dataSources";
import type { DataSourceStatus } from "~/server/health/getDataSourceStatus";

const STATUS: Record<RecordStatus, { label: string; className: string }> = {
  receiving: {
    label: "RECEIVING",
    className: "text-recovery border-recovery/40",
  },
  stalled: {
    label: "STALLED",
    className: "text-caution-text border-caution/50",
  },
  "no-data": { label: "NO DATA", className: "text-ink-200 border-ink-500" },
  "not-collected": {
    label: "NOT COLLECTED",
    className: "text-alert border-alert/40",
  },
};

const numberFormat = new Intl.NumberFormat("en-US");

/** `/data-sources`: a live, documentation-style map from every Health
 * Connect record type to what is stored and what the dashboard does with it. */
export function DataSourcesPage({ status }: { status: DataSourceStatus }) {
  const day = dayFormatter(status.timeZone);
  const collected = status.rows.filter((row) => row.collected);
  const withData = status.rows.filter((row) => row.records > 0);

  return (
    <PageShell maxWidth="max-w-6xl" className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-display text-ink-0 text-2xl tracking-[.12em]">
            DATA SOURCES
          </h1>
          <Label>LIVE INVENTORY · {status.timeZone.toUpperCase()}</Label>
        </div>
        <p className="text-ink-100 max-w-3xl text-sm leading-6">
          Devices write to Android Health Connect. The HCGateway phone app reads
          the record types it has permission for and uploads them, and the
          backend stores each type in its own collection and builds the
          dashboard&apos;s analytics from some of them. Below is every record
          type, whether the app collects it, what has actually landed, and which
          pages use it.
        </p>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="RECORDS STORED"
            value={numberFormat.format(status.totalRecords)}
          />
          <Stat
            label="TYPES WITH DATA"
            value={`${withData.length} / ${collected.length} collected`}
          />
          <Stat
            label="SPAN"
            value={
              status.earliest && status.latest
                ? `${day(status.earliest)} → ${day(status.latest)}`
                : "—"
            }
          />
          <Stat
            label="LAST PHONE UPLOAD"
            value={
              status.lastPhoneUpload ? day(status.lastPhoneUpload) : "never"
            }
          />
        </dl>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-ink-0 text-lg tracking-[.1em]">
          SOURCES
        </h2>
        <p className="text-ink-100 text-sm">
          The apps that wrote the stored records, and when each last wrote
          anything. A source silent for more than {STALE_AFTER_DAYS} days has
          probably stopped syncing to Health Connect.
        </p>
        <ul className="divide-ink-600 divide-y">
          {status.sources.map((source) => (
            <li
              key={source.label}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2"
            >
              <span className="text-ink-0 text-sm">{source.label}</span>
              <span className="text-ink-100 flex items-baseline gap-3 font-mono text-xs">
                {numberFormat.format(source.records)} records · last{" "}
                {source.latest ? day(source.latest) : "—"}
                {source.stale ? (
                  <StatusChip className={STATUS.stalled.className}>
                    STOPPED
                  </StatusChip>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {CATEGORY_ORDER.map((category) => {
        const rows = status.rows.filter((row) => row.category === category);
        return (
          <Card key={category} className="flex flex-col gap-1">
            <h2 className="font-display text-ink-0 mb-1 text-lg tracking-[.1em]">
              {category.toUpperCase()}
            </h2>
            <ul className="divide-ink-600 divide-y">
              {rows.map((row) => (
                <RecordRowItem key={row.type} row={row} day={day} />
              ))}
            </ul>
          </Card>
        );
      })}

      <Card className="flex flex-col gap-2">
        <h2 className="font-display text-ink-0 text-lg tracking-[.1em]">
          OUTSIDE HEALTH CONNECT
        </h2>
        <p className="text-ink-100 text-sm">
          WHOOP journal answers are imported from WHOOP&apos;s data export, not
          Health Connect: {numberFormat.format(status.habitRecords)} habit
          definitions and entries, used by Habits and Explore.
        </p>
      </Card>

      <p className="text-ink-200 px-1 pb-4 text-xs leading-5">
        Counts, dates and sources are live from HCGateway. Which types the app
        collects mirrors the Android app&apos;s record type list, and &quot;used
        by&quot; mirrors the backend&apos;s analytics mappers; both are noted in{" "}
        <code className="font-mono">src/domain/dataSources.ts</code>. A device
        capability doesn&apos;t guarantee its companion app writes that record
        to Health Connect.
      </p>
    </PageShell>
  );
}

function RecordRowItem({
  row,
  day,
}: {
  row: RecordRow;
  day: (iso: string) => string;
}) {
  const status = STATUS[row.status];
  return (
    <li className="grid gap-x-4 gap-y-1.5 py-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <div className="min-w-0">
        <p className="text-ink-0 text-sm">{row.label}</p>
        <p className="text-ink-200 font-mono text-[10px]">
          {row.type}
          {row.collected ? ` → ${collectionFor(row.type)}` : ""}
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <StatusChip className={status.className}>{status.label}</StatusChip>
          {row.records > 0 ? (
            <span className="text-ink-100 font-mono text-xs">
              {numberFormat.format(row.records)} records
              {row.earliest && row.latest
                ? ` · ${day(row.earliest)} → ${day(row.latest)}`
                : ""}
            </span>
          ) : null}
        </div>
        {row.sources.length > 0 ? (
          <p className="text-ink-100 text-xs">
            From{" "}
            {row.sources
              .map(
                (source) =>
                  `${source.label} (${numberFormat.format(source.records)})`,
              )
              .join(", ")}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-1.5">
          {row.usedBy.length > 0 ? (
            row.usedBy.map((feature) => (
              <span
                key={feature}
                className="bg-brand-950 text-brand-text px-1.5 py-0.5 text-[11px]"
              >
                {feature}
              </span>
            ))
          ) : row.records > 0 ? (
            <span className="text-ink-200 text-[11px]">
              Stored, not used by any page yet
            </span>
          ) : null}
        </div>
        {row.note ? <p className="text-ink-200 text-xs">{row.note}</p> : null}
      </div>
    </li>
  );
}

function StatusChip({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "border px-1.5 py-px font-mono text-[9.5px] tracking-[.08em]",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-850 border-ink-600 border px-3 py-2">
      <dt>
        <Label>{label}</Label>
      </dt>
      <dd className="text-ink-0 mt-1 font-mono text-sm">{value}</dd>
    </div>
  );
}

/** Formats an instant as YYYY-MM-DD in the home time zone. */
function dayFormatter(timeZone: string) {
  const format = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return (iso: string) => format.format(new Date(iso));
}
