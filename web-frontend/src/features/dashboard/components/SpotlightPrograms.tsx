import { spotlightPrograms } from "../data";

type SpotlightProgram = (typeof spotlightPrograms)[number];

type SpotlightProgramsProps = {
  programs?: readonly SpotlightProgram[];
};

export const SpotlightPrograms = ({ programs = spotlightPrograms }: SpotlightProgramsProps) => {
  return (
    <section
      className="rounded-3xl p-6 shadow-lg shadow-[#5a30422a]"
      style={{
        border: "1px solid var(--border-soft)",
        backgroundColor: "var(--surface)",
        color: "var(--foreground)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
            Spotlight
          </p>
          <h2 className="text-xl font-semibold text-[#2e1f2c]">Programs</h2>
        </div>
        <button className="text-sm font-semibold transition" style={{ color: "var(--color-plum)" }}>
          Talk to us
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {programs.map((program) => (
          <article
            key={program.id}
            className="flex flex-col gap-3 rounded-2xl border p-5 shadow-sm"
            style={{
              borderColor: "var(--border-soft)",
              background: "linear-gradient(135deg, #fffdf9, var(--color-linen))",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
              {program.stat}
            </p>
            <h3 className="text-lg font-semibold text-[#2e1f2c]">{program.title}</h3>
            <p className="text-sm text-[#5c4451]">{program.description}</p>
            <button className="text-sm font-semibold text-[#5a3042]">Know more →</button>
          </article>
        ))}
      </div>
    </section>
  );
};
