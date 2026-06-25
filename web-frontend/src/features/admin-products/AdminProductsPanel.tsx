"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminService, AdminInhouseProduct } from "@/src/services/admin";
import type { ProductCategory, CreateProductInput, ProductStatus } from "@/src/types/product";
import { ApiError } from "@/src/lib/api-error";
import { useConfirm } from "@/src/components/ui/ConfirmDialog";

const PAGE_SIZE = 24;
const fmt = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const STATUS_STYLE: Record<ProductStatus, { label: string; color: string; bg: string }> = {
  draft:    { label: "Draft",    color: "#6B7280", bg: "#F3F4F6" },
  active:   { label: "Active",   color: "#166534", bg: "#DCFCE7" },
  inactive: { label: "Inactive", color: "#92400E", bg: "#FEF3C7" },
  archived: { label: "Archived", color: "#6B7280", bg: "#F3F4F6" },
};

const STOCK_STYLE: Record<string, { color: string; bg: string }> = {
  in_stock:     { color: "#166534", bg: "#DCFCE7" },
  low_stock:    { color: "#92400E", bg: "#FEF3C7" },
  out_of_stock: { color: "#991B1B", bg: "#FEE2E2" },
};

const STATUS_CHIPS: { key: ProductStatus | "all"; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "active",   label: "Active" },
  { key: "draft",    label: "Draft" },
  { key: "inactive", label: "Inactive" },
  { key: "archived", label: "Archived" },
];

