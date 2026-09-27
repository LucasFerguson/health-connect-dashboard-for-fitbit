import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  correlationStrength,
  describeCorrelation,
  linearRegression,
  pairSeries,
  pearson,
  pearsonInterval,
  rank,
  shiftDate,
  spearman,
  summarizePairs,
  type DailyValue,
  compareGroups,
  crossTabulate,
  quantile,
  type Pair,
} from "./correlation";

const series = (entries: Record<string, number>): DailyValue[] =>
  Object.entries(entries).map(([date, value]) => ({ date, value }));

const close = (actual: number | null | undefined, expected: number) => {
  assert.ok(actual !== null && actual !== undefined, "expected a number");
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `expected ${expected}, got ${actual}`,
  );
};

void describe("shiftDate", () => {
  void it("moves across month, year and DST boundaries by whole days", () => {
    assert.equal(shiftDate("2026-01-31", 1), "2026-02-01");
    assert.equal(shiftDate("2026-01-01", -1), "2025-12-31");
    assert.equal(shiftDate("2026-03-08", 1), "2026-03-09"); // US DST start
    assert.equal(shiftDate("2024-02-28", 1), "2024-02-29");
    assert.equal(shiftDate("2026-05-10", 0), "2026-05-10");
  });
});

void describe("pairSeries", () => {
  const x = series({
    "2026-01-01": 1,
    "2026-01-02": 2,
    "2026-01-03": 3,
    "2026-01-05": 5,
  });
  const y = series({
    "2026-01-01": 10,
    "2026-01-03": 30,
    "2026-01-04": 40,
    "2026-01-05": 50,
  });

  void it("keeps only dates present in both series", () => {
    assert.deepEqual(pairSeries(x, y), [
      { date: "2026-01-01", yDate: "2026-01-01", x: 1, y: 10 },
      { date: "2026-01-03", yDate: "2026-01-03", x: 3, y: 30 },
      { date: "2026-01-05", yDate: "2026-01-05", x: 5, y: 50 },
    ]);
  });

  void it("drops missing days rather than pairing them with zero", () => {
    const pairs = pairSeries(x, y);
    assert.ok(pairs.every((pair) => pair.x !== 0 && pair.y !== 0));
    assert.ok(!pairs.some((pair) => pair.date === "2026-01-02"));
  });

  void it("drops non-finite values", () => {
    const pairs = pairSeries(
      series({ "2026-01-01": Number.NaN, "2026-01-02": 2, "2026-01-03": 3 }),
      series({ "2026-01-01": 1, "2026-01-02": Infinity, "2026-01-03": 3 }),
    );
    assert.deepEqual(
      pairs.map((pair) => pair.date),
      ["2026-01-03"],
    );
  });

  void it("keeps real zeros", () => {
    const pairs = pairSeries(
      series({ "2026-01-01": 0 }),
      series({ "2026-01-01": 0 }),
    );
    assert.deepEqual(pairs, [
      { date: "2026-01-01", yDate: "2026-01-01", x: 0, y: 0 },
    ]);
  });

  void it("pairs x on day d with y on day d + lag", () => {
    assert.deepEqual(pairSeries(x, y, 1), [
      { date: "2026-01-02", yDate: "2026-01-03", x: 2, y: 30 },
      { date: "2026-01-03", yDate: "2026-01-04", x: 3, y: 40 },
    ]);
    assert.deepEqual(pairSeries(x, y, -2), [
      { date: "2026-01-03", yDate: "2026-01-01", x: 3, y: 10 },
      { date: "2026-01-05", yDate: "2026-01-03", x: 5, y: 30 },
    ]);
  });

  void it("bounds x dates by the window but lets lagged y fall outside it", () => {
    const pairs = pairSeries(x, y, 1, { from: "2026-01-03", to: "2026-01-03" });
    assert.deepEqual(pairs, [
      { date: "2026-01-03", yDate: "2026-01-04", x: 3, y: 40 },
    ]);
    assert.equal(
      pairSeries(x, y, 0, { from: null, to: "2026-01-01" }).length,
      1,
    );
  });

  void it("sorts by date regardless of input order", () => {
    const pairs = pairSeries([...x].reverse(), y);
    assert.deepEqual(
      pairs.map((pair) => pair.date),
      ["2026-01-01", "2026-01-03", "2026-01-05"],
    );
  });
});

