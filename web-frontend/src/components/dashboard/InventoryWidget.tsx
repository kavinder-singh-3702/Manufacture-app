import { inventoryHealth } from "../../data/dashboard";

const statusColors: Record<string, string> = {
  Healthy: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Low: "bg-amber-50 text-amber-700 border-amber-100",
  Critical: "bg-rose-50 text-rose-700 border-rose-100",
};

export const InventoryWidget = () => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">Inventory</p>
          <h2 className="text-xl font-semibold text-slate-900">Health</h2>
        </div>
        <button className="text-sm font-semibold text-slate-600 hover:text-slate-900">Open report</button>
      </div>
      <ul className="mt-6 space-y-3">
        {inventoryHealth.map((item) => (
          <li key={item.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[item.status] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
                {item.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
