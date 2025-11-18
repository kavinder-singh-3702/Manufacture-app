import { quickActions } from "../data";

type QuickAction = (typeof quickActions)[number];

type QuickActionsProps = {
  actions?: readonly QuickAction[];
};

export const QuickActions = ({ actions = quickActions }: QuickActionsProps) => {
  return (
    <section
      className="rounded-3xl p-6 shadow-lg shadow-black/20"
      style={{
        border: "1px solid rgba(250, 218, 208, 0.18)",
        backgroundColor: "rgba(26, 36, 64, 0.85)",
        color: "var(--foreground)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-peach)" }}>
            Guided programs
          </p>
          <h2 className="text-xl font-semibold text-white">Quick actions</h2>
        </div>
        <button
          className="text-sm font-semibold transition"
          style={{ color: "var(--color-peach)" }}
        >
          View console
        </button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {actions.map((action) => (
          <article
            key={action.id}
            className="flex flex-col justify-between rounded-2xl p-5 shadow-sm"
            style={{
              border: "1px solid rgba(250, 218, 208, 0.15)",
              background: "linear-gradient(135deg, rgba(59, 31, 43, 0.75), rgba(26, 36, 64, 0.65))",
            }}
          >
            <div>
              <h3 className="text-lg font-semibold text-white">{action.title}</h3>
              <p className="mt-2 text-sm text-white/70">{action.description}</p>
            </div>
            <button
              className="mt-4 inline-flex w-max items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition"
              style={{ backgroundColor: "var(--color-peach)", color: "var(--color-plum)" }}
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
