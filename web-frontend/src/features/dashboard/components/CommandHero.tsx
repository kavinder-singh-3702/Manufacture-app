import { brandPillars } from "../data";

type CommandHeroProps = {
  brandName?: string;
  headline: string;
  description: string;
  pillars?: readonly string[];
};

export const CommandHero = ({
  brandName = "Manufacture Command",
  headline,
  description,
  pillars = brandPillars,
}: CommandHeroProps) => {
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-6 shadow-2xl lg:p-8"
      style={{
        background: "linear-gradient(135deg, #fffdf9, var(--background))",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
        boxShadow: "0 30px 65px rgba(90, 48, 66, 0.12)",
      }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-semibold shadow-inner"
            style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
          >
            MC
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
              Workspace
            </p>
            <p className="text-xl font-semibold text-[var(--foreground)]">{brandName}</p>
          </div>
        </div>
        <button
          className="rounded-full px-4 py-2 text-sm font-semibold transition"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--primary)",
          }}
        >
          Alerts
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
            Empowering Business Connections
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--foreground)] lg:text-4xl">{headline}</h1>
          <p className="mt-3 max-w-2xl text-base text-[var(--foreground)]">{description}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar}
                className="rounded-2xl border px-4 py-3 text-sm font-semibold backdrop-blur"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface)",
                  color: "var(--primary)",
                  boxShadow: "0 15px 30px rgba(90, 48, 66, 0.08)",
                }}
              >
                {pillar}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-6 -top-6 h-48 w-48 rounded-full bg-[rgba(246,184,168,0.35)] blur-3xl" />
          <div
            className="relative rounded-2xl p-6 shadow-inner backdrop-blur"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
              Marketplace search
            </p>
            <div
              className="mt-4 flex items-center gap-3 rounded-full px-4 py-3"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: "var(--background)",
              }}
            >
              <div className="h-3 w-3 rounded-full border-2 border-[var(--primary)]" />
              <input
                placeholder="Search verified sellers"
                className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--medium-gray)] focus:outline-none"
              />
              <button
                className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                style={{ backgroundColor: "var(--primary)", color: "white" }}
              >
                Go
              </button>
            </div>
            <div className="mt-6 space-y-3 text-sm text-[var(--foreground)]">
              <div
                className="flex items-center justify-between rounded-2xl border px-4 py-3"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--background)",
                }}
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>
                    Avg response
                  </p>
                  <p className="text-lg font-semibold text-[var(--foreground)]">4.2 hrs</p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
                >
                  Live
                </span>
              </div>
              <div
                className="rounded-2xl border px-4 py-3"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface)",
                  color: "var(--primary)",
                }}
              >
                Verified sourcing desk monitors your watchlists round the clock.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
