import Link from "next/link";
import type { ReactNode } from "react";

export function DailyMetricTile({
  title,
  value,
  secondary,
  source,
  href,
  accent,
}: {
  title: string;
  value: string | null;
  secondary?: ReactNode;
  source?: string | null;
  href?: string;
  accent: string;
}) {
  const content = (
    <article className="group h-full rounded-xl border border-white/10 bg-white/10 p-4 transition hover:border-white/25 hover:bg-white/[0.13]">
      <div
        className="mb-3 h-1 w-10 rounded-full"
        style={{ background: accent }}
      />
      <h3 className="text-sm font-medium text-white/80">{title}</h3>
      {value ? (
        <>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {secondary ? (
            <div className="mt-1 text-sm text-white/80">{secondary}</div>
          ) : null}
          {source ? (
            <p className="mt-3 text-xs text-white/60">Source: {source}</p>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-white/55">No reading for this day</p>
      )}
      {href ? (
        <p className="mt-3 text-xs font-medium text-violet-200 group-hover:text-white">
          Explore history →
        </p>
      ) : null}
    </article>
  );

  return href ? (
    <Link
      href={href}
      className="block h-full rounded-xl focus:ring-2 focus:ring-violet-300 focus:outline-none"
    >
      {content}
    </Link>
  ) : (
    content
  );
}
