import { spotlightPrograms } from "../../data/dashboard";

type SpotlightProgram = (typeof spotlightPrograms)[number];

type SpotlightProgramsProps = {
  programs?: readonly SpotlightProgram[];
};

export const SpotlightPrograms = ({ programs = spotlightPrograms }: SpotlightProgramsProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Spotlight</p>
          <h2 className="text-xl font-semibold text-slate-900">Programs</h2>
        </div>
        <button className="text-sm font-semibold text-slate-600 hover:text-slate-900">Talk to us</button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {programs.map((program) => (
          <article
            key={program.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-teal-700">{program.stat}</p>
            <h3 className="text-lg font-semibold text-slate-900">{program.title}</h3>
            <p className="text-sm text-slate-600">{program.description}</p>
            <button className="text-sm font-semibold text-slate-900">Know more →</button>
          </article>
        ))}
      </div>
    </section>
  );
};
