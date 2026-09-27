"use client";

export type TrendRangeDays = 7 | 30 | 180;

const ranges: Array<{ label: string; days: TrendRangeDays }> = [
  { label: "W", days: 7 },
  { label: "M", days: 30 },
  { label: "6M", days: 180 },
];

export function TrendRangeTabs({
  value,
  onChange,
}: {
  value: TrendRangeDays;
  onChange: (days: TrendRangeDays) => void;
}) {
  return (
    <div className="flex rounded-xl bg-black/20 p-1" aria-label="Time range">
      {ranges.map((range) => (
        <button
          key={range.days}
          type="button"
          onClick={() => onChange(range.days)}
          aria-pressed={value === range.days}
          className={`min-w-12 rounded-lg px-4 py-2 text-xs font-bold transition ${
            value === range.days
              ? "bg-white/15 text-white"
              : "text-white/65 hover:text-white"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
