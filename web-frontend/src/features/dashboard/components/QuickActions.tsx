import { quickActions } from "../data";

type QuickAction = (typeof quickActions)[number];

type QuickActionsProps = {
  actions?: readonly QuickAction[];
};

export const QuickActions = ({ actions = quickActions }: QuickActionsProps) => {
  return (
    <section
      className="rounded-3xl p-6 shadow-lg shadow-[#5a304226]"
      style={{
        border: "1px solid var(--border-soft)",
        backgroundColor: "var(--surface)",
        color: "var(--foreground)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-plum)" }}>
            Guided programs
          </p>
          <h2 className="text-xl font-semibold text-[#2e1f2c]">Quick actions</h2>
        </div>
        <button className="text-sm font-semibold transition" style={{ color: "var(--color-plum)" }}>
          View console
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {actions.map((action) => (
          <article
            key={action.id}
            className="flex flex-col justify-between rounded-2xl p-5 shadow-sm"
            style={{
              border: "1px solid var(--border-soft)",
              background: "linear-gradient(135deg, #fffdf9, var(--color-linen))",
            }}
          >
            <div>
              <h3 className="text-lg font-semibold text-[#2e1f2c]">{action.title}</h3>
              <p className="mt-2 text-sm text-[#5c4451]">{action.description}</p>
            </div>
            <button
              className="mt-4 inline-flex w-max items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
              style={{ backgroundColor: "var(--color-plum)", color: "white", boxShadow: "0 10px 25px rgba(90, 48, 66, 0.2)" }}
            >
              {action.cta}
              <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};
