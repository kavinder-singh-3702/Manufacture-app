"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  internalInventoryService,
  InternalInventoryItem,
  InternalInventoryDashboard,
  InternalInventoryStatus,
  InternalInventoryMutationPayload,
  InternalInventoryAdjustPayload,
  InternalStockMovementType,
} from "@/src/services/internalInventory";
import { ApiError } from "@/src/lib/api-error";
import { useDashboardContext } from "@/src/features/dashboard/components/user-dashboard/context";

// ── Constants & helpers ───────────────────────────────────────────────────────

const PAGE_SIZE = 20;
const fmt = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

type StockFilter = "all" | InternalInventoryStatus;

const FILTER_CHIPS: { key: StockFilter; label: string }[] = [
  { key: "all",          label: "All" },
  { key: "in_stock",     label: "In stock" },
  { key: "low_stock",    label: "Low stock" },
  { key: "out_of_stock", label: "Out of stock" },
];

const STATUS_STYLE: Record<InternalInventoryStatus, { label: string; color: string; bg: string }> = {
  in_stock:     { label: "In stock",     color: "#166534", bg: "#DCFCE7" },
  low_stock:    { label: "Low stock",    color: "#92400E", bg: "#FEF3C7" },
  out_of_stock: { label: "Out of stock", color: "#991B1B", bg: "#FEE2E2" },
};

// ── Main Container ─────────────────────────────────────────────────────────────

