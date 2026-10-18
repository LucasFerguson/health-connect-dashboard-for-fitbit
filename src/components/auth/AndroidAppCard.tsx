import { clsx } from "clsx";
import {
  formatFileSize,
  formatPublishedAgo,
  formatPublishedDate,
} from "~/domain/releases";
import type { PublishedRelease } from "~/server/releases";

interface AndroidAppCardProps {
  /** From `getLatestRelease()`; null when nothing is published. */
  published: PublishedRelease | null;
  /** Render time, so the relative age is computed on the server. */
  now: Date;
  className?: string;
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" />
    </svg>
  );
}

/** "Get the Android app": the latest HCGateway APK published by HCGateway's
 * `scripts/publish-apk.sh`, downloadable from /download/android. Shown on
 * /login, /signup and /settings. */
export function AndroidAppCard({
  published,
  now,
  className,
}: AndroidAppCardProps) {
  return (
    <section
      aria-labelledby="android-app-heading"
      className={clsx(
        "bg-ink-800 border-ink-600 border p-6 max-sm:p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2
          id="android-app-heading"
          className="font-display text-ink-0 text-base tracking-[.1em]"
        >
          GET THE ANDROID APP
        </h2>
        {published ? (
          <span className="text-brand-text font-mono text-xs tracking-[.06em]">
            v{published.release.version}
          </span>
        ) : null}
      </div>

      {published ? (
        <>
          <p className="text-ink-100 mt-1 text-sm">
            HCGateway syncs Health Connect from your phone to this dashboard.
          </p>
          <p className="text-ink-200 mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] tracking-[.04em]">
            <span
              className="inline-flex items-center gap-1.5"
              title={formatPublishedDate(published.release.publishedAt)}
            >
              <ClockIcon />
              <time dateTime={published.release.publishedAt}>
                updated {formatPublishedAgo(published.release.publishedAt, now)}
              </time>
            </span>
            <span aria-hidden>·</span>
            <span>{formatFileSize(published.apkSize)}</span>
          </p>
          <a
            href="/download/android"
            className="border-brand-400 text-brand-text font-display hover:bg-brand-500 hover:text-ink-0 mt-4 flex h-10 items-center justify-center border tracking-[.1em] transition-colors duration-[120ms] max-sm:h-11"
          >
            DOWNLOAD APK
          </a>
          <p className="text-ink-200 mt-3 text-xs">
            On your Android phone: open the file, allow installs from your
            browser if asked.
          </p>
        </>
      ) : (
        <p className="text-ink-200 mt-2 text-sm">
          No Android build published yet.
        </p>
      )}
    </section>
  );
}
