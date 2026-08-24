export function DeviceIllustration({ kind }: { kind: "whoop" | "pixel" }) {
  if (kind === "pixel") {
    return (
      <div
        className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-sky-300/20 to-violet-500/10"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/2 h-36 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800 shadow-xl" />
        <div className="absolute top-1/2 left-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[7px] border-slate-300 bg-slate-950 shadow-2xl shadow-sky-300/20">
          <div className="size-14 rounded-full border border-sky-300/30 bg-[radial-gradient(circle_at_35%_30%,#7dd3fc,#4338ca_45%,#0f172a_70%)]" />
        </div>
        <div className="absolute top-1/2 right-[calc(50%-3.25rem)] h-7 w-2 -translate-y-1/2 rounded-r bg-slate-300" />
      </div>
    );
  }

  return (
    <div
      className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-300/15 to-cyan-500/5"
      aria-hidden="true"
    >
      <div className="absolute top-1/2 left-1/2 h-20 w-60 -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-[2.2rem] bg-[repeating-linear-gradient(90deg,#20282b_0,#20282b_4px,#151b1d_4px,#151b1d_8px)] shadow-2xl" />
      <div className="absolute top-1/2 left-1/2 grid h-24 w-20 -translate-x-1/2 -translate-y-1/2 -rotate-6 place-items-center rounded-2xl border border-white/10 bg-[#202629] shadow-xl">
        <div className="grid size-14 grid-cols-2 gap-1 rounded-xl bg-black/60 p-3">
          <i className="rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
          <i className="rounded-full bg-red-400 shadow-[0_0_10px_#f87171]" />
          <i className="rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
          <i className="rounded-full bg-red-300 shadow-[0_0_10px_#fca5a5]" />
        </div>
      </div>
    </div>
  );
}
