export interface TrendBreakdownItem {
  label: string;
  count: number;
  color: string;
}

export function TrendBreakdown({
  title,
  total,
  items,
}: {
  title: string;
  total: number;
  items: TrendBreakdownItem[];
}) {
  return (
    <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-sm font-semibold tracking-wide uppercase">
        {title} ({total} recorded days)
      </h2>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/5">
        {items.map((item) => (
          <span
            key={item.label}
            style={{
              backgroundColor: item.color,
              width: `${percentage(item.count, total)}%`,
            }}
          />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: item.color }}
            />
            <strong>{item.count}×</strong>
            <span className="text-white/70">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function percentage(value: number, total: number): number {
  return total ? (value / total) * 100 : 0;
}
