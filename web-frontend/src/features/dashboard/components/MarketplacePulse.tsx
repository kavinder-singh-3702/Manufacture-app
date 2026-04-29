import { marketplaceStats } from "../data";

type MarketplacePulseProps = {
  stats?: typeof marketplaceStats;
};

export const MarketplacePulse = ({ stats = marketplaceStats }: MarketplacePulseProps) => {
  return (
    <section
      className="rounded-3xl p-6 shadow-lg shadow-[rgba(20,141,178,0.15)]"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
        color: "var(--foreground)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
            Pulse
          </p>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Marketplace stats</h2>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
          Updated hourly
        </span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="rounded-2xl border px-4 py-6 text-center shadow-sm"
            style={{
              borderColor: "var(--border)",
              background: "linear-gradient(135deg, #fffdf9, var(--background))",
            }}
          >
            <p className="text-2xl font-semibold text-[var(--foreground)]">{stat.value}</p>
            <p className="text-sm text-[var(--foreground)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