export const AdminProductsPanel = () => {
  const [products, setProducts] = useState<AdminInhouseProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, offset: 0 });
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [formProduct, setFormProduct] = useState<AdminInhouseProduct | null | "new">(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirm = useConfirm();

  const load = useCallback(async (offset = 0, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const res = await adminService.listInhouseProducts({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset,
        sort: "createdAt:desc",
      });
      setProducts((prev) => append ? [...prev, ...(res.products ?? [])] : (res.products ?? []));
      setPagination({ total: res.pagination?.total ?? 0, hasMore: res.pagination?.hasMore ?? false, offset });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { load(0); }, [load]);

  useEffect(() => {
    adminService.listInhouseProductCategories().then((r) => setCategories(r.categories ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [searchInput]);

  const adjustQty = async (p: AdminInhouseProduct, delta: number) => {
    setBusyId(p._id);
    try {
      await adminService.adjustInhouseProductQuantity(p._id, delta);
      load(0);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Adjust failed");
    } finally {
      setBusyId(null);
    }
  };

  const removeProduct = async (p: AdminInhouseProduct) => {
    const ok = await confirm({
      title: `Delete "${p.name}"?`,
      message: "This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    setBusyId(p._id);
    try {
      await adminService.deleteInhouseProduct(p._id);
      load(0);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--primary)" }}>Admin</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>In-house Products</h1>
          {!loading && <p className="text-sm mt-0.5" style={{ color: "var(--medium-gray)" }}>{pagination.total.toLocaleString("en-IN")} products</p>}
        </div>
        <button onClick={() => setFormProduct("new")}
          className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: "var(--primary)" }}>
          + New product
        </button>
      </motion.div>

      {/* Search + filters */}
      <div className="space-y-2">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="var(--medium-gray)" strokeWidth="1.8" />
            <path d="M21 21l-4.35-4.35" stroke="var(--medium-gray)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_CHIPS.map((chip) => (
            <button key={chip.key} onClick={() => setStatusFilter(chip.key)}
              className="rounded-full px-3.5 py-1.5 text-xs font-bold transition-all"
              style={{
                backgroundColor: statusFilter === chip.key ? "var(--primary)" : "var(--surface)",
                color: statusFilter === chip.key ? "#fff" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
          <span>{error}</span>
          <button onClick={() => load(0)} className="text-xs font-bold underline ml-4">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      ) : !products.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center" style={{ border: "1px dashed var(--border)" }}>
          <span className="text-4xl">📦</span>
          <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>No products</p>
          <p className="text-sm" style={{ color: "var(--medium-gray)" }}>Create your first in-house product.</p>
          <button onClick={() => setFormProduct("new")} className="mt-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>
            + New product
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => {
              const s = STATUS_STYLE[p.status];
              const stock = p.stockStatus ? STOCK_STYLE[p.stockStatus] : null;
              const busy = busyId === p._id;
              return (
                <motion.div key={p._id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex flex-col overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
                  <div className="relative h-28" style={{ backgroundColor: "var(--surface)" }}>
                    {p.images?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" decoding="async" src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl">📦</div>
                    )}
                    <span className="absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div>
                      <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>{p.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--medium-gray)" }}>{p.category}{p.sku ? ` · ${p.sku}` : ""}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>{fmt(p.price.amount)}</p>
                      {stock && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: stock.bg, color: stock.color }}>
                          {p.stockStatus?.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    {/* Qty control */}
                    <div className="flex items-center gap-2 rounded-xl px-2 py-1.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--background)" }}>
                      <span className="text-[11px] font-semibold" style={{ color: "var(--medium-gray)" }}>Stock</span>
                      <button onClick={() => adjustQty(p, -1)} disabled={busy || p.availableQuantity <= 0}
                        className="ml-auto flex h-6 w-6 items-center justify-center rounded-lg text-sm font-bold disabled:opacity-30"
                        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>−</button>
                      <span className="min-w-8 text-center text-sm font-bold" style={{ color: "var(--foreground)" }}>{p.availableQuantity}</span>
                      <button onClick={() => adjustQty(p, 1)} disabled={busy}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-sm font-bold disabled:opacity-30"
                        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>+</button>
                    </div>
                    <div className="mt-auto flex gap-1.5 pt-1">
                      <button onClick={() => setFormProduct(p)}
                        className="flex-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
                        style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>Edit</button>
                      <button onClick={() => removeProduct(p)} disabled={busy}
                        className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
                        style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>Delete</button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {pagination.hasMore && (
            <div className="flex justify-center pt-1">
              <button onClick={() => load(pagination.offset + PAGE_SIZE, true)} disabled={loadingMore}
                className="rounded-xl px-6 py-2.5 text-sm font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {formProduct !== null && (
          <ProductFormDrawer
            product={formProduct === "new" ? null : formProduct}
            categories={categories}
            onClose={() => setFormProduct(null)}
            onSaved={() => { setFormProduct(null); load(0); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Form Drawer ───────────────────────────────────────────────────────────────

const ProductFormDrawer = ({
  product, categories, onClose, onSaved,
}: {
  product: AdminInhouseProduct | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isNew = !product;
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [subCategory, setSubCategory] = useState(product?.subCategory ?? "");
  const [amount, setAmount] = useState(String(product?.price.amount ?? ""));
  const [unit, setUnit] = useState(product?.unit ?? "");
  const [availableQuantity, setAvailableQuantity] = useState(String(product?.availableQuantity ?? 0));
  const [minStockQuantity, setMinStockQuantity] = useState(String(product?.minStockQuantity ?? 0));
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "draft");
  const [visibility, setVisibility] = useState<"public" | "private">(product?.visibility ?? "public");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim() && category.trim() && parseFloat(amount) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) { setError("Name, category and a valid price are required."); return; }
    setSaving(true);
    setError(null);
    const payload: CreateProductInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      sku: sku.trim() || undefined,
      category: category.trim(),
      subCategory: subCategory.trim() || undefined,
      price: { amount: parseFloat(amount), unit: unit.trim() || undefined },
      availableQuantity: parseInt(availableQuantity, 10) || 0,
      minStockQuantity: parseInt(minStockQuantity, 10) || 0,
      unit: unit.trim() || undefined,
      status,
      visibility,
    };
    try {
      if (isNew) await adminService.createInhouseProduct(payload);
      else await adminService.updateInhouseProduct(product._id, payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" } as const;

  return (
    <>
      <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto shadow-2xl"
        style={{ backgroundColor: "var(--surface)", borderLeft: "1px solid var(--border)" }}
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
          <div>
            <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>{isNew ? "New product" : "Edit product"}</p>
            {!isNew && <p className="text-xs mt-0.5 truncate" style={{ color: "var(--medium-gray)" }}>{product.name}</p>}
          </div>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-60"
            style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--medium-gray)" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <Field label="Name" required>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} />
          </Field>

          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional description"
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" required>
              {categories.length ? (
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}>
                  <option value="">Select…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              ) : (
                <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} />
              )}
            </Field>
            <Field label="Sub-category">
              <input value={subCategory} onChange={(e) => setSubCategory(e.target.value)} placeholder="Optional"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Price (₹)" required>
              <input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="SKU">
              <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="Unit">
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs / kg"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Available qty">
              <input type="number" min="0" value={availableQuantity} onChange={(e) => setAvailableQuantity(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} />
            </Field>
            <Field label="Min stock level">
              <input type="number" min="0" value={minStockQuantity} onChange={(e) => setMinStockQuantity(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}>
                {(["draft", "active", "inactive", "archived"] as ProductStatus[]).map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </Field>
            <Field label="Visibility">
              <select value={visibility} onChange={(e) => setVisibility(e.target.value as "public" | "private")}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </Field>
          </div>

          {error && <p className="text-xs font-semibold" style={{ color: "#DC2626" }}>{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}>Cancel</button>
            <button type="submit" disabled={!canSave || saving}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: "var(--primary)" }}>
              {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
            </button>
          </div>
        </form>
      </motion.aside>
    </>
  );
};

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
      {label}{required && <span className="ml-0.5" style={{ color: "#DC2626" }}>*</span>}
    </label>
    {children}
  </div>
);
