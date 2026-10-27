/**
 * GraphQL-backed read for `/leaderboard`. The backend serves boards the
 * analytics worker already computed; this only lowercases the enums into
 * the domain's string unions.
 */
import type {
  Leaderboard,
  LeaderboardCategory,
  LeaderboardRanking,
} from "~/domain/leaderboard";
import type {
  LeaderboardCategory as GraphQLCategory,
  LeaderboardRanking as GraphQLRanking,
} from "~/types/__generated__/graphql";
import { withViewer } from "./graphql/fetchAnalytics";
import { LEADERBOARD_QUERY } from "./graphql/leaderboardQuery";

// Total Records, so a value added to the schema is a compile error here.
const categoryByEnum: Record<GraphQLCategory, LeaderboardCategory> = {
  SLEEP: "sleep",
  ACTIVITY: "activity",
  RECOVERY: "recovery",
};
const rankingByEnum: Record<GraphQLRanking, LeaderboardRanking> = {
  HIGHER_BETTER: "higher_better",
  LOWER_BETTER: "lower_better",
  NOT_RANKED: "not_ranked",
};

/** Throws when GraphQL can't serve it; see `withViewer`. */
export function getLeaderboards() {
  return withViewer("leaderboard", LEADERBOARD_QUERY, (viewer): Leaderboard[] =>
    viewer.leaderboards.map((board) => ({
      id: board.id,
      name: board.name,
      algorithmVersion: board.algorithmVersion,
      computedAt: board.computedAt,
      members: board.members.map((member) => ({ ...member })),
      windows: board.windows.map((window) => ({
        days: window.days,
        stats: window.stats.map((stat) => ({
          key: stat.key,
          category: categoryByEnum[stat.category],
          label: stat.label,
          unit: stat.unit,
          ranking: rankingByEnum[stat.ranking],
          entries: stat.entries.map((entry) => ({ ...entry })),
        })),
      })),
      daily: board.daily.map((member) => ({
        userId: member.userId,
        days: member.days.map((day) => ({ ...day })),
      })),
    })),
  );
}
