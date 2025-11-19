const highlights = [
  {
    title: "Unified pipelines",
    description: "Track RFQs, sourcing desk updates, and inventory status with a single source of truth.",
  },
  {
    title: "Assisted onboarding",
    description: "Concierge support and templated playbooks help your team launch in minutes, not weeks.",
  },
  {
    title: "Secure collaboration",
    description: "Session-based authentication, role controls, and audit trails mirror the mobile safeguards.",
  },
] as const;

export const DescriptionSection = () => {
  return (
    <section
      className="rounded-3xl p-6 shadow-lg shadow-[#5a304226]/20"
      style={{
        border: "1px solid var(--border-soft)",
        backgroundColor: "var(--surface)",
      }}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.6em]" style={{ color: "var(--color-plum)" }}>
          Description
        </p>
        <h2 className="text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
          Designed for modern manufacturing teams
        </h2>
        <p className="text-base text-[#5c4451]">
          Web and mobile stay in sync so planners, sales, and leadership understand what&apos;s happening across the
          supply chain. Highlight the programs you already run or spin up new ones on demand.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {highlights.map((highlight) => (
          <article
            key={highlight.title}
            className="rounded-2xl border p-4"
            style={{
              borderColor: "var(--border-soft)",
              backgroundColor: "var(--surface-muted)",
            }}
          >
            <h3 className="text-lg font-semibold" style={{ color: "var(--color-plum)" }}>
              {highlight.title}
            </h3>
            <p className="mt-2 text-sm text-[#5c4451]">{highlight.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
