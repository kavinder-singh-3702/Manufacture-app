import Link from "next/link";

const heroStats = [
  { label: "Verified suppliers", value: "6,200+", detail: "Pre-vetted across 14 countries" },
  { label: "Response SLA", value: "2h 14m", detail: "Median time to first reply" },
  { label: "On-time projects", value: "94%", detail: "Kept on schedule with shared ops" },
] as const;

const heroChips = ["RFQ routing", "Compliance vault", "Supplier scorecards", "Shared timelines"] as const;

export const HeroEntry = () => {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border p-8 shadow-2xl md:p-10 lg:p-12"
      style={{
        borderColor: "var(--border)",
        background: "radial-gradient(circle at 20% 20%, rgba(246, 184, 168, 0.22), transparent 45%), linear-gradient(135deg, #fff8f3, #fef7ff)",
        color: "var(--foreground)",
        boxShadow: "0 30px 65px rgba(90, 48, 66, 0.18)",
      }}
    >
      <div className="absolute left-1/2 top-[-30%] h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(233,224,255,0.35),_transparent_60%)] blur-2xl" />
      <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--primary)] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
            Live web console
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold leading-tight text-[var(--foreground)] md:text-5xl">
              Bring sourcing, compliance, and partner comms into one collaborative workspace.
            </h1>
            <p className="text-lg text-[var(--foreground)] md:text-xl">
              Manufacture Command mirrors the mobile app but adds deep visibility: shared roadmaps, supplier health, and
              team-wide rituals built for exporters.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-full px-7 py-3 text-base font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: "var(--primary)",
                color: "white",
                boxShadow: "0 15px 30px rgba(90, 48, 66, 0.24)",
              }}
            >
              Get Started
            </Link>
            <Link
              href="/signin"
              className="rounded-full border px-6 py-3 text-base font-semibold"
              style={{ borderColor: "var(--border)", color: "var(--primary)", backgroundColor: "rgba(255,255,255,0.9)" }}
            >
              View Demo
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {heroChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-[var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--primary-dark)]"
              >
                {chip}
              </span>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[var(--border)] bg-white/90 p-4 shadow-sm shadow-[rgba(20,141,178,0.07)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{stat.value}</p>
                <p className="text-sm text-[var(--medium-gray)]">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-[var(--border)] bg-white/80 p-5 shadow-xl shadow-[rgba(20,141,178,0.10)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>
                Command deck
              </p>
              <p className="text-sm text-[var(--foreground)]">An instant feel for today&apos;s workload</p>
            </div>
            <span className="rounded-full bg-[var(--primary-light)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
              Live
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
                RFQs this week
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">18 open</p>
              <div className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                <div className="flex items-center justify-between">
                  <span>Custom garments</span>
                  <span className="text-xs font-semibold text-[#2563eb]">fast lane</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Printed packaging</span>
                  <span className="text-xs font-semibold text-[#16a34a]">green</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>OEM hardware</span>
                  <span className="text-xs font-semibold text-[#f97316]">needs reply</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
                Supplier health
              </p>
              <div className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                {[
                  { label: "Verified", value: 62, tone: "#16a34a" },
                  { label: "Pending docs", value: 14, tone: "#f59e0b" },
                  { label: "Watchlist", value: 4, tone: "#ef4444" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--foreground)]">
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-[var(--background)]">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${Math.min(item.value, 100)}%`, backgroundColor: item.tone }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
              Shared rituals
            </p>
            <div className="mt-3 space-y-3 text-sm text-[var(--foreground)]">
              {[
                { label: "Monday risk huddle", time: "09:00", owner: "Ops", status: "Ready" },
                { label: "Supplier scorecard sync", time: "12:30", owner: "Quality", status: "Agenda set" },
                { label: "Client shipment review", time: "16:15", owner: "CX", status: "Slides in review" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{item.label}</p>
                    <p className="text-xs text-[var(--medium-gray)]">
                      {item.owner} • {item.time}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--primary-light)] px-3 py-1 text-[11px] font-semibold text-[var(--primary)]">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
