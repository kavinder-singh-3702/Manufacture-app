import { CSSProperties } from "react";
import { inventoryHealth } from "../data";

const statusStyles: Record<string, CSSProperties> = {
  Healthy: {
    backgroundColor: "rgba(246, 184, 168, 0.35)",
    color: "var(--color-plum)",
    borderColor: "rgba(246, 184, 168, 0.65)",
  },
  Low: {
    backgroundColor: "rgba(255, 211, 182, 0.4)",
    color: "#b8576d",
    borderColor: "rgba(255, 211, 182, 0.7)",
  },
  Critical: {
    backgroundColor: "rgba(255, 154, 162, 0.25)",
    color: "#c53048",
    borderColor: "#ff9aa2",
  },
};

const fallbackStatusStyle: CSSProperties = {
  backgroundColor: "var(--surface-muted)",
  color: "var(--color-plum)",
  borderColor: "var(--border-soft)",
};

export const InventoryWidget = () => {
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
            Inventory
          </p>
          <h2 className="text-xl font-semibold text-[#2e1f2c]">Health</h2>
        </div>
        <button className="text-sm font-semibold transition" style={{ color: "var(--color-plum)" }}>
          Open report
        </button>
      </div>
      <ul className="mt-6 space-y-3">
        {inventoryHealth.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border px-4 py-4 shadow-sm"
            style={{
              borderColor: "var(--border-soft)",
              backgroundColor: "var(--surface-muted)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#2e1f2c]">{item.name}</p>
                <p className="text-xs text-[#5c4451]">Qty: {item.quantity}</p>
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
