import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adaptHabits } from "./habitsAdapter";

const raw = (
  date: string,
  answeredYes: boolean,
  notes: string | null = null,
) => ({
  id: `e:${date}:${answeredYes}`,
  date,
  cycleStartLocal: `${date}T06:00:00`,
  cycleEndLocal: `${date}T23:00:00`,
  answeredYes,
  notes,
});

void describe("adaptHabits", () => {
  void it("drops entries with malformed dates and sorts the rest", () => {
    const [habit] = adaptHabits([
      {
        id: "h",
        source: "whoop",
        question: " Consumed caffeine? ",
        firstSeenDate: "2026-01-09",
        lastSeenDate: "2026-04-08",
        entryCount: 19,
        entries: [
          raw("2026-01-10", false, "  "),
          raw("2026-13-01", true),
          raw("2026-01-09", true, " note "),
        ],
      },
    ]);
    assert.equal(habit?.question, "Consumed caffeine?");
    assert.deepEqual(
      habit?.entries.map((e) => [e.date, e.answeredYes, e.notes]),
      [
        ["2026-01-09", true, "note"],
        ["2026-01-10", false, null],
      ],
    );
    // All-time bounds are kept as reported, not narrowed to the range.
    assert.equal(habit?.entryCount, 19);
  });

  void it("keeps a question with no entries in range", () => {
    const habits = adaptHabits([
      {
        id: "h",
        source: "whoop",
        question: "Q?",
        firstSeenDate: "2026-01-09",
        lastSeenDate: "2026-04-08",
        entryCount: 19,
        entries: [],
      },
    ]);
    assert.equal(habits.length, 1);
    assert.equal(habits[0]?.lastSeenDate, "2026-04-08");
  });
});
