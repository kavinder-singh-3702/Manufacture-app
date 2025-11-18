import { spotlightPrograms } from "../data";

type SpotlightProgram = (typeof spotlightPrograms)[number];

type SpotlightProgramsProps = {
  programs?: readonly SpotlightProgram[];
};

export const SpotlightPrograms = ({ programs = spotlightPrograms }: SpotlightProgramsProps) => {
  return (
    <section
      className="rounded-3xl p-6 shadow-lg shadow-black/20"
      style={{
        border: "1px solid rgba(250, 218, 208, 0.18)",
        backgroundColor: "rgba(26, 36, 64, 0.8)",
        color: "var(--foreground)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-peach)" }}>
            Spotlight
          </p>
          <h2 className="text-xl font-semibold text-white">Programs</h2>
        </div>
        <button
          className="text-sm font-semibold transition"
          style={{ color: "var(--color-peach)" }}
        >
          Talk to us
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {programs.map((program) => (
          <article
            key={program.id}
            className="flex flex-col gap-3 rounded-2xl border p-5 shadow-sm"
            style={{
              borderColor: "rgba(250, 218, 208, 0.2)",
              background: "linear-gradient(135deg, rgba(59, 31, 43, 0.75), rgba(2, 2, 2, 0.35))",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-peach)" }}>
              {program.stat}
            </p>
            <h3 className="text-lg font-semibold text-white">{program.title}</h3>
            <p className="text-sm text-white/75">{program.description}</p>
            <button className="text-sm font-semibold text-white">Know more →</button>
          </article>
        ))}
      </div>
    </section>
  );
};
