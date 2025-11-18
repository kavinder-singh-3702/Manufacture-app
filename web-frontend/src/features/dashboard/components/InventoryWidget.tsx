import { CSSProperties } from "react";
import { inventoryHealth } from "../data";

const statusStyles: Record<string, CSSProperties> = {
  Healthy: {
    backgroundColor: "rgba(250, 218, 208, 0.25)",
    color: "var(--color-peach)",
    borderColor: "rgba(250, 218, 208, 0.35)",
  },
  Low: {
    backgroundColor: "rgba(58, 31, 43, 0.35)",
    color: "var(--color-peach)",
    borderColor: "rgba(250, 218, 208, 0.25)",
  },
  Critical: {
    backgroundColor: "rgba(255, 77, 90, 0.2)",
    color: "#ff9aa2",
    borderColor: "#ff9aa2",
  },
};

const fallbackStatusStyle: CSSProperties = {
  backgroundColor: "rgba(46, 46, 58, 0.6)",
  color: "var(--color-peach)",
  borderColor: "rgba(250, 218, 208, 0.2)",
};

export const InventoryWidget = () => {
  return (
    <section
      className="rounded-3xl p-6 shadow-lg shadow-black/20"
      style={{
        border: "1px solid rgba(250, 218, 208, 0.18)",
        backgroundColor: "rgba(46, 46, 58, 0.65)",
        color: "var(--foreground)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "var(--color-peach)" }}>
            Inventory
          </p>
          <h2 className="text-xl font-semibold text-white">Health</h2>
        </div>
        <button
          className="text-sm font-semibold transition"
          style={{ color: "var(--color-peach)" }}
        >
          Open report
        </button>
      </div>
      <ul className="mt-6 space-y-3">
        {inventoryHealth.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border px-4 py-4 shadow-sm"
            style={{
              borderColor: "rgba(250, 218, 208, 0.2)",
              backgroundColor: "rgba(17, 24, 39, 0.55)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="text-xs text-white/70">Qty: {item.quantity}</p>
              </div>
              <span
                className="rounded-full border px-3 py-1 text-xs font-semibold"
                style={statusStyles[item.status] ?? fallbackStatusStyle}
              >
                {item.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
