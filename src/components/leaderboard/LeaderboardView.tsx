"use client";

import { useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { Card } from "~/components/ui/Card";
import { PageShell } from "~/components/ui/PageShell";
import { formatRelativeTime } from "~/domain/dayViewPresentation";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  coverageLabel,
  formatStatValue,
  leaders,
  orderedMembers,
  scoreline,
  staleMembers,
  type Leaderboard,
  type LeaderboardCategory,
  type LeaderboardMember,
  type LeaderboardStat,
} from "~/domain/leaderboard";
import { LeaderboardDailyCharts } from "./LeaderboardDailyCharts";
import { MEMBER_COLORS } from "./memberColors";

const CATEGORY_HUE: Record<LeaderboardCategory, string> = {
  sleep: "var(--color-sleep)",
  activity: "var(--color-strain)",
  recovery: "var(--color-recovery)",
};

/** Mono caption sized to stay readable on a phone. */
function Caption({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "text-ink-200 font-mono text-[11px] tracking-[.08em] uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * `/leaderboard`: one prepared board per group the viewer belongs to. The
 * 7/30-day toggle switches every section at once. Values, coverage and
 * ranks come straight from the backend; a member with no data for a stat
 * shows "—" and can't lead it.
 */
export function LeaderboardView({
  boards,
  today,
}: {
  boards: Leaderboard[];
  /** The viewer's local date, for staleness notes. */
  today: string;
}) {
  const [days, setDays] = useState(7);

  if (boards.length === 0) {
    return (
      <PageShell maxWidth="max-w-5xl">
        <Card className="flex flex-col gap-2">
          <h1 className="font-display text-2xl tracking-[.12em]">
            LEADERBOARD
          </h1>
          <p className="text-ink-100 text-sm">
            You aren&apos;t in a leaderboard group yet. Groups are set up on the
            server with <code>manage_groups.py</code> once both people agree to
            compare.
          </p>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="max-w-5xl" className="flex flex-col gap-6">
      {boards.map((board) => (
        <Board
          key={board.id}
          board={board}
          days={days}
          setDays={setDays}
          today={today}
        />
      ))}
    </PageShell>
  );
}

function Board({
  board,
  days,
  setDays,
  today,
}: {
  board: Leaderboard;
  days: number;
  setDays: (days: number) => void;
  today: string;
}) {
  const members = orderedMembers(board);
  const colorOf = (userId: string) =>
    MEMBER_COLORS[members.findIndex((member) => member.userId === userId)] ??
    MEMBER_COLORS[0]!;
  const window =
    board.windows.find((item) => item.days === days) ?? board.windows[0];
  const stale = staleMembers(members, today);

  return (
    <section className="flex flex-col gap-4">
      <Card topAccent="var(--color-brand-400)" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-display text-2xl tracking-[.12em] uppercase">
            {board.name}
          </h1>
          <WindowToggle
            options={board.windows.map((item) => item.days)}
            value={window?.days ?? days}
            onChange={setDays}
          />
          <Caption className="sm:ml-auto">
            Updated {formatRelativeTime(board.computedAt, new Date())}
          </Caption>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          {members.map((member) => (
            <MemberTag
              key={member.userId}
              member={member}
              color={colorOf(member.userId)}
            />
          ))}
        </div>
        {stale.length > 0 ? (
          <p className="text-caution-text text-sm">
            {stale
              .map(({ member, daysBehind }) =>
                daysBehind === null
                  ? `${member.displayName} has no synced data yet.`
                  : `${member.displayName}'s newest data is from ${daysBehind} days ago, so their side covers fewer days until their phone syncs.`,
              )
              .join(" ")}
          </p>
        ) : null}
        {window ? (
          <Scoreline
            members={members}
            colorOf={colorOf}
            result={scoreline(window, members)}
            days={window.days}
          />
        ) : null}
      </Card>

      {window ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {CATEGORY_ORDER.map((category) => (
            <CategoryCard
              key={category}
              category={category}
              stats={window.stats.filter((stat) => stat.category === category)}
              members={members}
              colorOf={colorOf}
            />
          ))}
        </div>
      ) : null}

      <LeaderboardDailyCharts
        members={members}
        daily={board.daily}
        days={window?.days ?? days}
        colorOf={colorOf}
      />

      <Caption className="normal-case">
        Each person&apos;s days are in their own time zone. Sleep and recovery
        cover the last {window?.days ?? days} nights including last night;
        activity covers the last {window?.days ?? days} full days. HRV and
        resting heart rate depend on the device and the person, so they&apos;re
        shown but not ranked. Model {board.algorithmVersion}.
      </Caption>
    </section>
  );
}

function WindowToggle({
  options,
  value,
  onChange,
}: {
  options: number[];
  value: number;
  onChange: (days: number) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Window"
      className="border-ink-500 flex border"
    >
      {options.map((days) => (
        <button
          key={days}
          type="button"
          role="radio"
          aria-checked={days === value}
          onClick={() => onChange(days)}
          className={clsx(
            "min-h-9 px-3 font-mono text-[12px] tracking-[.08em] transition-colors",
            days === value
              ? "bg-brand-500 text-ink-0"
              : "text-ink-200 hover:bg-ink-800",
          )}
        >
          {days} DAYS
        </button>
      ))}
    </div>
  );
}

function MemberTag({
  member,
  color,
}: {
  member: LeaderboardMember;
  color: string;
}) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <span
        aria-hidden
        className="inline-block size-2.5"
        style={{ backgroundColor: color }}
      />
      <span className="text-ink-0">{member.displayName}</span>
      {member.isViewer ? <Caption>you</Caption> : null}
      <Caption>
        {member.latestDataDate
          ? `data through ${member.latestDataDate}`
          : "no data yet"}
      </Caption>
    </span>
  );
}

