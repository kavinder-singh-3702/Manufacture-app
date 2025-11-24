const features = [
  {
    title: "Pipeline snapshots",
    description: "Consolidate RFQs, samples, and approvals with clear owners and timelines.",
    tone: "#2563eb",
  },
  {
    title: "Compliance guardrails",
    description: "Keep documents, verifications, and audit events in one secure vault.",
    tone: "#16a34a",
  },
  {
    title: "Supplier intelligence",
    description: "Score partners on responsiveness, quality, and sustainability signals.",
    tone: "#f97316",
  },
  {
    title: "Shared rituals",
    description: "Weekly huddles, sourcing standups, and escalation paths built-in.",
    tone: "#9333ea",
  },
] as const;

const milestones = [
  { title: "Kickoff", detail: "Scope RFQs, agree on SLAs", meta: "Day 1" },
  { title: "Verification", detail: "Docs + site checks complete", meta: "Day 4" },
  { title: "Samples", detail: "QC checklist logged", meta: "Day 9" },
  { title: "Go live", detail: "Supplier in preferred lane", meta: "Day 14" },
] as const;

export const DescriptionSection = () => {
  return (
    <section
      id="overview"
      className="rounded-3xl border p-6 shadow-lg shadow-[#5a304226]/20 md:p-8"
      style={{
        borderColor: "var(--border-soft)",
        backgroundColor: "var(--surface)",
      }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.6em]" style={{ color: "var(--color-plum)" }}>
            Why teams switch
          </p>
          <h2 className="text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
            A web console tailored for manufacturing leaders
          </h2>
          <p className="text-base text-[#5c4451]">
            Build predictable export programs with a single pane of glass. We keep your RFQs, verification steps, and
            supplier health in sync with your mobile workflow so nothing slips.
          </p>
          <div className="flex flex-wrap gap-2">
            {["ISO-ready logs", "Role-aware sharing", "Cross-team dashboards"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--border-soft)] bg-white px-3 py-1 text-xs font-semibold text-[#5a3042]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="grid w-full max-w-xl gap-3 rounded-3xl border border-[var(--border-soft)] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-plum)" }}>
            Onboarding lane
          </p>
          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.title}
                className="flex items-start gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-3"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                  style={{ backgroundColor: ["#0ea5e9", "#16a34a", "#f59e0b", "#5b21b6"][index] }}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#2e1f2c]">{milestone.title}</p>
                  <p className="text-xs text-[#7a5d6b]">{milestone.detail}</p>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#b98b9e]">{milestone.meta}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border p-4 shadow-sm shadow-[#5a304214]"
            style={{
              borderColor: "var(--border-soft)",
              backgroundColor: "var(--surface-muted)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: feature.tone }} />
              <h3 className="text-base font-semibold text-[#2e1f2c]">{feature.title}</h3>
            </div>
            <p className="mt-2 text-sm text-[#5c4451]">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
