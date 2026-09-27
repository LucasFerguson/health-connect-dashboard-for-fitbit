import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_HABIT_VIEW,
  answersByDay,
  formatDateSpan,
  formatPeriod,
  habitColumns,
  habitRangeStats,
  habitSeries,
  habitsSearch,
  isValidDateKey,
  latestResponseDate,
  notesByDay,
  parseHabitsParams,
  periodFor,
  periodQueryRange,
  responseSpan,
  stepAnchor,
  weekStart,
  type Habit,
  type HabitEntry,
} from "./habits";

let nextId = 0;
function entry(
  date: string,
  answeredYes: boolean,
  options: { notes?: string | null; start?: string } = {},
): HabitEntry {
  nextId += 1;
  return {
    id: `e${nextId}`,
    date,
    answeredYes,
    notes: options.notes ?? null,
    cycleStartLocal: options.start ?? `${date}T06:00:00`,
    cycleEndLocal: `${date}T23:00:00`,
  };
}

function habit(question: string, entries: HabitEntry[]): Habit {
  const dates = entries.map((e) => e.date).sort();
  return {
    id: `h:${question}`,
    source: "whoop",
    question,
    firstSeenDate: dates[0] ?? "2026-01-01",
    lastSeenDate: dates.at(-1) ?? "2026-01-01",
    entryCount: entries.length,
    entries,
  };
}

void describe("answersByDay", () => {
  void it("keeps one answer per date and leaves unanswered dates out", () => {
    const days = answersByDay([
      entry("2026-01-02", false),
      entry("2026-01-01", true),
    ]);
    assert.deepEqual([...days.keys()].sort(), ["2026-01-01", "2026-01-02"]);
    assert.equal(days.get("2026-01-01")?.answer, "yes");
    assert.equal(days.get("2026-01-02")?.answer, "no");
    assert.equal(days.has("2026-01-03"), false);
  });

  void it("counts a date whose two cycles disagree as yes, flagged mixed", () => {
    const days = answersByDay([
      entry("2026-01-13", true, { start: "2026-01-13T02:14:10" }),
      entry("2026-01-13", false, { start: "2026-01-12T02:45:47" }),
    ]);
    const day = days.get("2026-01-13");
    assert.equal(day?.answer, "yes");
    assert.equal(day?.mixed, true);
    // Entries in cycle order, so the earlier cycle's "no" comes first.
    assert.deepEqual(
      day?.entries.map((e) => e.answeredYes),
      [false, true],
    );
  });

  void it("two agreeing cycles are not mixed", () => {
    const day = answersByDay([
      entry("2026-01-13", false),
      entry("2026-01-13", false),
    ]).get("2026-01-13");
    assert.equal(day?.answer, "no");
    assert.equal(day?.mixed, false);
  });
});

void describe("habitSeries", () => {
  void it("encodes yes as 1 and no as 0, and omits unanswered days", () => {
    assert.deepEqual(
      habitSeries([
        entry("2026-01-03", true),
        entry("2026-01-01", false),
        // 2026-01-02 unanswered: absent, never 0.
      ]),
      [
        { date: "2026-01-01", value: 0 },
        { date: "2026-01-03", value: 1 },
      ],
    );
  });
});

void describe("habitRangeStats", () => {
  const entries = [
    entry("2026-01-01", true),
    entry("2026-01-02", false),
    entry("2026-01-05", false),
    entry("2026-01-05", true),
    entry("2026-02-01", true),
  ];

  void it("counts responses, answered days and yes days within the range", () => {
    assert.deepEqual(habitRangeStats(entries, "2026-01-01", "2026-01-31"), {
      responses: 4,
      answeredDays: 3,
      yesDays: 2,
      noDays: 1,
      mixedDays: 1,
    });
  });

  void it("treats null bounds as unbounded", () => {
    assert.equal(habitRangeStats(entries, null, null).answeredDays, 4);
    assert.equal(habitRangeStats(entries, "2026-01-05", null).responses, 3);
  });

  void it("is all zeros for a range with no answers", () => {
    assert.deepEqual(habitRangeStats(entries, "2026-03-01", "2026-03-31"), {
      responses: 0,
      answeredDays: 0,
      yesDays: 0,
      noDays: 0,
      mixedDays: 0,
    });
  });
});

void describe("notesByDay", () => {
  void it("de-duplicates the day's journal note repeated on every question", () => {
    const note = "I ate food at 11 p.m.";
    const notes = notesByDay([
      habit("A?", [entry("2026-01-09", true, { notes: note })]),
      habit("B?", [
        entry("2026-01-09", false, { notes: note }),
        entry("2026-01-10", false, { notes: "  " }),
      ]),
    ]);
    assert.deepEqual([...notes], [["2026-01-09", [note]]]);
  });
});

void describe("latestResponseDate and responseSpan", () => {
  const habits = [
    habit("A?", [entry("2026-01-09", true), entry("2026-04-08", false)]),
    habit("B?", [entry("2026-03-31", true)]),
  ];

  void it("finds the latest and earliest answers across questions", () => {
    assert.equal(latestResponseDate(habits), "2026-04-08");
    assert.deepEqual(responseSpan(habits), {
      from: "2026-01-09",
      to: "2026-04-08",
    });
  });

  void it("ignores questions with no entries at all", () => {
    const empty = { ...habit("C?", []), lastSeenDate: "2026-09-01" };
    assert.equal(latestResponseDate([...habits, empty]), "2026-04-08");
    assert.equal(latestResponseDate([empty]), null);
    assert.equal(responseSpan([]), null);
  });
});

