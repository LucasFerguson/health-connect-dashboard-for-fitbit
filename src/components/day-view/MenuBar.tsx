"use client";

import Link, { useLinkStatus } from "next/link";
import { clsx } from "clsx";
import { notchStyle } from "~/components/ui/notch";
import { Spinner } from "~/components/ui/Spinner";
import { describeSyncStatus } from "~/domain/dayViewPresentation";
import type { SyncStatusResponse } from "~/server/health/dayAnalyticsSchema";

const MENUS: Array<{ label: string; href?: string; active?: boolean }> = [
  { label: "DAY", href: "/day", active: true },
  { label: "SLEEP", href: "/sleep" },
  { label: "RECOVERY" },
  { label: "STRAIN" },
  { label: "BODY", href: "/weight" },
  { label: "DATA", href: "/data-sources" },
  { label: "VIEW" },
];

/**
 * Band 1 — the 38px top menu bar: logo mark + wordmark, the six top-level
 * menus (DAY is active on this screen; menus without an equivalent existing
 * route render as inert styled labels rather than dead links), and a right
 * cluster with a small phone-ingestion sync indicator (requirement #12,
 * from `GET /api/v2/sync/status`) plus optional user chrome.
 */
export function MenuBar({
  syncStatus,
  userInitials,
}: {
  /** Phone-upload heartbeat, or null if the fetch is still pending/failed
   * (the indicator is simply omitted rather than shown stale or fake). */
  syncStatus?: SyncStatusResponse | null;
  userInitials?: string;
}) {
  const sync = syncStatus ? describeSyncStatus(syncStatus, new Date()) : null;
  return (
    <div className="border-ink-600 bg-ink-950 flex h-[38px] shrink-0 items-center border-b px-4">
      <div className="flex items-center gap-2 pr-[18px]">
        <span
          className="bg-brand-400 block size-[14px]"
          style={notchStyle(6)}
          aria-hidden
        />
        <span className="font-display text-ink-0 text-lg tracking-[.14em]">
          DASHBOARD
        </span>
      </div>
      {MENUS.map((menu) =>
        menu.href ? (
          <Link
            key={menu.label}
            href={menu.href}
            className={clsx(
              "font-display flex h-[38px] items-center gap-1.5 px-[13px] text-[15px] tracking-[.08em] transition-colors duration-[120ms] ease-out",
              menu.active
                ? "text-ink-0 bg-ink-800 shadow-[inset_0_-2px_0_var(--color-brand-400)]"
                : "text-ink-100 hover:bg-ink-800 hover:text-ink-0",
            )}
          >
            {menu.label}
            <MenuLinkIndicator active={menu.active} />
          </Link>
        ) : (
          <span
            key={menu.label}
            className="font-display text-ink-100 flex h-[38px] cursor-default items-center gap-1.5 px-[13px] text-[15px] tracking-[.08em]"
            aria-disabled
          >
            {menu.label}
            <span className="text-ink-200 text-[9px]">▼</span>
          </span>
        ),
      )}
      <div className="text-ink-200 ml-auto flex items-center gap-3.5 font-mono text-[9.5px] tracking-[.08em]">
        {sync ? (
          <span
            title={syncStatus?.note}
            className={clsx(sync.label === "RECEIVING" && "text-recovery")}
          >
            SYNC {sync.label}
            {sync.detail ? ` · ${sync.detail}` : ""}
          </span>
        ) : null}
        {userInitials ? (
          <span className="text-ink-100">{userInitials}</span>
        ) : null}
      </div>
    </div>
  );
}

/** Swaps a menu item's caret for a spinner while its own navigation is
 * pending, via Next's per-link `useLinkStatus` — must be a child of the
 * `Link` it reports on, not the bar itself, so each menu item's indicator
 * reflects only that item's navigation. */
function MenuLinkIndicator({ active }: { active?: boolean }) {
  const { pending } = useLinkStatus();
  if (pending) {
    return <Spinner size={9} color="currentColor" />;
  }
  return (
    <span
      className={clsx("text-[9px]", active ? "text-ink-100" : "text-ink-200")}
    >
      ▼
    </span>
  );
}
