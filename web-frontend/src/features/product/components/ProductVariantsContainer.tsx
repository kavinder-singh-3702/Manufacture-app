"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { productVariantService } from "@/src/services/productVariant";
import { ApiError } from "@/src/lib/api-error";
import type { CreateVariantInput, ProductVariant } from "@/src/types/product";
import { VariantFormDrawer } from "./VariantFormDrawer";
import { formatCurrency } from "../utils/categories";
import { STATUS_COLORS, STOCK_STATUS_COLORS } from "../utils/categories";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay },
});

const VariantCard = ({
  variant,
  canEdit,
  onEdit,
  onDelete,
}: {
  variant: ProductVariant;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const status = STATUS_COLORS[variant.status] ?? STATUS_COLORS.draft;
  const stock = variant.stockStatus ? STOCK_STATUS_COLORS[variant.stockStatus] : null;

  return (
    <motion.div
      {...fadeUp(0)}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl p-4 transition-shadow hover:shadow-md"
      style={{
        border: "1px solid var(--border)",
        backgroundColor: "var(--card)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {variant.name}
          </p>
          {variant.sku && (
            <p className="font-mono text-[11px]" style={{ color: "var(--medium-gray)" }}>
              SKU · {variant.sku}
            </p>
          )}
          {variant.options && Object.keys(variant.options).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(variant.options).map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
                >
                  {k}: {v}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{ backgroundColor: status.bg, color: status.text }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
            {status.label}
          </span>
          {stock && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ backgroundColor: stock.bg, color: stock.text }}
            >
              {stock.label}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>Price</p>
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {variant.price ? formatCurrency(variant.price.amount, variant.price.currency) : "—"}
              {variant.price?.unit && (
                <span className="text-xs font-normal" style={{ color: "var(--medium-gray)" }}> / {variant.price.unit}</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--medium-gray)" }}>Qty</p>
            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {variant.availableQuantity.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button" onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--primary-light)]"
              style={{ color: "var(--primary)" }}
              aria-label="Edit variant"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M11 4h-7v16h16v-7M19 4l-9 9M14 4h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button" onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--accent-light)]"
              style={{ color: "var(--accent)" }}
              aria-label="Delete variant"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const ProductVariantsContainer = ({
  productId,
  canEdit,
}: {
  productId: string;
  canEdit: boolean;
}) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProductVariant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductVariant | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productVariantService.list(productId, { limit: 100 });
      setVariants(res.variants);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load variants");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (v: ProductVariant) => { setEditing(v); setDrawerOpen(true); };

  const handleSubmit = async (data: CreateVariantInput) => {
    if (editing) {
      await productVariantService.update(productId, editing._id, data);
    } else {
      await productVariantService.create(productId, data);
    }
    setDrawerOpen(false);
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await productVariantService.remove(productId, deleteTarget._id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--primary)" }}>
              Variants
            </p>
            <h3 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
              {loading ? "Loading…" : `${variants.length} variant${variants.length !== 1 ? "s" : ""}`}
            </h3>
          </div>
          {!loading && variants.length > 0 && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}
            >{variants.length}</span>
          )}
        </div>
        {canEdit && (
          <button
            type="button" onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Add variant
          </button>
        )}
      </div>

      {error && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
        >
          <span>{error}</span>
          <button type="button" onClick={load} className="text-xs font-bold underline">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl"
              style={{ backgroundColor: "var(--border)", opacity: 1 - i * 0.2 }}
            />
          ))}
        </div>
      )}

      {/* Variants grid */}
      {!loading && variants.length > 0 && (
        <motion.div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } }, hidden: {} }}
        >
          {variants.map((v) => (
            <motion.div
              key={v._id}
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
            >
              <VariantCard
                variant={v}
                canEdit={canEdit}
                onEdit={() => openEdit(v)}
                onDelete={() => setDeleteTarget(v)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty */}
      {!loading && !error && variants.length === 0 && (
        <motion.div
          {...fadeUp(0)}
          className="flex flex-col items-center gap-3 rounded-2xl p-8 text-center"
          style={{ border: "1px dashed var(--border)", backgroundColor: "var(--card)" }}
        >
          <span className="text-3xl">🔖</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>No variants yet</p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>
              Add size, color, or material variants to let buyers choose.
            </p>
          </div>
          {canEdit && (
            <button
              type="button" onClick={openCreate}
              className="mt-1 rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ backgroundColor: "var(--primary)" }}
            >Add first variant</button>
          )}
        </motion.div>
      )}

      {/* Form Drawer */}
      <VariantFormDrawer
        open={drawerOpen}
        variant={editing}
        productId={productId}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
      />

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl p-6"
              style={{ backgroundColor: "var(--surface)", boxShadow: "var(--shadow-lg)" }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="m12 3 9 16H3l9-16zm0 6v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-3 text-base font-bold" style={{ color: "var(--foreground)" }}>Delete variant?</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--medium-gray)" }}>
                <strong style={{ color: "var(--foreground)" }}>{deleteTarget.name}</strong> will be removed permanently.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="rounded-xl px-4 py-2 text-sm font-semibold"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                >Cancel</button>
                <button
                  type="button" onClick={handleDelete} disabled={deleting}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                  style={{ backgroundColor: "var(--accent)" }}
                >{deleting ? "Deleting…" : "Delete"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
