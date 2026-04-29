import { CSSProperties } from "react";
import { inventoryHealth } from "../data";

const statusStyles: Record<string, CSSProperties> = {
  Healthy: {
    backgroundColor: "rgba(246, 184, 168, 0.35)",
    color: "var(--primary)",
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
  backgroundColor: "var(--background)",
  color: "var(--primary)",
  borderColor: "var(--border)",
};

export const InventoryWidget = () => {
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
            Inventory
          </p>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Health</h2>
        </div>
        <button className="text-sm font-semibold transition" style={{ color: "var(--primary)" }}>
          Open report
        </button>
      </div>
      <ul className="mt-6 space-y-3">
        {inventoryHealth.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border px-4 py-4 shadow-sm"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--background)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{item.name}</p>
                <p className="text-xs text-[var(--foreground)]">Qty: {item.quantity}</p>
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