void describe("pearson", () => {
  void it("is ±1 for perfect linear relationships", () => {
    assert.equal(pearson([1, 2, 3, 4], [2, 4, 6, 8]), 1);
    assert.equal(pearson([1, 2, 3, 4], [8, 6, 4, 2]), -1);
  });

  void it("matches a hand-computed value", () => {
    // x mean 3, y mean 4: sxy = 6, sxx = 10, syy = 6 → r = 6/√60
    close(pearson([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]), 6 / Math.sqrt(60));
    close(pearson([1, 2, 3, 4, 5], [3, 3, 5, 4, 5]), 5 / Math.sqrt(40));
  });

  void it("is null below three pairs or with no variance", () => {
    assert.equal(pearson([], []), null);
    assert.equal(pearson([1], [1]), null);
    assert.equal(pearson([1, 2], [1, 2]), null);
    assert.equal(pearson([1, 1, 1], [1, 2, 3]), null);
    assert.equal(pearson([1, 2, 3], [5, 5, 5]), null);
  });
});

void describe("rank", () => {
  void it("averages tied ranks", () => {
    assert.deepEqual(rank([10, 20, 20, 30]), [1, 2.5, 2.5, 4]);
    assert.deepEqual(rank([3, 1, 2]), [3, 1, 2]);
  });
});

void describe("spearman", () => {
  void it("is 1 for any monotonic relationship, linear or not", () => {
    assert.equal(spearman([1, 2, 3, 4, 5], [1, 4, 9, 16, 1000]), 1);
    assert.equal(spearman([1, 2, 3, 4], [4, 3, 2, 1]), -1);
  });

  void it("differs from pearson when an outlier dominates", () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [1, 2, 3, 4, 100];
    assert.equal(spearman(xs, ys), 1);
    assert.ok(pearson(xs, ys)! < 0.8);
  });

  void it("handles ties", () => {
    close(spearman([1, 2, 2, 3], [1, 2, 3, 4]), 0.9486832980505138);
  });

  void it("is null below three pairs", () => {
    assert.equal(spearman([1, 2], [2, 1]), null);
  });
});

void describe("linearRegression", () => {
  void it("recovers slope and intercept of an exact line", () => {
    const fit = linearRegression([0, 1, 2, 3], [5, 7, 9, 11]);
    close(fit?.slope, 2);
    close(fit?.intercept, 5);
    close(fit?.rSquared, 1);
  });

  void it("fits noisy data by least squares", () => {
    const fit = linearRegression([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]);
    close(fit?.slope, 0.6);
    close(fit?.intercept, 2.2);
    close(fit?.rSquared, 0.6);
  });

  void it("is null below three pairs or when x is constant", () => {
    assert.equal(linearRegression([1, 2], [1, 2]), null);
    assert.equal(linearRegression([2, 2, 2], [1, 2, 3]), null);
  });

  void it("gives a flat line with r² = 0 when y is constant", () => {
    const fit = linearRegression([1, 2, 3], [4, 4, 4]);
    close(fit?.slope, 0);
    close(fit?.intercept, 4);
    close(fit?.rSquared, 0);
  });
});

void describe("pearsonInterval", () => {
  void it("brackets r and narrows as n grows", () => {
    const small = pearsonInterval(0.5, 10)!;
    const large = pearsonInterval(0.5, 400)!;
    assert.ok(small.low < 0.5 && small.high > 0.5);
    assert.ok(large.high - large.low < small.high - small.low);
    close(large.low, Math.tanh(Math.atanh(0.5) - 1.959964 / Math.sqrt(397)));
  });

  void it("is null when it can't be computed", () => {
    assert.equal(pearsonInterval(null, 50), null);
    assert.equal(pearsonInterval(0.4, 3), null);
    assert.equal(pearsonInterval(1, 50), null);
  });
});

