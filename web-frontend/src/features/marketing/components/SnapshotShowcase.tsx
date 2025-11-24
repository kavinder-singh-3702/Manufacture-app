const laneItems = [
  { name: "Eco textiles", owner: "Priya", stage: "Samples", eta: "Jun 12", tone: "#2563eb" },
  { name: "Machining partner", owner: "Liu", stage: "Verification", eta: "Jun 08", tone: "#16a34a" },
  { name: "Packaging run", owner: "Arun", stage: "Production", eta: "Jun 18", tone: "#f59e0b" },
] as const;

const kpis = [
  { label: "On-time shipments", value: "94%", tone: "#16a34a" },
  { label: "Docs approved", value: "87%", tone: "#2563eb" },
  { label: "Response rate", value: "2.3h", tone: "#f97316" },
] as const;

const checklists = [
  { label: "SOC2 attestation uploaded", status: "Logged" },
  { label: "Factory photos refreshed", status: "Pending" },
  { label: "Quarterly ESG notes", status: "Ready" },
] as const;

export const SnapshotShowcase = () => {
  return (
    <section
      id="playbooks"
      className="rounded-3xl border p-6 shadow-lg shadow-[#5a304226]/20 md:p-8"
      style={{ borderColor: "var(--border-soft)", backgroundColor: "white" }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.5em]" style={{ color: "var(--color-plum)" }}>
            Live previews
          </p>
          <h2 className="text-3xl font-semibold text-[#2e1f2c]">Static UI snapshots from the command center</h2>
          <p className="text-sm text-[#5c4451]">
            These panels mirror what your team sees day-to-day: simple, legible, and tuned for quick decisions.
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-peach)] px-4 py-2 text-xs font-semibold text-[var(--color-plum)]">
          Zero setup needed
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
                Supplier lanes
              </p>
              <p className="text-sm text-[#5c4451]">Organized by stage with owners assigned</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#5a3042]">Updated hourly</span>
          </div>
          <div className="space-y-2">
            {laneItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-white px-3 py-2 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.tone }} />
                  <div>
                    <p className="text-sm font-semibold text-[#2e1f2c]">{item.name}</p>
                    <p className="text-xs text-[#7a5d6b]">Owner: {item.owner}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5a3042]">{item.stage}</p>
                  <p className="text-[11px] text-[#b98b9e]">ETA {item.eta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-3xl border border-[var(--border-soft)] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
              KPIs tracked
            </p>
            <div className="mt-3 space-y-3">
              {kpis.map((kpi) => (
                <div key={kpi.label}>
                  <div className="flex items-center justify-between text-sm font-semibold text-[#2e1f2c]">
                    <span>{kpi.label}</span>
                    <span style={{ color: kpi.tone }}>{kpi.value}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-[var(--surface-muted)]">
                    <div className="h-2 rounded-full" style={{ width: "82%", backgroundColor: kpi.tone }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
              Compliance checklist
            </p>
            <div className="mt-3 space-y-2">
              {checklists.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border-soft)] bg-white px-3 py-2"
                >
                  <p className="text-sm font-semibold text-[#2e1f2c]">{item.label}</p>
                  <span className="rounded-full bg-[var(--color-peach)] px-3 py-1 text-[11px] font-semibold text-[var(--color-plum)]">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border-soft)] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
              Notes from the floor
            </p>
            <p className="mt-2 text-sm text-[#5c4451]">
              “We unified vendor chats, document reviews, and ops rituals in under a week. The browser console mirrors
              mobile perfectly.”
            </p>
            <p className="mt-2 text-xs font-semibold text-[#2e1f2c]">Aisha, Head of Supply Ops</p>
          </div>
        </div>
      </div>
    </section>
  );
};
