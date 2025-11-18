import { marketplaceStats } from "../data";

type MarketplacePulseProps = {
  stats?: typeof marketplaceStats;
};

export const MarketplacePulse = ({ stats = marketplaceStats }: MarketplacePulseProps) => {
  return (
    <section
      className="rounded-3xl p-6 shadow-lg shadow-black/20"
      style={{
        border: "1px solid rgba(250, 218, 208, 0.18)",
        backgroundColor: "rgba(17, 24, 39, 0.75)",
        color: "var(--foreground)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-peach)" }}>
            Pulse
          </p>
          <h2 className="text-xl font-semibold text-white">Marketplace stats</h2>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-peach)" }}>
          Updated hourly
        </span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="rounded-2xl border px-4 py-6 text-center shadow-sm"
            style={{
              borderColor: "rgba(250, 218, 208, 0.25)",
              background: "linear-gradient(135deg, rgba(250, 218, 208, 0.25), rgba(26, 36, 64, 0.8))",
            }}
          >
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
            <p className="text-sm text-white/70">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