void describe("periods", () => {
  void it("weeks run Monday to Sunday", () => {
    // 2026-04-08 is a Wednesday.
    assert.equal(weekStart("2026-04-08"), "2026-04-06");
    assert.equal(weekStart("2026-04-06"), "2026-04-06");
    assert.equal(weekStart("2026-04-12"), "2026-04-06");
    assert.deepEqual(periodFor("week", "2026-04-08"), {
      view: "week",
      from: "2026-04-06",
      to: "2026-04-12",
    });
  });

  void it("months are calendar months, including leap February", () => {
    assert.deepEqual(periodFor("month", "2026-04-08"), {
      view: "month",
      from: "2026-04-01",
      to: "2026-04-30",
    });
    assert.equal(periodFor("month", "2028-02-10").to, "2028-02-29");
    assert.deepEqual(periodFor("all", "2026-04-08"), {
      view: "all",
      from: null,
      to: null,
    });
  });

  void it("steps by a whole period", () => {
    assert.equal(stepAnchor("week", "2026-04-08", -1), "2026-03-30");
    assert.equal(stepAnchor("week", "2026-04-08", 1), "2026-04-13");
    assert.equal(stepAnchor("month", "2026-01-31", 1), "2026-02-01");
    assert.equal(stepAnchor("month", "2026-01-15", -1), "2025-12-01");
    assert.equal(stepAnchor("all", "2026-01-15", 1), "2026-01-15");
  });

  void it("maps a period onto a UTC-midnight half-open range", () => {
    assert.deepEqual(periodQueryRange(periodFor("month", "2026-04-08")), {
      start: "2026-04-01T00:00:00Z",
      endExclusive: "2026-05-01T00:00:00Z",
    });
    assert.equal(periodQueryRange(periodFor("all", "2026-04-08")), null);
  });
});

void describe("habitColumns", () => {
  void it("has one day column per date for week and month views", () => {
    const columns = habitColumns("week", "2026-04-06", "2026-04-12");
    assert.equal(columns.length, 7);
    assert.deepEqual(columns[0], {
      from: "2026-04-06",
      to: "2026-04-06",
      kind: "day",
    });
    assert.equal(habitColumns("month", "2026-02-01", "2026-02-28").length, 28);
  });

  void it("buckets the all view into ISO weeks clipped to the span", () => {
    // Jan 9 2026 is a Friday; Apr 8 a Wednesday.
    const columns = habitColumns("all", "2026-01-09", "2026-04-08");
    assert.equal(columns.length, 14);
    assert.deepEqual(columns[0], {
      from: "2026-01-09",
      to: "2026-01-11",
      kind: "week",
    });
    assert.deepEqual(columns[1], {
      from: "2026-01-12",
      to: "2026-01-18",
      kind: "week",
    });
    assert.deepEqual(columns.at(-1), {
      from: "2026-04-06",
      to: "2026-04-08",
      kind: "week",
    });
  });

  void it("is empty for an inverted span", () => {
    assert.deepEqual(habitColumns("all", "2026-02-01", "2026-01-01"), []);
  });
});

void describe("parseHabitsParams", () => {
  void it("defaults to the month holding the latest answer", () => {
    assert.deepEqual(parseHabitsParams({}), {
      view: DEFAULT_HABIT_VIEW,
      date: null,
    });
  });

  void it("round-trips and rejects impossible dates", () => {
    const search = habitsSearch({ view: "week", date: "2026-04-08" });
    assert.equal(search, "view=week&date=2026-04-08");
    assert.deepEqual(parseHabitsParams(new URLSearchParams(search)), {
      view: "week",
      date: "2026-04-08",
    });
    assert.deepEqual(parseHabitsParams({ view: "year", date: "2026-02-31" }), {
      view: DEFAULT_HABIT_VIEW,
      date: null,
    });
    assert.equal(isValidDateKey("2026-02-28"), true);
    assert.equal(isValidDateKey("26-02-28"), false);
  });

  void it("drops the date for the all view", () => {
    assert.equal(habitsSearch({ view: "all", date: "2026-04-08" }), "view=all");
  });
});

void describe("labels", () => {
  void it("formats spans compactly", () => {
    assert.equal(
      formatDateSpan("2026-01-09", "2026-04-08"),
      "Jan 9 – Apr 8, 2026",
    );
    assert.equal(
      formatDateSpan("2026-04-06", "2026-04-12"),
      "Apr 6 – 12, 2026",
    );
    assert.equal(
      formatDateSpan("2025-12-29", "2026-01-04"),
      "Dec 29, 2025 – Jan 4, 2026",
    );
    assert.equal(
      formatPeriod(periodFor("month", "2026-04-08"), null),
      "April 2026",
    );
    assert.equal(
      formatPeriod(periodFor("all", "2026-04-08"), {
        from: "2026-01-09",
        to: "2026-04-08",
      }),
      "All answers · Jan 9 – Apr 8, 2026",
    );
  });
});