export const InternalInventoryContainer = () => {
  const { activeCompany } = useDashboardContext();
  const hasCompany = Boolean(activeCompany);

  const [dashboard, setDashboard] = useState<InternalInventoryDashboard | null>(null);
  const [items, setItems] = useState<InternalInventoryItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const [adjustItem, setAdjustItem] = useState<InternalInventoryItem | null>(null);
  const [formItem, setFormItem] = useState<InternalInventoryItem | null | "new">(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async (offset = 0, append = false) => {
    if (!hasCompany) { setLoading(false); return; }
    if (append) setLoadingMore(true); else if (offset === 0) setLoading(true);
    setError(null);
    try {
      const [dash, list] = await Promise.all([
        internalInventoryService.getDashboard(),
        internalInventoryService.listItems({
          search: search || undefined,
          status: stockFilter === "all" ? undefined : stockFilter,
          limit: PAGE_SIZE,
          offset,
          sort: "updatedAtDesc",
        }),
      ]);
      setDashboard(dash);
      setItems((prev) => append ? [...prev, ...(list.items ?? [])] : (list.items ?? []));
      setPagination({ total: list.pagination?.total ?? 0, hasMore: list.pagination?.hasMore ?? false, offset });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [hasCompany, search, stockFilter]);

  useEffect(() => { fetchAll(0); }, [fetchAll]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const refresh = useCallback(() => { setRefreshing(true); fetchAll(0); }, [fetchAll]);
  const loadMore = () => { if (!pagination.hasMore || loadingMore) return; fetchAll(pagination.offset + PAGE_SIZE, true); };

  if (!hasCompany) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl py-20 text-center"
        style={{ border: "1px dashed var(--border)", backgroundColor: "var(--card)" }}>
        <span className="text-5xl">🏢</span>
        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Company required</p>
        <p className="text-sm max-w-xs" style={{ color: "var(--medium-gray)" }}>
          Internal inventory is tracked per company. Select or create a company to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>
            Internal Stock
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Internal Inventory</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--medium-gray)" }}>
            Track stock for analytics and operations — independent from marketplace listings.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} disabled={refreshing}
            className="rounded-xl px-3.5 py-2 text-sm font-semibold transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ border: "1px solid var(--border)", color: "var(--medium-gray)", backgroundColor: "var(--surface)" }}>
            {refreshing ? "Refreshing…" : "↻ Refresh"}
          </button>
          <button onClick={() => setFormItem("new")}
            className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--primary)" }}>
            + Add item
          </button>
        </div>
      </motion.div>

      {/* Dashboard metrics */}
      {dashboard && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl"
          style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
          <div className="border-b px-5 py-3.5" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
              Stock Overview
            </p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-3 lg:grid-cols-5"
            style={{ borderColor: "var(--border)" }}>
            {[
              { label: "Items",       value: dashboard.totalItems.toLocaleString("en-IN"),    color: "var(--foreground)" },
              { label: "Total units", value: dashboard.totalQuantity.toLocaleString("en-IN"), color: "var(--foreground)" },
              { label: "Total value", value: fmt(dashboard.totalValue),                       color: "var(--primary)" },
              { label: "Low stock",   value: String(dashboard.lowStockCount),                 color: "#D97706" },
              { label: "Out of stock",value: String(dashboard.outOfStockCount),               color: "#DC2626" },
            ].map((m) => (
              <div key={m.label} className="px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
                  {m.label}
                </p>
                <p className="mt-1 text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="var(--medium-gray)" strokeWidth="1.8" />
            <path d="M21 21l-4.35-4.35" stroke="var(--medium-gray)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, SKU or category…"
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => (
            <button key={chip.key} onClick={() => setStockFilter(chip.key)}
              className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-all"
              style={{
                backgroundColor: stockFilter === chip.key ? "var(--primary)" : "var(--surface)",
                color: stockFilter === chip.key ? "#fff" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
          <span>{error}</span>
          <button onClick={refresh} className="text-xs font-bold underline ml-4">Retry</button>
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      ) : !items.length ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl py-16 text-center"
          style={{ border: "1px dashed var(--border)", backgroundColor: "var(--card)" }}>
          <span className="text-5xl">📦</span>
          <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>No items yet</p>
          <p className="text-sm max-w-xs" style={{ color: "var(--medium-gray)" }}>
            {search || stockFilter !== "all"
              ? "No items match your search. Try adjusting filters."
              : "Add internal stock items for analytics and planning."}
          </p>
          <button onClick={() => setFormItem("new")}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: "var(--primary)" }}>
            + Add internal item
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item, i) => {
              const s = STATUS_STYLE[item.stockStatus];
              return (
                <motion.div key={item._id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="overflow-hidden rounded-2xl"
                  style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{item.name}</p>
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--medium-gray)" }}>
                        {item.sku ? `${item.sku} · ` : ""}{item.category}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setAdjustItem(item)}
                        className="rounded-xl px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-70"
                        style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)", border: "1px solid rgba(20,141,178,0.2)" }}>
                        Adjust stock
                      </button>
                      <button onClick={() => setFormItem(item)}
                        className="rounded-xl px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-70"
                        style={{ backgroundColor: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 divide-x border-t sm:grid-cols-4"
                    style={{ borderColor: "var(--border)" }}>
                    {[
                      { label: "On hand", value: `${item.onHandQty} ${item.unit}` },
                      { label: "Reorder",  value: `${item.reorderLevel} ${item.unit}` },
                      { label: "Avg cost", value: fmt(item.avgCost) },
                      { label: "Value",    value: fmt(item.totalValue) },
                    ].map((col) => (
                      <div key={col.label} className="px-4 py-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--medium-gray)" }}>
                          {col.label}
                        </p>
                        <p className="mt-0.5 text-sm font-bold" style={{ color: "var(--foreground)" }}>{col.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
          {pagination.hasMore && (
            <div className="flex justify-center pt-2">
              <button onClick={loadMore} disabled={loadingMore}
                className="rounded-xl px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Adjust stock drawer */}
      <AnimatePresence>
        {adjustItem && (
          <AdjustDrawer
            item={adjustItem}
            onClose={() => setAdjustItem(null)}
            onSuccess={() => { setAdjustItem(null); refresh(); }}
          />
        )}
      </AnimatePresence>

      {/* Add / Edit item drawer */}
      <AnimatePresence>
        {formItem !== null && (
          <ItemFormDrawer
            item={formItem === "new" ? null : formItem}
            onClose={() => setFormItem(null)}
            onSuccess={() => { setFormItem(null); refresh(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Adjust Stock Drawer ────────────────────────────────────────────────────────

const MOVEMENT_TYPES: { key: InternalStockMovementType; label: string; desc: string }[] = [
  { key: "in",     label: "Stock in",  desc: "Received goods" },
  { key: "out",    label: "Stock out", desc: "Consumed / dispatched" },
  { key: "adjust", label: "Adjust",    desc: "Correct on-hand qty" },
];

const AdjustDrawer = ({
  item, onClose, onSuccess,
}: { item: InternalInventoryItem; onClose: () => void; onSuccess: () => void }) => {
  const [movementType, setMovementType] = useState<InternalStockMovementType>("in");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState(String(item.avgCost || ""));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) { setError("Enter a valid quantity."); return; }
    setSaving(true);
    setError(null);
    try {
      await internalInventoryService.adjustItem(item._id, {
        movementType,
        quantity: qty,
        unitCost: unitCost ? parseFloat(unitCost) : undefined,
        note: note.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to adjust stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer onClose={onClose}>
      <DrawerHeader title="Adjust Stock" subtitle={item.name} onClose={onClose} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
            Movement type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {MOVEMENT_TYPES.map((t) => (
              <button key={t.key} type="button" onClick={() => setMovementType(t.key)}
                className="rounded-xl py-2.5 text-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: movementType === t.key ? "var(--primary)" : "var(--surface)",
                  color: movementType === t.key ? "#fff" : "var(--foreground)",
                  border: "1px solid var(--border)",
                }}>
                <div>{t.label}</div>
                <div className="text-[10px] font-normal opacity-70">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={`Quantity (${item.unit})`} required>
            <input type="number" min="0.001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
          <Field label="Unit cost (₹)">
            <input type="number" min="0" step="any" value={unitCost} onChange={(e) => setUnitCost(e.target.value)}
              placeholder={String(item.avgCost)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
        </div>

        <Field label="Note (optional)">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Reason for adjustment…"
            className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </Field>

        {error && <p className="text-xs font-semibold" style={{ color: "#DC2626" }}>{error}</p>}

        <DrawerActions onCancel={onClose} submitLabel="Apply adjustment" saving={saving} />
      </form>
    </Drawer>
  );
};

// ── Item Form Drawer ──────────────────────────────────────────────────────────

const ItemFormDrawer = ({
  item, onClose, onSuccess,
}: { item: InternalInventoryItem | null; onClose: () => void; onSuccess: () => void }) => {
  const isNew = !item;
  const [name, setName] = useState(item?.name ?? "");
  const [sku, setSku] = useState(item?.sku ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [unit, setUnit] = useState(item?.unit ?? "pcs");
  const [onHandQty, setOnHandQty] = useState(String(item?.onHandQty ?? 0));
  const [reorderLevel, setReorderLevel] = useState(String(item?.reorderLevel ?? 0));
  const [avgCost, setAvgCost] = useState(String(item?.avgCost ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    if (!category.trim()) { setError("Category is required."); return; }
    setSaving(true);
    setError(null);
    const payload: InternalInventoryMutationPayload = {
      name: name.trim(),
      sku: sku.trim() || undefined,
      category: category.trim(),
      unit: unit.trim() || "pcs",
      onHandQty: parseFloat(onHandQty) || 0,
      reorderLevel: parseFloat(reorderLevel) || 0,
      avgCost: parseFloat(avgCost) || 0,
    };
    try {
      if (isNew) {
        await internalInventoryService.createItem(payload);
      } else {
        await internalInventoryService.updateItem(item._id, payload);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer onClose={onClose}>
      <DrawerHeader title={isNew ? "Add internal item" : "Edit item"} subtitle={isNew ? undefined : item.name} onClose={onClose} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        <Field label="Name" required>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Raw cotton bales"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="SKU">
            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
          <Field label="Category" required>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Raw materials"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Unit">
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs / kg / m"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
          <Field label="On-hand qty">
            <input type="number" min="0" step="any" value={onHandQty} onChange={(e) => setOnHandQty(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
          <Field label="Reorder level">
            <input type="number" min="0" step="any" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
          </Field>
        </div>

        <Field label="Avg cost (₹)">
          <input type="number" min="0" step="any" value={avgCost} onChange={(e) => setAvgCost(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </Field>

        {error && <p className="text-xs font-semibold" style={{ color: "#DC2626" }}>{error}</p>}

        <DrawerActions onCancel={onClose} submitLabel={isNew ? "Create item" : "Save changes"} saving={saving} />
      </form>
    </Drawer>
  );
};

// ── Shared drawer primitives ──────────────────────────────────────────────────

const Drawer = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <>
    <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} />
    <motion.aside
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto shadow-2xl"
      style={{ backgroundColor: "var(--surface)", borderLeft: "1px solid var(--border)" }}
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}>
      {children}
    </motion.aside>
  </>
);

const DrawerHeader = ({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) => (
  <div className="flex items-start justify-between gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
    <div>
      <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>{title}</p>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--medium-gray)" }}>{subtitle}</p>}
    </div>
    <button type="button" onClick={onClose}
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-60"
      style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--medium-gray)" }}>
      ✕
    </button>
  </div>
);

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
      {label}{required && <span className="ml-0.5" style={{ color: "#DC2626" }}>*</span>}
    </label>
    {children}
  </div>
);

const DrawerActions = ({ onCancel, submitLabel, saving }: { onCancel: () => void; submitLabel: string; saving: boolean }) => (
  <div className="flex gap-3 pt-2">
    <button type="button" onClick={onCancel}
      className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
      style={{ border: "1px solid var(--border)", color: "var(--foreground)", backgroundColor: "var(--surface)" }}>
      Cancel
    </button>
    <button type="submit" disabled={saving}
      className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
      style={{ backgroundColor: "var(--primary)" }}>
      {saving ? "Saving…" : submitLabel}
    </button>
  </div>
);