void describe("describeCorrelation", () => {
  void it("labels strength and direction", () => {
    assert.equal(describeCorrelation(0.05), "no clear correlation");
    assert.equal(describeCorrelation(-0.2), "weak negative");
    assert.equal(describeCorrelation(0.35), "moderate positive");
    assert.equal(describeCorrelation(-0.6), "strong negative");
    assert.equal(describeCorrelation(0.9), "very strong positive");
    assert.equal(describeCorrelation(null), null);
  });

  void it("uses inclusive lower band edges", () => {
    assert.equal(correlationStrength(0.1), "weak");
    assert.equal(correlationStrength(0.3), "moderate");
    assert.equal(correlationStrength(-0.5), "strong");
    assert.equal(correlationStrength(0.7), "very strong");
  });
});

void describe("summarizePairs", () => {
  void it("summarises a synthetic lagged relationship", () => {
    // y tomorrow = 2 × x today + 1.
    const x: DailyValue[] = [];
    const y: DailyValue[] = [];
    for (let day = 0; day < 10; day++) {
      const date = shiftDate("2026-02-01", day);
      x.push({ date, value: day });
      y.push({ date: shiftDate(date, 1), value: 2 * day + 1 });
    }
    const lagged = summarizePairs(pairSeries(x, y, 1));
    assert.equal(lagged.n, 10);
    assert.equal(lagged.pearson, 1);
    close(lagged.regression?.slope, 2);
    close(lagged.regression?.intercept, 1);
    assert.deepEqual(lagged.xExtent, { min: 0, max: 9 });
    assert.equal(lagged.description, "very strong positive");
  });

  void it("reports n but no statistics below three pairs", () => {
    const summary = summarizePairs([
      { date: "2026-01-01", yDate: "2026-01-01", x: 1, y: 2 },
      { date: "2026-01-02", yDate: "2026-01-02", x: 2, y: 3 },
    ]);
    assert.equal(summary.n, 2);
    assert.equal(summary.pearson, null);
    assert.equal(summary.spearman, null);
    assert.equal(summary.regression, null);
    assert.equal(summary.pearsonInterval, null);
    assert.equal(summary.description, null);
  });

  void it("handles an empty pairing", () => {
    const summary = summarizePairs([]);
    assert.equal(summary.n, 0);
    assert.equal(summary.xExtent, null);
  });
});

void describe("binary axes", () => {
  const pair = (date: string, x: number, y: number): Pair => ({
    date,
    yDate: date,
    x,
    y,
  });

  void it("quantile interpolates like a spreadsheet", () => {
    assert.equal(quantile([1, 2, 3, 4], 0.5), 2.5);
    assert.equal(quantile([1, 2, 3, 4], 0.25), 1.75);
    assert.equal(quantile([7], 0.75), 7);
    assert.ok(Number.isNaN(quantile([], 0.5)));
  });

  void it("compares the other metric on yes days vs no days", () => {
    // Habit on x (caffeine), sleep minutes on y.
    const comparison = compareGroups(
      [
        pair("2026-01-01", 1, 400),
        pair("2026-01-02", 1, 420),
        pair("2026-01-03", 0, 450),
        pair("2026-01-04", 0, 470),
        pair("2026-01-05", 0, 490),
      ],
      "x",
    );
    assert.equal(comparison.yes?.n, 2);
    assert.equal(comparison.yes?.mean, 410);
    assert.equal(comparison.no?.n, 3);
    assert.equal(comparison.no?.median, 470);
    assert.equal(comparison.meanDifference, -60);
    assert.equal(comparison.medianDifference, -60);
  });

  void it("reads the habit from y when it is on the y axis", () => {
    const comparison = compareGroups(
      [pair("2026-01-01", 8000, 1), pair("2026-01-02", 4000, 0)],
      "y",
    );
    assert.equal(comparison.yes?.mean, 8000);
    assert.equal(comparison.no?.mean, 4000);
  });

  void it("has no difference when a group is empty", () => {
    const comparison = compareGroups([pair("2026-01-01", 1, 400)], "x");
    assert.equal(comparison.no, null);
    assert.equal(comparison.meanDifference, null);
  });

  void it("cross-tabulates two habits", () => {
    assert.deepEqual(
      crossTabulate([
        pair("a", 1, 1),
        pair("b", 1, 0),
        pair("c", 1, 0),
        pair("d", 0, 1),
        pair("e", 0, 0),
      ]),
      { yesYes: 1, yesNo: 2, noYes: 1, noNo: 1, n: 5 },
    );
  });
});
