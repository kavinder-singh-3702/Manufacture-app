import { categorySections } from "../data";

type CategorySection = (typeof categorySections)[number];

type CategoryHighlightsProps = {
  sections?: readonly CategorySection[];
};

const gradients = [
  "linear-gradient(135deg, #fffdf9, #ffe4db)",
  "linear-gradient(135deg, #fff6ef, #fcded2)",
  "linear-gradient(135deg, #fffaf5, #f8dfd3)",
];

export const CategoryHighlights = ({ sections = categorySections }: CategoryHighlightsProps) => {
  return (
    <section
      className="rounded-3xl p-6 shadow-lg shadow-[rgba(20,141,178,0.15)]"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
        color: "var(--foreground)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--primary)" }}>
            Discovery
          </p>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Top categories</h2>
        </div>
        <button className="text-sm font-semibold transition" style={{ color: "var(--primary)" }}>
          View all
        </button>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {sections.map((section, index) => (
          <article
            key={section.id}
            className="flex flex-col gap-4 rounded-2xl border p-5 shadow-sm"
            style={{
              borderColor: "var(--border)",
              background: gradients[index % gradients.length],
            }}
          >
            <div className="space-y-1 rounded-2xl bg-white/80 p-4 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--primary)" }}>
                {section.highlight}
              </p>
              <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                {section.title}
              </h3>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface)",
                    color: "var(--primary)",
                  }}
                >
                  <div>
                    <p>{item.label}</p>
                    <p className="text-xs font-medium text-[var(--foreground)]">{item.detail}</p>
                  </div>
                  <span className="text-lg text-[var(--medium-gray)]">›</span>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
