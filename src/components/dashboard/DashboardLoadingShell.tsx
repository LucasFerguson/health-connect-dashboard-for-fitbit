import type { CSSProperties } from "react";
import { DashboardStatusBar } from "./DashboardStatusBar";

/**
 * Server-rendered approximation of the real overview. Every placeholder has
 * roughly the same footprint as the content that replaces it, keeping the
 * page useful and visually stable while the server prepares health data.
 */
export function DashboardLoadingShell() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <DashboardStatusBar state="loading" />

        <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Health <span className="text-violet-300">Dashboard</span>
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Your health data, under your control.
            </p>
          </div>
          <Skeleton className="h-6 w-36 rounded-full" />
        </header>

        <div className="flex flex-col gap-8" aria-hidden>
          <section>
            <Skeleton className="mb-3 h-7 w-48" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <article
                  key={index}
                  className="min-h-28 rounded-xl border border-white/5 bg-white/10 p-4"
                >
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-4 h-8 w-28" />
                  <Skeleton className="mt-3 h-2.5 w-16" />
                </article>
              ))}
            </div>
          </section>

          <article className="rounded-xl border border-white/5 bg-white/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-10 w-56" />
                <Skeleton className="h-3 w-72 max-w-full" />
              </div>
              <Skeleton className="h-24 w-48" />
            </div>
          </article>

          <section>
            <h2 className="mb-3 text-2xl font-bold">Sleep overview</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <article className="min-h-96 rounded-xl bg-white/10 p-4">
                <h3 className="mb-3 text-lg font-semibold">Sleep calendar</h3>
                <CalendarPlaceholder />
              </article>
              <article className="min-h-96 rounded-xl bg-white/10 p-4 lg:col-span-2">
                <h3 className="mb-3 text-lg font-semibold">Sleep stages</h3>
                <ChartPlaceholder />
              </article>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SummaryPlaceholder />
            <SummaryPlaceholder />
          </div>

          <article className="min-h-52 rounded-xl bg-white/10 p-5">
            <Skeleton className="h-6 w-56" />
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}

function Skeleton({
  className,
  style,
}: {
  className: string;
  style?: CSSProperties;
}) {
  return <div className={`dashboard-skeleton ${className}`} style={style} />;
}

function CalendarPlaceholder() {
  return (
    <div className="grid grid-cols-7 gap-2 pt-4">
      {Array.from({ length: 35 }, (_, index) => (
        <Skeleton
          key={index}
          className={`aspect-square min-h-5 ${index % 9 === 0 ? "opacity-45" : ""}`}
        />
      ))}
    </div>
  );
}

function ChartPlaceholder() {
  const heights = [32, 48, 42, 68, 54, 82, 64, 74, 46, 58, 38, 52];
  return (
    <div className="relative mt-5 flex h-72 items-end gap-2 border-b border-l border-white/10 px-4 pb-4">
      <div className="absolute inset-x-0 top-1/4 border-t border-white/5" />
      <div className="absolute inset-x-0 top-1/2 border-t border-white/5" />
      <div className="absolute inset-x-0 top-3/4 border-t border-white/5" />
      {heights.map((height, index) => (
        <Skeleton
          key={index}
          className="min-w-2 flex-1"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function SummaryPlaceholder() {
  return (
    <article className="min-h-52 rounded-xl bg-white/10 p-5">
      <Skeleton className="h-5 w-40" />
      <div className="mt-6 flex items-end justify-between gap-6">
        <div className="space-y-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-24 w-52" />
      </div>
    </article>
  );
}
