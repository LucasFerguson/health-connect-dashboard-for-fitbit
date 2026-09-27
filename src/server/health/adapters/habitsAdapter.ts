/**
 * Maps `viewer.habits` onto `domain/habits`. The generated types already
 * guarantee the shape; what they can't guarantee is that a `Date` scalar is
 * a real calendar date, and every bucket and range comparison downstream
 * relies on `YYYY-MM-DD` string order. An entry with a malformed date is
 * dropped (not guessed at), and a question whose all-time bounds are
 * malformed keeps its entries but reports no bounds of its own.
 */
import { isValidDateKey, type Habit, type HabitEntry } from "~/domain/habits";

interface RawEntry {
  id: string;
  date: string;
  cycleStartLocal: string;
  cycleEndLocal: string;
  answeredYes: boolean;
  notes: string | null;
}

interface RawHabit {
  id: string;
  source: string;
  question: string;
  firstSeenDate: string;
  lastSeenDate: string;
  entryCount: number;
  entries: readonly RawEntry[];
}

export function adaptHabitEntries(entries: readonly RawEntry[]): HabitEntry[] {
  return entries
    .filter((entry) => isValidDateKey(entry.date))
    .map((entry) => ({
      id: entry.id,
      date: entry.date,
      answeredYes: entry.answeredYes,
      notes: entry.notes?.trim() ? entry.notes.trim() : null,
      cycleStartLocal: entry.cycleStartLocal,
      cycleEndLocal: entry.cycleEndLocal,
    }))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.cycleStartLocal.localeCompare(b.cycleStartLocal),
    );
}

export function adaptHabits(habits: readonly RawHabit[]): Habit[] {
  return habits
    .map((habit) => {
      const entries = adaptHabitEntries(habit.entries);
      const dates = entries.map((entry) => entry.date);
      const validBounds =
        isValidDateKey(habit.firstSeenDate) &&
        isValidDateKey(habit.lastSeenDate);
      return {
        id: habit.id,
        source: habit.source,
        question: habit.question.trim(),
        // Fall back to the fetched entries' own span: narrower than
        // all-time, but true.
        firstSeenDate: validBounds ? habit.firstSeenDate : (dates[0] ?? ""),
        lastSeenDate: validBounds ? habit.lastSeenDate : (dates.at(-1) ?? ""),
        entryCount: validBounds ? habit.entryCount : entries.length,
        entries,
      };
    })
    .sort((a, b) => a.question.localeCompare(b.question));
}
