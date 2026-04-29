import { quickActions } from "../data";

type QuickAction = (typeof quickActions)[number];

type QuickActionsProps = {
  actions?: readonly QuickAction[];
};

export const QuickActions = ({ actions = quickActions }: QuickActionsProps) => {
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
            Guided programs
          </p>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Quick actions</h2>
        </div>
        <button className="text-sm font-semibold transition" style={{ color: "var(--primary)" }}>
          View console
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {actions.map((action) => (
          <article
            key={action.id}
            className="flex flex-col justify-between rounded-2xl p-5 shadow-sm"
            style={{
              border: "1px solid var(--border)",
              background: "linear-gradient(135deg, #fffdf9, var(--background))",
            }}
          >
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">{action.title}</h3>
              <p className="mt-2 text-sm text-[var(--foreground)]">{action.description}</p>
            </div>
            <button
              className="mt-4 inline-flex w-max items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
              style={{ backgroundColor: "var(--primary)", color: "white", boxShadow: "0 10px 25px rgba(90, 48, 66, 0.2)" }}
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
