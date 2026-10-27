/**
 * The friends leaderboard (`/leaderboard`): boards HCGateway's analytics
 * worker prepares for each group of accounts that agreed to compare (see
 * HCGateway `doc/leaderboards-plan.md`). Values, coverage and ranks all
 * come from the backend; this module only formats and summarizes them.
 * A null value means the member had no data for that stat in the window,
 * never zero.
 */

export type LeaderboardCategory = "sleep" | "activity" | "recovery";
export type LeaderboardRanking =
  | "higher_better"
  | "lower_better"
  | "not_ranked";

export interface LeaderboardMember {
  userId: string;
  displayName: string;
  isViewer: boolean;
  timeZone: string;
  /** Newest local date the member has any analytics for. */
  latestDataDate: string | null;
  analyzedAt: string | null;
}

export interface LeaderboardEntry {
  userId: string;
  value: number | null;
  daysWithData: number;
  windowDays: number;
  /** 1 = best; ties share a rank; null when unranked or no value. */
  rank: number | null;
}

export interface LeaderboardStat {
  key: string;
  category: LeaderboardCategory;
  label: string;
  unit: string;
  ranking: LeaderboardRanking;
  entries: LeaderboardEntry[];
}

export interface LeaderboardWindow {
  days: number;
  stats: LeaderboardStat[];
}

export interface LeaderboardDay {
  date: string;
  sleepMinutes: number | null;
  recoveryScore: number | null;
  /** HCGateway's recovery band: low / moderate / high. */
  recoveryBand: string | null;
  steps: number | null;
  strain: number | null;
  workoutMinutes: number | null;
}

export interface LeaderboardMemberDaily {
  userId: string;
  days: LeaderboardDay[];
}

export interface Leaderboard {
  id: string;
  name: string;
  algorithmVersion: string;
  computedAt: string;
  members: LeaderboardMember[];
  windows: LeaderboardWindow[];
  daily: LeaderboardMemberDaily[];
}

export const CATEGORY_ORDER: LeaderboardCategory[] = [
  "sleep",
  "activity",
  "recovery",
];

export const CATEGORY_LABEL: Record<LeaderboardCategory, string> = {
  sleep: "Sleep",
  activity: "Activity",
  recovery: "Recovery",
};

/** Viewer first, so "you" always reads on the left. */
export function orderedMembers(board: Leaderboard): LeaderboardMember[] {
  return [...board.members].sort(
    (a, b) => Number(b.isViewer) - Number(a.isViewer),
  );
}

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const tenths = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

/** "7h 12m" for a minute count; "0m" for a real zero. */
export function formatMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** A stat value for display; "—" when the member has no data. */
export function formatStatValue(stat: LeaderboardStat, value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  switch (stat.unit) {
    case "minutes":
      return formatMinutes(value);
    case "ms":
      return `${whole.format(value)} ms`;
    case "bpm":
      return `${whole.format(value)} bpm`;
    case "score":
      return stat.key === "avgStrain"
        ? tenths.format(value)
        : whole.format(value);
    default:
      return whole.format(value);
  }
}

/** "5/7 nights" — how much of the window the value rests on. */
export function coverageLabel(
  stat: LeaderboardStat,
  entry: LeaderboardEntry,
): string {
  const noun = stat.category === "activity" ? "days" : "nights";
  return `${entry.daysWithData}/${entry.windowDays} ${noun}`;
}

/** The member(s) ranked first for a stat, or [] when it isn't ranked or
 * nobody has a value. Ties return everyone sharing first place. */
export function leaders(stat: LeaderboardStat): string[] {
  if (stat.ranking === "not_ranked") return [];
  return stat.entries
    .filter((entry) => entry.rank === 1)
    .map((entry) => entry.userId);
}

/** Stats each member leads outright in a window (a tie counts for no one),
 * plus how many stats were contested at all. */
export function scoreline(
  window: LeaderboardWindow,
  members: LeaderboardMember[],
): { wins: Record<string, number>; ties: number; contested: number } {
  const wins: Record<string, number> = Object.fromEntries(
    members.map((member) => [member.userId, 0]),
  );
  let ties = 0;
  let contested = 0;
  for (const stat of window.stats) {
    const first = leaders(stat);
    if (first.length === 0) continue;
    contested += 1;
    if (first.length > 1) {
      ties += 1;
      continue;
    }
    wins[first[0]!] = (wins[first[0]!] ?? 0) + 1;
  }
  return { wins, ties, contested };
}

/** Whole days between `date` and `today` (both `YYYY-MM-DD`). */
export function daysBetween(date: string, today: string): number {
  return Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) /
      86_400_000,
  );
}

/** Members whose newest data is more than `thresholdDays` old relative to
 * `today` (or who have none), so the page can say why their side is thin. */
export function staleMembers(
  members: LeaderboardMember[],
  today: string,
  thresholdDays = 2,
): Array<{ member: LeaderboardMember; daysBehind: number | null }> {
  return members
    .map((member) => ({
      member,
      daysBehind: member.latestDataDate
        ? daysBetween(member.latestDataDate, today)
        : null,
    }))
    .filter(
      ({ daysBehind }) => daysBehind === null || daysBehind > thresholdDays,
    );
}