function Scoreline({
  members,
  colorOf,
  result,
  days,
}: {
  members: LeaderboardMember[];
  colorOf: (userId: string) => string;
  result: ReturnType<typeof scoreline>;
  days: number;
}) {
  return (
    <div className="border-ink-600 flex flex-wrap items-end gap-x-6 gap-y-2 border-t pt-3">
      {members.map((member) => (
        <div key={member.userId} className="flex items-baseline gap-2">
          <span
            className="font-display text-4xl leading-none"
            style={{ color: colorOf(member.userId) }}
          >
            {result.wins[member.userId] ?? 0}
          </span>
          <span className="text-ink-100 text-sm">{member.displayName}</span>
        </div>
      ))}
      <Caption>
        stats led over {days} days
        {result.ties > 0 ? ` · ${result.ties} tied` : ""} · {result.contested}{" "}
        ranked
      </Caption>
    </div>
  );
}

function CategoryCard({
  category,
  stats,
  members,
  colorOf,
}: {
  category: LeaderboardCategory;
  stats: LeaderboardStat[];
  members: LeaderboardMember[];
  colorOf: (userId: string) => string;
}) {
  return (
    <Card topAccent={CATEGORY_HUE[category]} className="flex flex-col gap-3">
      <h2
        className="font-display text-xl tracking-[.12em] uppercase"
        style={{ color: CATEGORY_HUE[category] }}
      >
        {CATEGORY_LABEL[category]}
      </h2>
      <ul className="flex flex-col gap-3.5">
        {stats.map((stat) => (
          <StatRow
            key={stat.key}
            stat={stat}
            members={members}
            colorOf={colorOf}
          />
        ))}
      </ul>
    </Card>
  );
}

function StatRow({
  stat,
  members,
  colorOf,
}: {
  stat: LeaderboardStat;
  members: LeaderboardMember[];
  colorOf: (userId: string) => string;
}) {
  const first = leaders(stat);
  const tied = first.length > 1;
  const peak = Math.max(
    ...stat.entries.map((entry) => Math.abs(entry.value ?? 0)),
    0,
  );

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-ink-50 text-sm">{stat.label}</span>
        <Caption>
          {stat.ranking === "not_ranked"
            ? "not ranked"
            : stat.ranking === "lower_better"
              ? "lower wins"
              : tied
                ? "tied"
                : ""}
        </Caption>
      </div>
      {members.map((member) => {
        const entry = stat.entries.find(
          (item) => item.userId === member.userId,
        );
        const value = entry?.value ?? null;
        const leads = !tied && first.includes(member.userId);
        const color = colorOf(member.userId);
        return (
          <div
            key={member.userId}
            className="grid grid-cols-[5.5rem_1fr] items-center gap-2"
          >
            <span
              className={clsx(
                "font-mono text-[13px] tabular-nums",
                leads ? "text-ink-0 font-semibold" : "text-ink-100",
              )}
            >
              {leads ? "▲ " : ""}
              {formatStatValue(stat, value)}
            </span>
            <div className="flex items-center gap-2">
              <div className="bg-ink-700 h-1.5 flex-1">
                <div
                  className="h-full"
                  style={{
                    width:
                      value === null || peak === 0
                        ? "0%"
                        : `${(Math.abs(value) / peak) * 100}%`,
                    backgroundColor: color,
                    opacity: leads || first.length === 0 || tied ? 1 : 0.5,
                  }}
                />
              </div>
              {entry ? (
                <Caption className="w-[6.5rem] shrink-0 text-right normal-case">
                  {coverageLabel(stat, entry)}
                </Caption>
              ) : null}
            </div>
          </div>
        );
      })}
    </li>
  );
}
