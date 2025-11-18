import { categorySections } from "../data";

type CategorySection = (typeof categorySections)[number];

type CategoryHighlightsProps = {
  sections?: readonly CategorySection[];
};

const gradients = [
  "linear-gradient(135deg, rgba(250, 218, 208, 0.75), rgba(59, 31, 43, 0.6))",
  "linear-gradient(135deg, rgba(26, 36, 64, 0.8), rgba(46, 46, 58, 0.85))",
  "linear-gradient(135deg, rgba(59, 31, 43, 0.7), rgba(26, 36, 64, 0.6))",
];

export const CategoryHighlights = ({ sections = categorySections }: CategoryHighlightsProps) => {
  return (
    <section
      className="rounded-3xl p-6 shadow-lg shadow-black/20"
      style={{
        border: "1px solid rgba(250, 218, 208, 0.18)",
        backgroundColor: "rgba(46, 46, 58, 0.6)",
        color: "var(--foreground)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-peach)" }}>
            Discovery
          </p>
          <h2 className="text-xl font-semibold text-white">Top categories</h2>
        </div>
        <button
          className="text-sm font-semibold transition"
          style={{ color: "var(--color-peach)" }}
        >
          View all
        </button>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {sections.map((section, index) => (
          <article
            key={section.id}
            className="flex flex-col gap-4 rounded-2xl border p-5 shadow-sm"
            style={{
              borderColor: "rgba(250, 218, 208, 0.2)",
              background: gradients[index % gradients.length],
            }}
          >
            <div className="space-y-1 rounded-2xl bg-white/25 p-4 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-midnight)" }}>
                {section.highlight}
              </p>
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-plum)" }}>
                {section.title}
              </h3>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold text-white transition"
                  style={{
                    borderColor: "rgba(250, 218, 208, 0.35)",
                    backgroundColor: "rgba(17, 24, 39, 0.35)",
                  }}
                >
                  <div>
                    <p>{item.label}</p>
                    <p className="text-xs font-medium text-white/70">{item.detail}</p>
                  </div>
                  <span className="text-lg text-white/70">›</span>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
