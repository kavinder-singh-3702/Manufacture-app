import { marketplaceStats } from "../../data/dashboard";

type MarketplacePulseProps = {
  stats?: typeof marketplaceStats;
};

export const MarketplacePulse = ({ stats = marketplaceStats }: MarketplacePulseProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Pulse</p>
          <h2 className="text-xl font-semibold text-slate-900">Marketplace stats</h2>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Updated hourly</span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 px-4 py-6 text-center shadow-sm"
          >
            <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
