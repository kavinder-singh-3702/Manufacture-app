import { brandPillars } from "../../data/dashboard";

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
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 p-6 text-white shadow-2xl lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-semibold text-white shadow-inner">
            MC
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Workspace</p>
            <p className="text-xl font-semibold">{brandName}</p>
          </div>
        </div>
        <button className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white hover:bg-white/10">
          Alerts
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-200">Empowering Business Connections</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight lg:text-4xl">{headline}</h1>
          <p className="mt-3 max-w-2xl text-base text-emerald-100/90">{description}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 backdrop-blur"
              >
                {pillar}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-6 -top-6 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative rounded-2xl border border-white/15 bg-white/10 p-6 text-white shadow-inner backdrop-blur">
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">Marketplace search</p>
            <div className="mt-4 flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-4 py-3">
              <div className="h-3 w-3 rounded-full border-2 border-white" />
              <input
                placeholder="Search verified sellers"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/70 focus:outline-none"
              />
              <button className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-teal-900">
                Go
              </button>
            </div>
            <div className="mt-6 space-y-3 text-sm text-white/90">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">Avg response</p>
                  <p className="text-lg font-semibold text-white">4.2 hrs</p>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">Live</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/80">
                Verified sourcing desk monitors your watchlists round the clock.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
