import { graphql } from "~/types/__generated__";

/**
 * `/leaderboard`: every prepared board of the groups the viewer belongs to
 * (HCGateway `Viewer.leaderboards`), with both windows and the 30-day daily
 * series, so the page's 7/30 toggle never refetches.
 */
export const LEADERBOARD_QUERY = graphql(`
  query LeaderboardPage {
    viewer {
      leaderboards {
        id
        name
        algorithmVersion
        computedAt
        members {
          userId
          displayName
          isViewer
          timeZone
          latestDataDate
          analyzedAt
        }
        windows {
          days
          stats {
            key
            category
            label
            unit
            ranking
            entries {
              userId
              value
              daysWithData
              windowDays
              rank
            }
          }
        }
        daily {
          userId
          days {
            date
            sleepMinutes
            recoveryScore
            recoveryBand
            steps
            strain
            workoutMinutes
          }
        }
      }
    }
  }
`);
