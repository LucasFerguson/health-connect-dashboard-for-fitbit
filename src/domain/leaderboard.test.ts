import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  coverageLabel,
  formatMinutes,
  formatStatValue,
  leaders,
  orderedMembers,
  scoreline,
  staleMembers,
  type Leaderboard,
  type LeaderboardMember,
  type LeaderboardStat,
} from "./leaderboard";

const lucas: LeaderboardMember = {
  userId: "l",
  displayName: "Lucas",
  isViewer: false,
  timeZone: "America/Chicago",
  latestDataDate: "2026-10-27",
  analyzedAt: null,
};
const john: LeaderboardMember = {
  ...lucas,
  userId: "j",
  displayName: "John",
  isViewer: true,
  latestDataDate: "2026-10-23",
};

function stat(
  key: string,
  ranking: LeaderboardStat["ranking"],
  ranks: [number | null, number | null],
  values: [number | null, number | null] = [1, 1],
): LeaderboardStat {
  return {
    key,
    category: "sleep",
    label: key,
    unit: "minutes",
    ranking,
    entries: [
      {
        userId: "l",
        value: values[0],
        daysWithData: 5,
        windowDays: 7,
        rank: ranks[0],
      },
      {
        userId: "j",
        value: values[1],
        daysWithData: 3,
        windowDays: 7,
        rank: ranks[1],
      },
    ],
  };
}

void describe("leaderboard formatting", () => {
  void it("formats minutes as hours and minutes, keeping a real zero", () => {
    assert.equal(formatMinutes(432), "7h 12m");
    assert.equal(formatMinutes(420), "7h");
    assert.equal(formatMinutes(0), "0m");
  });

  void it("shows a dash for a missing value, never zero", () => {
    assert.equal(
      formatStatValue(stat("a", "higher_better", [1, null]), null),
      "—",
    );
  });

  void it("describes coverage in nights for sleep", () => {
    const s = stat("a", "higher_better", [1, 2]);
    assert.equal(coverageLabel(s, s.entries[1]!), "3/7 nights");
  });

  void it("puts the viewer first", () => {
    const board = { members: [lucas, john] } as Leaderboard;
    assert.deepEqual(
      orderedMembers(board).map((member) => member.displayName),
      ["John", "Lucas"],
    );
  });
});

void describe("leaders and scoreline", () => {
  const window = {
    days: 7,
    stats: [
      stat("won-by-lucas", "higher_better", [1, 2]),
      stat("won-by-john", "lower_better", [2, 1]),
      stat("tie", "higher_better", [1, 1]),
      stat("unranked", "not_ranked", [null, null]),
      stat("nobody", "higher_better", [null, null], [null, null]),
      stat("lucas-only", "higher_better", [1, null], [400, null]),
    ],
  };

  void it("finds first place, sharing it on a tie", () => {
    assert.deepEqual(leaders(window.stats[2]!), ["l", "j"]);
    assert.deepEqual(leaders(window.stats[3]!), []);
  });

  void it("counts outright wins and ties", () => {
    assert.deepEqual(scoreline(window, [lucas, john]), {
      wins: { l: 2, j: 1 },
      ties: 1,
      contested: 4,
    });
  });
});

void describe("staleMembers", () => {
  void it("flags members whose newest data is over two days old", () => {
    assert.deepEqual(
      staleMembers([lucas, john], "2026-10-27").map(
        ({ member, daysBehind }) => [member.displayName, daysBehind],
      ),
      [["John", 4]],
    );
  });
});
