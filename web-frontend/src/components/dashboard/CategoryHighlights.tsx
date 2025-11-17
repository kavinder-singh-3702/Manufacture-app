import { categorySections } from "../../data/dashboard";

type CategorySection = (typeof categorySections)[number];

type CategoryHighlightsProps = {
  sections?: readonly CategorySection[];
};

export const CategoryHighlights = ({ sections = categorySections }: CategoryHighlightsProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Discovery</p>
          <h2 className="text-xl font-semibold text-slate-900">Top categories</h2>
        </div>
        <button className="text-sm font-semibold text-slate-600 hover:text-slate-900">View all</button>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {sections.map((section) => (
          <article
            key={section.id}
            className={`flex flex-col gap-4 rounded-2xl border border-white/70 bg-gradient-to-br p-5 shadow-sm ${section.theme}`}
          >
            <div className="space-y-1 rounded-2xl bg-white/70 p-4 text-slate-900 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">{section.highlight}</p>
              <h3 className="text-lg font-semibold">{section.title}</h3>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-left text-sm font-semibold text-slate-800 backdrop-blur transition hover:border-slate-400"
                >
                  <div>
                    <p>{item.label}</p>
                    <p className="text-xs font-medium text-slate-500">{item.detail}</p>
                  </div>
                  <span className="text-lg text-slate-400">›</span>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
