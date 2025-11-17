import { quickActions } from "../../data/dashboard";

type QuickAction = (typeof quickActions)[number];

type QuickActionsProps = {
  actions?: readonly QuickAction[];
};

export const QuickActions = ({ actions = quickActions }: QuickActionsProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Guided programs</p>
          <h2 className="text-xl font-semibold text-slate-900">Quick actions</h2>
        </div>
        <button className="text-sm font-semibold text-teal-700 hover:text-teal-500">View console</button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {actions.map((action) => (
          <article
            key={action.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/40 p-5 shadow-sm"
          >
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{action.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{action.description}</p>
            </div>
            <button className="mt-4 inline-flex w-max items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              {action.cta}
              <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};
